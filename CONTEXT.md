# VNDtracker — Developer Context

Onboarding notes for anyone joining this project. Read this once before writing code; it covers the architecture, the conventions the codebase already follows, and a handful of non-obvious traps that have already bitten us.

For a product-level overview, see [README.md](README.md). For the authoritative feature list and what is deliberately out of scope, see [docs/SRS.md](docs/SRS.md) (written in Vietnamese).

## What this is

A personal expense tracker. The differentiator is AI receipt scanning: upload a photo of a bill or a bank-transfer screenshot, and Claude's vision model extracts the amount, date, and a suggested category so the user only has to confirm.

Live at **https://vndtracker.com**. It is a real deployment with real user accounts, not a demo — see [Production](#production) before touching anything that writes to the live database.

## Repository layout

One repo, two independently deployed apps:

```
VNDtracker/
├── VNDtracker-api/     # Express + TypeScript backend  → deployed to Render
├── VNDtracker-ui/      # React + Vite frontend         → deployed to Vercel
├── docs/SRS.md         # feature spec (Vietnamese)
├── README.md           # product overview
└── CONTEXT.md          # this file
```

There is no shared package or monorepo tooling between the two — they are plain sibling folders that happen to live in one repo, each with its own `package.json`. Install dependencies in each separately.

## Tech stack

**Backend** (`VNDtracker-api/`)
- Node.js + Express 5 + TypeScript
- PostgreSQL accessed through raw `pg` queries — **no ORM**, by choice
- JWT auth (stateless, no refresh tokens, no roles), bcrypt hashing
- `@anthropic-ai/sdk` for receipt vision extraction
- `multer` for uploads, Supabase Storage for receipt images in production
- `resend` for transactional email (password reset)

**Frontend** (`VNDtracker-ui/`)
- React 19 + TypeScript + Vite
- MUI v7 with a custom black/white theme (`src/theme/theme.ts`)
- `@mui/x-charts` (pie + line charts), `@mui/x-date-pickers` + `dayjs`
- `axios` with an interceptor-based auth client (`src/api/client.ts`)
- Hand-rolled i18n (no react-i18next) — see [i18n](#i18n)

## Running locally

You need Node.js 20+ and a local PostgreSQL instance. You do **not** need any cloud accounts — both cloud integrations have local fallbacks (see below).

**1. Database**

Create a database named `vndtracker`, then apply the schema:

```bash
psql -U postgres -d vndtracker -f VNDtracker-api/db/schema.sql
```

**2. Backend**

```bash
cd VNDtracker-api
cp .env.example .env
npm install
npm run dev
```

Fill in `.env` with your local Postgres credentials and a `JWT_SECRET` (any random string works locally). `ANTHROPIC_API_KEY` is only needed if you want to test the AI scan feature — ask the repo owner for a key, or skip it and the scan endpoint will degrade to its "couldn't read this, fill it in manually" path.

Runs on `http://localhost:3000`.

**3. Frontend**

```bash
cd VNDtracker-ui
npm install
npm run dev
```

Runs on `http://localhost:5173` and defaults to the local backend — no `.env` needed unless you want to point it elsewhere.

**Local fallbacks worth knowing:**
- **Receipt images** are written to a local `uploads/` folder unless `STORAGE_DRIVER=supabase` is set. No Supabase account needed for local work.
- **Password-reset emails** are *not* sent unless `RESEND_API_KEY` is set — instead the reset link is printed to the server console. That is the intended way to test the forgot-password flow locally: trigger it, then copy the link out of the terminal.

Never commit a `.env` file. Both are gitignored; ask the repo owner for production values privately if you actually need them.

## Backend architecture

Every feature is a self-contained module under `src/modules/<feature>/`, always with the same five files:

| File | Responsibility |
|---|---|
| `<feature>.controller.ts` | HTTP layer: validate input, call the service, shape the response. No business logic, no SQL. |
| `<feature>.service.ts` | Business rules, ownership checks, orchestration. No SQL, no `req`/`res`. |
| `<feature>.repo.ts` | All SQL lives here. Returns plain objects. |
| `<feature>.dto.ts` | TypeScript interfaces for the entity and its request payloads. |
| `<feature>.validation.ts` | Joi schemas, one per endpoint. |

Current modules: `auth`, `category`, `expense`, `ai`, `budget`. When adding a feature, follow this shape rather than inventing a new structure — the consistency is the point.

Supporting code:
- `src/routes/index.ts` — every route in the app, in one file. Adding an endpoint means registering it here.
- `src/middlewares/auth.middleware.ts` — `requireAuth`, verifies the JWT and populates `req.user`.
- `src/middlewares/error.middleware.ts` — central error handler; controllers just `next(err)`.
- `src/common/errors.ts` — typed errors (`ValidationError`, `UnauthorizedError`, `NotFoundError`, `ConflictError`) that the error middleware maps to status codes. Throw these instead of building error responses by hand.
- `src/common/apiResponse.ts` — the single response envelope, see below.
- `src/config/` — `database.ts` (pg pool), `storage.ts` (local disk vs Supabase), `email.ts` (console vs Resend), `upload.ts` (multer).

### Response envelope

Every endpoint returns the same shape, built via `ApiResponse.success()` / `ApiResponse.fail()`:

```jsonc
// success
{ "success": true, "message": "OK", "data": { }, "timestamp": "...", "path": "/expenses" }

// failure
{ "success": false, "message": "Validation failed",
  "error": { "code": "VALIDATION_ERROR", "details": [ ] },
  "timestamp": "...", "path": "/api/expenses" }
```

The frontend relies on this; don't return bare objects.

### Data isolation

Every user only ever sees their own data, and this is enforced **in the SQL**, not in the service layer. Update and delete queries are always scoped with `WHERE ... AND "userId" = $n` so a wrong id simply matches zero rows instead of touching someone else's data. Preserve that pattern in new queries.

Default categories are shared rows with `userId IS NULL`. Because the scoping above requires a matching `userId`, default categories can never be edited or deleted by a user — that protection is a side effect of the query shape, so don't "simplify" it away.

## API reference

All routes are prefixed with `/api`. Everything except register/login/forgot-password/reset-password requires an `Authorization: Bearer <token>` header.

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Returns a JWT + user |
| POST | `/auth/login` | Returns a JWT + user |
| PUT | `/auth/change-password` | Auth required; verifies current password first |
| POST | `/auth/forgot-password` | Always returns the same generic message, registered or not (prevents user enumeration) |
| POST | `/auth/reset-password` | Token is single-use and expires after 1 hour |
| GET | `/categories` | Defaults + the user's own |
| POST / PUT / DELETE | `/categories`, `/categories/:id` | Custom categories only |
| GET | `/expenses` | Filters: `month` (`YYYY-MM`), `categoryId`, `startDate`, `endDate` |
| POST / PUT / DELETE | `/expenses`, `/expenses/:id` | |
| POST | `/ai/scan` | `multipart/form-data`, field name `image`, jpg/png/webp, 5 MB cap |
| GET | `/budgets` | Limits only — spend is computed client-side |
| PUT | `/budgets` | Upsert; `categoryId: null` means the overall budget |
| DELETE | `/budgets/overall`, `/budgets/category/:categoryId` | |

`GET /health` exists outside `/api` for uptime checks.

## Database

Schema lives in `VNDtracker-api/db/schema.sql`. Four tables: `users`, `categories`, `expenses`, `budgets`.

Two conventions that are load-bearing:

**Every identifier is double-quoted.** Postgres folds unquoted identifiers to lowercase, which would break the camelCase names the entire TypeScript codebase expects. `"userId"` works; `userId` silently becomes `userid`. This applies to schema definitions *and* every query.

**Money is `BIGINT`, never `DECIMAL`.** VND has no decimal subunit, so amounts are stored as whole dong.

### Migrations are manual

There is no migration tool. `schema.sql` is the source of truth for a *fresh* database, but changing it does not update any existing database. When you add or alter a column you must:

1. Edit `schema.sql` (so fresh clones get it),
2. Run the equivalent `ALTER TABLE` against your local database,
3. Tell the repo owner, so it can be applied to production before the code deploys.

Deploying code that expects a column production doesn't have will break the live app. This ordering matters.

## Frontend architecture

```
src/
├── api/          # one file per backend module + client.ts (axios instance)
├── pages/        # one file per route
├── components/   # shared UI (Layout, ProtectedRoute, CategoryDot, dialogs)
├── i18n/         # index.tsx (context/provider) + en.ts + vi.ts
├── theme/        # MUI theme
├── types/        # shared TypeScript interfaces, mirrors backend DTOs
└── utils/        # auth token storage, category colors/labels
```

Routing is in `App.tsx`. Authenticated pages are nested under a single `<ProtectedRoute><Layout /></ProtectedRoute>` parent route; `Layout` renders the app bar and an `<Outlet />`.

State is deliberately plain — `useState` + `useEffect` per page, no Redux/Zustand/React Query. Pages fetch what they need on mount. Keep it that way unless there is a real reason not to.

### i18n

English is the default; Vietnamese is a runtime toggle. Two dictionaries, `src/i18n/en.ts` and `src/i18n/vi.ts`, consumed via `useLanguage()` which exposes `t()`, `language`, `currencySymbol`, and `formatCurrency()`.

`vi.ts` is typed as `Record<keyof typeof en, string>`, so **a key you add to `en.ts` without adding to `vi.ts` is a compile error, not a silently blank string at runtime**. If `tsc` complains about a missing property in `vi.ts`, that is the system working.

Default categories are stored as a `nameKey` (`food`, `transport`, …) and translated through the dictionary; user-created categories are stored as free text and never translated. `utils/categoryLabels.ts` resolves either case — use it rather than reading `category.name` directly.

Note the currency symbol (`đ` / `$`) is a **display toggle only** and is intentionally independent of the language setting. It does not convert amounts. Do not wire it back to the language.

## Gotchas

These are real bugs that already happened. Each is silent — wrong output rather than a crash — which is exactly why they are worth knowing in advance.

**`BIGINT` columns come back as JavaScript strings.** The `pg` driver does this to avoid precision loss. It broke the dashboard total via string concatenation (`0 + "50000"` → `"050000"`) while TypeScript happily claimed the field was a `number`. Every repo that reads a BIGINT converts it with `Number(...)` immediately — see `mapRow()` in `expense.repo.ts` and the equivalent in `budget.repo.ts`. Any new BIGINT column needs the same treatment, and you should sanity-check sums in the browser, not just single rows.

**Do not remove the type-parser overrides in `config/database.ts`.** `pg` parses `DATE`/`TIMESTAMP` into JS `Date` objects, which then serialize back to UTC ISO strings — shifting the value by a timezone offset. Sending `expenseDate: "2026-08-08"` came back as `"2026-08-07T14:30:00.000Z"`: the wrong calendar day, with no error. The fix disables that conversion so Postgres values pass through as raw strings. The app treats these columns as plain `YYYY-MM-DD` text throughout and never does timezone math.

**Never compare a timestamp column against SQL `NOW()`.** Our `TIMESTAMP` columns are naive (no timezone) and hold UTC wall-clock digits, but `NOW()` returns a `timestamptz`. Comparing them makes Postgres cast `NOW()` through the *database session's* timezone — which turned out to be `Asia/Bangkok` on both local and Supabase, unrelated to anything the app intends. This made valid password-reset tokens look expired. Compute the comparison value in JS instead and pass it as a parameter; see `toNaiveUtcString()` in `auth.repo.ts`.

**Render's build command must be `npm install --include=dev && npm run build`.** Because `NODE_ENV=production` is set on the service, a plain `npm install` skips `devDependencies` — where `typescript` and every `@types/*` package live — so `tsc` fails with dozens of confusing "cannot find module" errors even though the code is fine. This is configured in the Render dashboard, not in the repo.

## Production

| Piece | Where |
|---|---|
| Frontend | Vercel, custom domain `vndtracker.com` (DNS on Cloudflare) |
| Backend | Render free web service, `vndtracker.onrender.com` |
| Database + receipt images | Supabase (Postgres + a public `receipts` bucket) |
| Password-reset email | Resend, sending from the verified `vndtracker.com` domain |

Deployment is automatic: **merging to `main` triggers a build on both Render and Vercel.** No Docker, no manual deploy step. The only thing that is *not* automatic is database migrations (see above).

Two things to expect:
- The Render free tier **sleeps after 15 minutes of inactivity**, so the first request after a quiet period takes 30–50 seconds. This is a known tradeoff, not a bug.
- The DNS record for `vndtracker.com` must stay **Cloudflare proxy disabled (DNS only)** — proxying breaks Vercel's TLS and routing.

**The production database contains real user accounts.** Do not run destructive SQL against it, and do not test with someone's real account. Testing against production is fine when it goes through a throwaway account you create and delete afterwards.

Secrets (database URL, JWT secret, Anthropic key, Supabase service key, Resend key) live in the Render and Vercel dashboards and are not in the repo. Ask the repo owner if you need them.

## Working agreements

- **New features get a branch and a PR** (`feature/<name>` → PR → merge). Bug fixes go straight to `main`.
- **Verify against something real before calling it done.** The habit in this project is: build, exercise the endpoint with `curl` using a real token, then click through the actual UI in a browser — not just "it compiles" or "the test passes". Clean up any test data you create.
- **Match the surrounding code.** Same module shape, same naming, same comment density. Comments here explain *why* something non-obvious is the way it is, not what the line does.
- Run `npm run build` in both apps before opening a PR; `tsc` catches the i18n and type-mirroring mistakes that are easy to miss.
