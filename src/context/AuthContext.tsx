// src/context/AuthContext.tsx
// Production auth context with Firebase authentication, JWT management, and optional local fallback

import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, UserProfile } from '../api/auth';
import socketService from '../api/socket';
import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from '../lib/firebase';
import { useAgentStore } from '../store/useAgentStore';

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

function mapFirebaseUserToProfile(user: User): UserProfile {
  const displayName = user.displayName || '';
  const [firstName = 'Cerefy', ...remaining] = displayName.split(' ');
  const lastName = remaining.join(' ') || 'User';

  return {
    id: user.uid,
    email: user.email || 'unknown@cerefy.local',
    firstName,
    lastName,
    role: 'member',
    organizationId: 'org_cerefy_101',
    organizationName: 'Cerefy Enterprise',
    avatarUrl:
      user.photoURL ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + '+' + lastName)}&background=111827&color=00ffff`,
    createdAt: user.metadata.creationTime || new Date().toISOString(),
  };
}

async function setFirebaseAccessToken(user: User): Promise<string> {
  const idToken = await user.getIdToken();
  localStorage.setItem('cerefy_access_token', idToken);
  return idToken;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setCurrentUser = useAgentStore((s) => s.setCurrentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await setFirebaseAccessToken(firebaseUser);
          const profile = mapFirebaseUserToProfile(firebaseUser);
          setUser(profile);
          setCurrentUser(profile);
          socketService.connect();
        } catch (err) {
          console.warn('AuthContext: failed to initialize Firebase session', err);
        }
      } else {
        const refreshToken = localStorage.getItem('cerefy_refresh_token');
        if (refreshToken) {
          try {
            await authApi.refresh();
            const profile = await authApi.me();
            setUser(profile);
            setCurrentUser(profile);
            socketService.connect();
          } catch {
            localStorage.removeItem('cerefy_access_token');
            localStorage.removeItem('cerefy_refresh_token');
            setUser(null);
            setCurrentUser(null);
          }
        } else {
          setUser(null);
          setCurrentUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setCurrentUser]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profile = mapFirebaseUserToProfile(credential.user);
      await setFirebaseAccessToken(credential.user);
      setUser(profile);
      setCurrentUser(profile);
      socketService.connect();
    } catch (firebaseError: unknown) {
      try {
        const response = await authApi.login({ email, password });
        const profile = response.user;
        localStorage.setItem('cerefy_access_token', response.tokens.accessToken);
        localStorage.setItem('cerefy_refresh_token', response.tokens.refreshToken);
        setUser(profile);
        setCurrentUser(profile);
        socketService.connect();
      } catch (error: any) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Login failed. Please check your credentials.';
        setError(message);
        throw firebaseError;
      }
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUser]);

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string, organizationName?: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: `${firstName} ${lastName}` });
      await setFirebaseAccessToken(credential.user);
      const profile = mapFirebaseUserToProfile(credential.user);
      setUser(profile);
      setCurrentUser(profile);
      socketService.connect();
    } catch (firebaseError: unknown) {
      try {
        const response = await authApi.register({ email, password, firstName, lastName, organizationName });
        const profile = response.user;
        localStorage.setItem('cerefy_access_token', response.tokens.accessToken);
        localStorage.setItem('cerefy_refresh_token', response.tokens.refreshToken);
        setUser(profile);
        setCurrentUser(profile);
        socketService.connect();
      } catch (error: any) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Registration failed.';
        setError(message);
        throw firebaseError;
      }
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      try {
        await authApi.logout();
      } catch {
        // ignore logout fallback failures
      }
    } finally {
      localStorage.removeItem('cerefy_access_token');
      localStorage.removeItem('cerefy_refresh_token');
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
