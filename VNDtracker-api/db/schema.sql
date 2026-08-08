-- VNDtracker database schema
-- Covers FR module 3.1 (Auth), 3.2 (Category), 3.3+3.4 (Expense, manual + AI)
-- Budget (3.6) / Group (3.7) tables not created yet — sẽ thêm khi làm tới Phase 3

CREATE TABLE users (
  userId        INT IDENTITY(1,1) PRIMARY KEY,
  email         NVARCHAR(255)  NOT NULL UNIQUE,
  passwordHash  NVARCHAR(255)  NOT NULL,
  name          NVARCHAR(100)  NOT NULL,
  createdAt     DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- userId NULL = danh mục mặc định (global, dùng chung mọi user)
-- nameKey dùng cho danh mục mặc định (tra tên hiển thị qua file i18n vi/en)
-- name dùng cho danh mục user tự tạo (free text, không dịch)
CREATE TABLE categories (
  categoryId  INT IDENTITY(1,1) PRIMARY KEY,
  userId      INT NULL REFERENCES users(userId) ON DELETE CASCADE,
  nameKey     NVARCHAR(50)  NULL,
  name        NVARCHAR(100) NULL,
  icon        NVARCHAR(50)  NULL,
  color       VARCHAR(7)    NULL,
  isDefault   BIT           NOT NULL DEFAULT 0,
  createdAt   DATETIME2     NOT NULL DEFAULT GETDATE(),
  CONSTRAINT CK_categories_nameSource CHECK (
    (isDefault = 1 AND nameKey IS NOT NULL) OR
    (isDefault = 0 AND name IS NOT NULL)
  )
);

-- amount: VND không có phần thập phân -> BIGINT, không dùng DECIMAL
-- source: 'manual' (FR-3.x) | 'ai' (FR-4.x)
-- inputType: chỉ có giá trị khi source = 'ai' -> 'bill' | 'transfer' (FR-4.1)
CREATE TABLE expenses (
  expenseId         INT IDENTITY(1,1) PRIMARY KEY,
  userId             INT NOT NULL REFERENCES users(userId) ON DELETE CASCADE,
  categoryId         INT NOT NULL REFERENCES categories(categoryId),
  amount             BIGINT NOT NULL CHECK (amount > 0),
  expenseDate        DATE NOT NULL,
  note               NVARCHAR(500) NULL,
  receiptImagePath   NVARCHAR(500) NULL,
  source             VARCHAR(10) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai')),
  inputType          VARCHAR(10) NULL CHECK (inputType IN ('bill', 'transfer')),
  createdAt          DATETIME2 NOT NULL DEFAULT GETDATE(),
  updatedAt          DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX IX_expenses_user_date ON expenses(userId, expenseDate DESC);
CREATE INDEX IX_expenses_user_category ON expenses(userId, categoryId);

-- Seed: danh mục mặc định (global, userId = NULL)
-- nameKey phải khớp key trong VNDtracker-ui/src/i18n/en.json và vi.json khi làm i18n
INSERT INTO categories (userId, nameKey, isDefault) VALUES
  (NULL, 'food', 1),
  (NULL, 'transport', 1),
  (NULL, 'bills', 1),
  (NULL, 'entertainment', 1),
  (NULL, 'shopping', 1),
  (NULL, 'other', 1);
