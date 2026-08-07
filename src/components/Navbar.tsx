// src/components/Navbar.tsx
// Enterprise Top Navigation Bar - Premium Design System

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAgentStore } from '../store/useAgentStore';
import { LogoIcon } from './LogoIcon';
import {
  Bell,
  Search,
  Settings,
  User,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, activeRole } = useAgentStore();

  const isWorkspace = location.pathname.startsWith('/workspace');
  const isAdmin = location.pathname.startsWith('/admin');

  const appMode = isAdmin ? 'ADMIN' : isWorkspace ? 'WORKSPACE' : 'PUBLIC';

  return (
    <header className="h-16 ml-64 sticky top-0 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 z-40 px-8 flex justify-between items-center transition-all duration-300">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search agents, documents, decisions..."
            className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm w-80 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-surface-container rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-on-surface-variant" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-surface-container rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-on-surface-variant" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
          <div className="text-right">
            <p className="text-xs font-bold text-on-surface">
              {currentUser?.name || currentUser?.email || 'System Admin'}
            </p>
            <p className="text-[10px] text-on-surface-variant">
              {activeRole || 'TENANT_ADMIN'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
            <User className="w-4 h-4 text-on-secondary-container" />
          </div>
        </div>
      </div>
    </header>
  );
};
