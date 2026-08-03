// src/lib/apiClient.ts
// Simple wrapper around fetch for the frontend.
// All API endpoints are relative to the same origin (Vite dev server proxies /api to the Express backend).

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export async function apiGet<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(url, { method: 'GET', credentials: 'include', ...init });
  return handleResponse<T>(response);
}

export async function apiPost<T, B>(url: string, body: B, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    body: JSON.stringify(body),
    ...init,
  });
  return handleResponse<T>(response);
}

export async function apiPut<T, B>(url: string, body: B, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    body: JSON.stringify(body),
    ...init,
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(url, { method: 'DELETE', credentials: 'include', ...init });
  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  if (!response.ok) {
    return { data: data as T, error: `HTTP ${response.status}: ${response.statusText}` };
  }
  return { data: data as T };
}
