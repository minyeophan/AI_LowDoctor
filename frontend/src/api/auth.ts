// src/api/auth.ts
import { apiClient } from './client';
import { User, LoginCredentials, SignupData } from '../types';

interface LoginResponse {
  user: User;
  token: string;
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    return apiClient<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  signup: async (data: SignupData): Promise<LoginResponse> => {
    return apiClient<LoginResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: async (): Promise<void> => {
    return apiClient<void>('/api/auth/logout', {
      method: 'POST',
    });
  },

  getMe: async (): Promise<User> => {
    return apiClient<User>('/api/auth/me');
  },
};