import client from './client';
import type {
  ApiResponse,
  AuthResponseData,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '../types';

export const registerApi = async (dto: RegisterRequest) => {
  const response = await client.post<ApiResponse<AuthResponseData>>('/auth/register', dto);
  return response.data;
};

export const loginApi = async (dto: LoginRequest) => {
  const response = await client.post<ApiResponse<AuthResponseData>>('/auth/login', dto);
  return response.data;
};

export const changePasswordApi = async (dto: ChangePasswordRequest) => {
  const response = await client.put<ApiResponse<null>>('/auth/change-password', dto);
  return response.data;
};

export const forgotPasswordApi = async (dto: ForgotPasswordRequest) => {
  const response = await client.post<ApiResponse<null>>('/auth/forgot-password', dto);
  return response.data;
};

export const resetPasswordApi = async (dto: ResetPasswordRequest) => {
  const response = await client.post<ApiResponse<null>>('/auth/reset-password', dto);
  return response.data;
};
