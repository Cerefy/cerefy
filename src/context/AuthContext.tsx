// src/context/AuthContext.tsx
// Production auth context with JWT management, token refresh, and user state

import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, UserProfile } from '../api/auth';
import socketService from '../api/socket';
import { useAgentStore } from '../store/useAgentStore';
import { isBrowser, readStorage, removeStorage } from '../lib/browser';

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, organizationName?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // mirror authenticated user into the global agent store so UI can react
  const setCurrentUser = useAgentStore((s) => s.setCurrentUser);

  // Attempt to restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      if (!isBrowser) {
        setIsLoading(false);
        return;
      }

      const token = readStorage('cerefy_access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const profile = await authApi.me();
        setUser(profile);
        socketService.connect();
        setCurrentUser(profile);
      } catch {
        // Token expired — try refresh
        try {
          await authApi.refresh();
          const profile = await authApi.me();
          setUser(profile);
          socketService.connect();
          setCurrentUser(profile);
        } catch {
          removeStorage('cerefy_access_token');
          removeStorage('cerefy_refresh_token');
          setCurrentUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();

    if (!isBrowser) {
      return;
    }

    // Listen for forced logout events from axios interceptor
    const handleForcedLogout = () => {
      setUser(null);
      socketService.disconnect();
      setCurrentUser(null);
    };
    window.addEventListener('cerefy:auth:logout', handleForcedLogout);
    return () => {
      window.removeEventListener('cerefy:auth:logout', handleForcedLogout);
    };
  }, [setCurrentUser]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      setUser(response.user);
      socketService.connect();
      setCurrentUser(response.user);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUser]);

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string, organizationName?: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.register({ email, password, firstName, lastName, organizationName });
      setUser(response.user);
      socketService.connect();
      setCurrentUser(response.user);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      socketService.disconnect();
      setCurrentUser(null);
    }
  }, [setCurrentUser]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, isLoading, error, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
