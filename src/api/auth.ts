// src/api/auth.ts
// Authentication API service — register, login, refresh, logout, me

import api from './axios';
import { readStorage, removeStorage, writeStorage } from '../lib/browser';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  organizationName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/v1/auth/register', data);
    const { tokens } = response.data;
    writeStorage('cerefy_access_token', tokens.accessToken);
    writeStorage('cerefy_refresh_token', tokens.refreshToken);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/v1/auth/login', data);
    const { tokens } = response.data;
    writeStorage('cerefy_access_token', tokens.accessToken);
    writeStorage('cerefy_refresh_token', tokens.refreshToken);
    return response.data;
  },

  async refresh(): Promise<AuthTokens> {
    const refreshToken = readStorage('cerefy_refresh_token');
    if (!refreshToken) throw new Error('No refresh token');
    const response = await api.post<AuthTokens>('/api/v1/auth/refresh', { refreshToken });
    const tokens = response.data;
    writeStorage('cerefy_access_token', tokens.accessToken);
    writeStorage('cerefy_refresh_token', tokens.refreshToken);
    return tokens;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/v1/auth/logout');
    } finally {
      removeStorage('cerefy_access_token');
      removeStorage('cerefy_refresh_token');
      removeStorage('cerefy_user');
    }
  },

  async me(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/api/v1/auth/me');
    return response.data;
  },
};
