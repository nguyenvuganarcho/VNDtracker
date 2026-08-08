-- VNDtracker database schema (PostgreSQL)
-- Covers FR module 3.1 (Auth), 3.2 (Category), 3.3+3.4 (Expense, manual + AI)
-- Budget (3.6) / Group (3.7) tables not created yet — sẽ thêm khi làm tới Phase 3
--
-- Identifiers are double-quoted everywhere to preserve the camelCase naming
-- used throughout the TypeScript codebase — Postgres folds unquoted
-- identifiers to lowercase by default, which would otherwise force every
-- DTO/type in the app to change too. Migrated from MSSQL 2026-08-08.

CREATE TABLE "users" (
  "userId"        SERIAL PRIMARY KEY,
  "email"         VARCHAR(255)  NOT NULL UNIQUE,
  "passwordHash"  VARCHAR(255)  NOT NULL,
  "name"          VARCHAR(100)  NOT NULL,
  "createdAt"     TIMESTAMP     NOT NULL DEFAULT NOW()
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

-- Seed: danh mục mặc định (global, "userId" = NULL)
-- "nameKey" phải khớp key trong VNDtracker-ui/src/i18n/en.ts và vi.ts
INSERT INTO "categories" ("userId", "nameKey", "isDefault") VALUES
  (NULL, 'food', TRUE),
  (NULL, 'transport', TRUE),
  (NULL, 'bills', TRUE),
  (NULL, 'entertainment', TRUE),
  (NULL, 'shopping', TRUE),
  (NULL, 'other', TRUE);
