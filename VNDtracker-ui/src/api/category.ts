import client from './client';
import type { ApiResponse, Category, CreateCategoryRequest } from '../types';

export const getCategoriesApi = async () => {
  const response = await client.get<ApiResponse<Category[]>>('/categories');
  return response.data;
};

export const createCategoryApi = async (dto: CreateCategoryRequest) => {
  const response = await client.post<ApiResponse<Category>>('/categories', dto);
  return response.data;
};

export const updateCategoryApi = async (categoryId: number, dto: CreateCategoryRequest) => {
  const response = await client.put<ApiResponse<Category>>(`/categories/${categoryId}`, dto);
  return response.data;
};

export const deleteCategoryApi = async (categoryId: number) => {
  const response = await client.delete<ApiResponse<null>>(`/categories/${categoryId}`);
  return response.data;
};
