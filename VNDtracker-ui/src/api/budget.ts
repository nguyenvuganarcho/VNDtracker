import client from './client';
import type { ApiResponse, Budget, UpsertBudgetRequest } from '../types';

export const getBudgetsApi = async () => {
  const response = await client.get<ApiResponse<Budget[]>>('/budgets');
  return response.data;
};

export const upsertBudgetApi = async (dto: UpsertBudgetRequest) => {
  const response = await client.put<ApiResponse<Budget>>('/budgets', dto);
  return response.data;
};

export const deleteOverallBudgetApi = async () => {
  const response = await client.delete<ApiResponse<null>>('/budgets/overall');
  return response.data;
};

export const deleteCategoryBudgetApi = async (categoryId: number) => {
  const response = await client.delete<ApiResponse<null>>(`/budgets/category/${categoryId}`);
  return response.data;
};
