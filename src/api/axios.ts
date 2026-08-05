// src/api/axios.ts
// Production-ready Axios instance with JWT interceptors and token refresh

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { auth } from '../lib/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach access token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = localStorage.getItem('cerefy_access_token');

    if (!token && auth.currentUser) {
      token = await auth.currentUser.getIdToken();
      localStorage.setItem('cerefy_access_token', token);
    }

    if (token && config.headers) {
      config.headers.Authorization = 'Bearer ' + token;
    }

    const tenantId = localStorage.getItem('cerefy_tenant_id') || 'tenant_cerefy_101';
    if (config.headers) {
      config.headers['x-tenant-id'] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = 'Bearer ' + token;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        let accessToken: string | null = null;

        if (auth.currentUser) {
          accessToken = await auth.currentUser.getIdToken(true);
          localStorage.setItem('cerefy_access_token', accessToken);
        } else {
          const refreshToken = localStorage.getItem('cerefy_refresh_token');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refreshToken,
          });

          accessToken = data.accessToken;
          localStorage.setItem('cerefy_access_token', accessToken);
          localStorage.setItem('cerefy_refresh_token', data.refreshToken);
        }

        processQueue(null, accessToken);

        if (originalRequest.headers && accessToken) {
          originalRequest.headers.Authorization = 'Bearer ' + accessToken;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        localStorage.removeItem('cerefy_access_token');
        localStorage.removeItem('cerefy_refresh_token');
        window.dispatchEvent(new CustomEvent('cerefy:auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
