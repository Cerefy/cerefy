// src/components/Sidebar.tsx
// Enterprise Sidebar Navigation - Premium Design System

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Brain,
  FolderKanban,
  FileText,
  Calendar,
  CheckSquare,
  Workflow,
  BarChart3,
  Blocks,
  Settings,
  Shield,
  Activity,
  Network,
  Database,
  Terminal,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { path: '/workspace/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/workspace/command-center', label: 'AI Command Center', icon: Bot, badge: 'Primary' },
  { path: '/workspace/agents', label: 'Agent Studio', icon: Bot, badge: '40+' },
  { path: '/workspace/memory', label: 'Enterprise Memory', icon: Brain, badge: '6 Tiers' },
  { path: '/workspace/knowledge', label: 'Knowledge Hub', icon: Database },
  { path: '/workspace/projects', label: 'Projects', icon: FolderKanban },
  { path: '/workspace/documents', label: 'Documents', icon: FileText },
  { path: '/workspace/decisions', label: 'Decisions', icon: Workflow },
  { path: '/workspace/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/workspace/automation', label: 'Automation', icon: Workflow },
  { path: '/workspace/integrations', label: 'Integrations', icon: Blocks },
];

const devNavItems: NavItem[] = [
  { path: '/workspace/orchestrator', label: 'LangGraph Orchestrator', icon: Network },
  { path: '/workspace/graph', label: 'Knowledge Graph', icon: Network },
  { path: '/workspace/security', label: 'Security & Compliance', icon: Shield },
  { path: '/workspace/telemetry', label: 'System Telemetry', icon: Activity },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest/80 backdrop-blur-xl border-r border-outline-variant/50 flex flex-col py-6 z-50 transition-all">
      {/* Logo */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary font-bold">
          C
        </div>
        <div>
          <h1 className="font-headline text-lg font-bold text-on-surface leading-tight tracking-tight">
            Cerefy OS
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">
            Enterprise Intel
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">
            Workspace
          </span>
        </div>
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm flex-1">{item.label}</span>
            {item.badge && (
              <span className="badge badge-success text-[9px]">{item.badge}</span>
            )}
          </NavLink>
        ))}

        <div className="px-3 mt-6 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">
            Developer
          </span>
        </div>
        {devNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm flex-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 mt-auto space-y-1 border-t border-outline-variant/30 pt-6">
        <NavLink
          to="/workspace/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">Settings</span>
        </NavLink>
        <div className="mt-4 p-4 bg-primary text-on-primary rounded-xl text-center cursor-pointer active:scale-95 transition-transform">
          <p className="font-label text-xs font-bold uppercase tracking-wider mb-1">Upgrade Plan</p>
          <p className="text-[10px] opacity-80">Unlock Pro Features</p>
        </div>
      </div>
    </aside>
  );
};
