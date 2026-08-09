export interface Budget {
  budgetId: number;
  userId: number;
  categoryId: number | null;
  limitAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertBudgetDto {
  categoryId: number | null;
  limitAmount: number;
}
