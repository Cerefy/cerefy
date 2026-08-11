// src/components/shell/AppShell.tsx
// Target-architecture application shell: AuthGuard + Sidebar + Navbar + Outlet.
//
// AuthGuard honors the "refresh must never silently log out" rule: while the
// session is being restored it renders LoadingState instead of redirecting;
// after restore it either renders the workspace or routes to /login.

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../lib/i18n';
import { Sidebar } from '../Sidebar';
import { Navbar } from '../Navbar';
import { LoadingState } from '../design-system';

/* --------------------------------------------
   AUTH GUARD
   -------------------------------------------- */

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="w-full max-w-md px-6">
          <LoadingState label={t('auth.restoring')} rows={2} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

/* --------------------------------------------
   APP SHELL — authenticated chrome + outlet
   -------------------------------------------- */

export const AppShell: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="w-full max-w-md px-6">
          <LoadingState label="Restoring session" rows={2} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest font-body text-on-surface">
      <Sidebar />
      <div className="md:ps-64">
        <Navbar />
        <main className="pt-14 px-6 py-6 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};