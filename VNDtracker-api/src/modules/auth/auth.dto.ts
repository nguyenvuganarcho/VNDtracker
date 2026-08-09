export interface User {
  userId: number;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface UserResponseDto {
  userId: number;
  email: string;
  name: string;
}

export interface AuthResponseDto {
  accessToken: string;
  user: UserResponseDto;
}

export interface TokenPayload {
  userId: number;
  email: string;
  name: string;
}
