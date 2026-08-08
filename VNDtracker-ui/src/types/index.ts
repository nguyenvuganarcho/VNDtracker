export interface User {
  userId: number;
  email: string;
  name: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponseData {
  accessToken: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export interface Category {
  categoryId: number;
  userId: number | null;
  nameKey: string | null;
  name: string | null;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface Expense {
  expenseId: number;
  userId: number;
  categoryId: number;
  amount: number;
  expenseDate: string;
  note: string | null;
  receiptImagePath: string | null;
  source: 'manual' | 'ai';
  inputType: 'bill' | 'transfer' | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  categoryId: number;
  amount: number;
  expenseDate: string;
  note?: string;
  source?: 'manual' | 'ai';
  inputType?: 'bill' | 'transfer';
  receiptImagePath?: string;
}

export interface ExpenseFilters {
  month?: string;
  categoryId?: number;
}

export interface ScanReceiptResult {
  aiReadable: boolean;
  inputType: 'bill' | 'transfer' | null;
  expenseDate: string | null;
  amount: number | null;
  note: string;
  categoryId: number | null;
  receiptImagePath: string;
}
