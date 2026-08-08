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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseDto {
  categoryId: number;
  amount: number;
  expenseDate: string;
  note?: string;
}

export interface UpdateExpenseDto {
  categoryId: number;
  amount: number;
  expenseDate: string;
  note?: string;
}

export interface ExpenseFilterQuery {
  month?: string;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
}
