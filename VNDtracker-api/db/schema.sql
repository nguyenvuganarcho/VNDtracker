-- VNDtracker database schema (PostgreSQL)
-- Covers FR module 3.1 (Auth), 3.2 (Category), 3.3+3.4 (Expense, manual + AI)
-- Budget (3.6) / Group (3.7) tables not created yet — sẽ thêm khi làm tới Phase 3
--
-- Identifiers are double-quoted everywhere to preserve the camelCase naming
-- used throughout the TypeScript codebase — Postgres folds unquoted
-- identifiers to lowercase by default, which would otherwise force every
-- DTO/type in the app to change too. Migrated from MSSQL 2026-08-08.

-- passwordResetTokenHash stores a sha256 hash of the reset token, never the
-- raw token -- the raw token only ever exists in the emailed link, so a DB
-- leak alone can't be used to reset anyone's password.
CREATE TABLE "users" (
  "userId"                  SERIAL PRIMARY KEY,
  "email"                   VARCHAR(255)  NOT NULL UNIQUE,
  "passwordHash"            VARCHAR(255)  NOT NULL,
  "name"                    VARCHAR(100)  NOT NULL,
  "passwordResetTokenHash"  VARCHAR(64)   NULL,
  "passwordResetExpiry"     TIMESTAMP     NULL,
  "createdAt"               TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- "userId" NULL = danh mục mặc định (global, dùng chung mọi user)
-- "nameKey" dùng cho danh mục mặc định (tra tên hiển thị qua file i18n vi/en)
-- "name" dùng cho danh mục user tự tạo (free text, không dịch)
CREATE TABLE "categories" (
  "categoryId"  SERIAL PRIMARY KEY,
  "userId"      INTEGER NULL REFERENCES "users"("userId") ON DELETE CASCADE,
  "nameKey"     VARCHAR(50)  NULL,
  "name"        VARCHAR(100) NULL,
  "icon"        VARCHAR(50)  NULL,
  "color"       VARCHAR(7)   NULL,
  "isDefault"   BOOLEAN      NOT NULL DEFAULT FALSE,
  "createdAt"   TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT "CK_categories_nameSource" CHECK (
    ("isDefault" = TRUE AND "nameKey" IS NOT NULL) OR
    ("isDefault" = FALSE AND "name" IS NOT NULL)
  )
);

-- amount: VND không có phần thập phân -> BIGINT, không dùng DECIMAL/NUMERIC
-- source: 'manual' (FR-3.x) | 'ai' (FR-4.x)
-- inputType: chỉ có giá trị khi source = 'ai' -> 'bill' | 'transfer' (FR-4.1)
CREATE TABLE "expenses" (
  "expenseId"         SERIAL PRIMARY KEY,
  "userId"            INTEGER NOT NULL REFERENCES "users"("userId") ON DELETE CASCADE,
  "categoryId"        INTEGER NOT NULL REFERENCES "categories"("categoryId"),
  "amount"            BIGINT NOT NULL CHECK ("amount" > 0),
  "expenseDate"       DATE NOT NULL,
  "note"              VARCHAR(500) NULL,
  "receiptImagePath"  VARCHAR(500) NULL,
  "source"            VARCHAR(10) NOT NULL DEFAULT 'manual' CHECK ("source" IN ('manual', 'ai')),
  "inputType"         VARCHAR(10) NULL CHECK ("inputType" IN ('bill', 'transfer')),
  "createdAt"         TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "IX_expenses_user_date" ON "expenses"("userId", "expenseDate" DESC);
CREATE INDEX "IX_expenses_user_category" ON "expenses"("userId", "categoryId");

-- "categoryId" NULL = ngân sách tổng (overall). Hạn mức cố định, áp dụng
-- cho mọi tháng -- không có cột "month", đơn giản hơn bản phác thảo ban đầu
-- (set 1 lần, không phải nhập lại mỗi tháng).
CREATE TABLE "budgets" (
  "budgetId"    SERIAL PRIMARY KEY,
  "userId"      INTEGER NOT NULL REFERENCES "users"("userId") ON DELETE CASCADE,
  "categoryId"  INTEGER NULL REFERENCES "categories"("categoryId") ON DELETE CASCADE,
  "limitAmount" BIGINT NOT NULL CHECK ("limitAmount" > 0),
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- At most one overall budget (categoryId NULL) per user, and at most one
-- budget per (user, category) pair -- a plain UNIQUE(userId, categoryId)
-- wouldn't stop multiple NULL rows since Postgres treats NULLs as distinct.
CREATE UNIQUE INDEX "UQ_budgets_overall" ON "budgets"("userId") WHERE "categoryId" IS NULL;
CREATE UNIQUE INDEX "UQ_budgets_category" ON "budgets"("userId", "categoryId") WHERE "categoryId" IS NOT NULL;

-- Seed: danh mục mặc định (global, "userId" = NULL)
-- "nameKey" phải khớp key trong VNDtracker-ui/src/i18n/en.ts và vi.ts
INSERT INTO "categories" ("userId", "nameKey", "isDefault") VALUES
  (NULL, 'food', TRUE),
  (NULL, 'transport', TRUE),
  (NULL, 'bills', TRUE),
  (NULL, 'entertainment', TRUE),
  (NULL, 'shopping', TRUE),
  (NULL, 'other', TRUE);
