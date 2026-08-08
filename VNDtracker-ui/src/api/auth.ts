import client from './client';
import type { ApiResponse, AuthResponseData, LoginRequest, RegisterRequest } from '../types';

export const registerApi = async (dto: RegisterRequest) => {
  const response = await client.post<ApiResponse<AuthResponseData>>('/auth/register', dto);
  return response.data;
};

export const loginApi = async (dto: LoginRequest) => {
  const response = await client.post<ApiResponse<AuthResponseData>>('/auth/login', dto);
  return response.data;
};
