import client from './client';
import type { ApiResponse, CreateExpenseRequest, Expense, ExpenseFilters } from '../types';

export const getExpensesApi = async (filters: ExpenseFilters = {}) => {
  const response = await client.get<ApiResponse<Expense[]>>('/expenses', { params: filters });
  return response.data;
};

export const createExpenseApi = async (dto: CreateExpenseRequest) => {
  const response = await client.post<ApiResponse<Expense>>('/expenses', dto);
  return response.data;
};

export const updateExpenseApi = async (expenseId: number, dto: CreateExpenseRequest) => {
  const response = await client.put<ApiResponse<Expense>>(`/expenses/${expenseId}`, dto);
  return response.data;
};

export const deleteExpenseApi = async (expenseId: number) => {
  const response = await client.delete<ApiResponse<null>>(`/expenses/${expenseId}`);
  return response.data;
};
