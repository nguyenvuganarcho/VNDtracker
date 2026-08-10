# VNDtracker

A personal expense tracker with one core idea: **photograph a receipt or a bank-transfer screenshot and let AI record the expense for you.** No manual data entry required — snap, review, save.

**Live app**: https://vndtracker.com
*(Backend runs on a free-tier instance that sleeps after 15 minutes of inactivity — the first request after a while may take 30-50s to wake up.)*

**Contributing?** Start with [CONTEXT.md](CONTEXT.md) — architecture, conventions, local setup, and the non-obvious gotchas.

## Why

Manually logging every expense is tedious enough that most people give up after a week. VNDtracker removes the friction: upload a photo of a receipt or a bank transfer confirmation, and Claude's vision model reads the amount, date, and likely category, so you only have to confirm and save.

## Features

- **AI receipt/transfer scanning** — upload a bill photo or a bank-transfer screenshot; Claude extracts the amount, date, and suggests a category. Falls back to "Other" when it isn't confident, and always leaves the result open for manual correction before saving.
- **Manual expense CRUD** with month and category filters
- **Dashboard** — monthly total, category breakdown (pie chart), spending trend over the last 6 months (line chart), recent expenses
- **CSV export** of any filtered expense list
- **Custom categories**, alongside a set of sensible defaults
- **English / Vietnamese** UI, switchable at runtime
- **Currency display toggle** (đ / $) — display-only, does not convert amounts
- **Account security** — change password while signed in, or reset a forgotten one via an emailed link (single-use, expires in 1 hour)

## Tech stack

**Backend** — `VNDtracker-api/`
- Node.js, Express 5, TypeScript
- PostgreSQL (raw `pg`, no ORM)
- JWT authentication, bcrypt password hashing
- Claude API (`@anthropic-ai/sdk`) for receipt/transfer vision extraction, using forced tool-use for reliable structured output
- Multer for uploads, Supabase Storage for receipt images in production

**Frontend** — `VNDtracker-ui/`
- React 19, TypeScript, Vite
- MUI v7 (custom black/white theme, not the framework default)
- `@mui/x-charts` for the dashboard charts
- `@mui/x-date-pickers` + `dayjs`
- Lightweight custom i18n (typed EN/VI dictionaries — a missing translation key is a compile error, not a runtime blank string)

**Infrastructure** (all free tier)
- Frontend hosted on Vercel, on a custom domain (`vndtracker.com`)
- Backend hosted on Render
- Database + object storage on Supabase
- Transactional email (password reset) via Resend

No Docker — each host builds and deploys directly from this Git repo.

## Project structure

```
VNDtracker/
├── VNDtracker-api/     # Express + TypeScript backend
│   ├── src/
│   │   ├── modules/    # auth, category, expense, ai — each with controller/service/repo/dto/validation
│   │   ├── config/     # database, storage, upload
│   │   └── middlewares/
│   └── db/schema.sql
├── VNDtracker-ui/       # React + Vite frontend
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── api/
│       └── i18n/
└── docs/SRS.md          # full functional spec
```

## Running locally

Requires Node.js and a local PostgreSQL instance.

```bash
# Backend
cd VNDtracker-api
cp .env.example .env    # fill in DB credentials, JWT_SECRET, ANTHROPIC_API_KEY
npm install
psql -U postgres -d vndtracker -f db/schema.sql
npm run dev              # http://localhost:3000

# Frontend
cd VNDtracker-ui
npm install
npm run dev               # http://localhost:5173
```

By default the backend stores uploaded receipt images on local disk. Set `STORAGE_DRIVER=supabase` (with `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `SUPABASE_STORAGE_BUCKET`) to use Supabase Storage instead, as production does.

## Scope notes

Built and reviewed feature-by-feature, based on the spec in [`docs/SRS.md`](docs/SRS.md). Deliberately out of scope for v1: multi-currency, shared/group expenses, budgets, and camera capture (upload-only for now — camera is planned once there's a mobile app).
