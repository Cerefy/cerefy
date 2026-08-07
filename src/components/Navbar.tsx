import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAgentStore } from '../store/useAgentStore';
import { TenantRole } from '../types';
import { LogoIcon } from './LogoIcon';
import { FirebaseSync } from './FirebaseSync';
import {
  ShieldCheck,
  Search,
  Building2,
  UserCheck,
  Globe,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    tenants,
    activeTenantId,
    setActiveTenantId,
    activeRole,
    setActiveRole,
    setCommandPaletteOpen,
    isExecuting,
  } = useAgentStore();

  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  const appMode = location.pathname.startsWith('/admin') ? 'ADMIN' : location.pathname.startsWith('/workspace') ? 'WORKSPACE' : 'MARKETING';

  return (
    <header className="h-16 px-6 border-b border-zinc-800/80 flex items-center justify-between bg-[#08080a]/90 backdrop-blur-xl sticky top-0 z-40 select-none font-sans">
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-6">
        <div 
          className="flex items-center gap-3 group"
        >
          <div className="p-1.5 rounded-xl bg-[#080E38] border border-indigo-900/50 group-hover:border-indigo-600 transition-all shadow-md">
            <LogoIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold tracking-tight text-white uppercase font-mono">
                CEREFY AI PLATFORM
              </h1>
              <span className="text-indigo-400 font-mono font-normal text-[10px] bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                v2.4-enterprise
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
              <span>ORG: {activeTenant?.name || 'Default'}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                RLS ACTIVE
              </span>
            </p>
          </div>
        </div>

        {/* Top Navbar Workspace / App Mode Switcher */}
        <div className="hidden xl:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-full border border-zinc-800 font-mono text-xs">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/');
            }}
            className={`px-3.5 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
              appMode === 'MARKETING'
                ? 'bg-white text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Marketing Site</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/workspace');
            }}
            className={`px-3.5 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
              appMode === 'WORKSPACE'
                ? 'bg-white text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Enterprise Workspace</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/admin');
            }}
            className={`px-3.5 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
              appMode === 'ADMIN'
                ? 'bg-white text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin Console</span>
          </button>
        </div>
      </div>

      {/* Quick Search / Command Palette Trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="hidden md:flex items-center gap-3 bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 px-4 py-1.5 rounded-full text-xs transition-all group w-72 justify-between cursor-pointer font-mono"
      >
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
          <span className="text-zinc-400 truncate">Search memory &amp; vectors...</span>
        </div>
        <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] text-zinc-300 border border-zinc-700 font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls: Tenant Switcher, Role Selector, Execution Status, Firebase */}
      <div className="flex items-center gap-3">
        {/* Firebase Authentication & Sync */}
        <FirebaseSync />

        {/* Gateway Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full font-mono text-xs">
          <span className={`h-2 w-2 rounded-full ${isExecuting ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
          <span className="text-zinc-300">
            {isExecuting ? 'Task Running' : 'Gateway Active'}
          </span>
        </div>

        {/* Tenant / Organization Selector */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          <div className="pl-1.5 text-zinc-400 flex items-center text-xs font-mono">
            <Building2 className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <select
            value={activeTenantId}
            onChange={(e) => setActiveTenantId(e.target.value)}
            className="bg-zinc-950 text-zinc-200 text-xs rounded-lg px-2 py-0.5 outline-none font-mono border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Role Selector */}
        <div className="hidden lg:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          <div className="pl-1.5 text-zinc-400 flex items-center text-xs font-mono">
            <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <select
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value as TenantRole)}
            className="bg-zinc-950 text-zinc-200 text-xs rounded-lg px-2 py-0.5 outline-none font-mono border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="TENANT_ADMIN">TENANT_ADMIN</option>
            <option value="ANALYST">ANALYST</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </div>

        {/* User Badge */}
        <div className="h-8 w-8 rounded-full bg-white text-zinc-950 flex items-center justify-center font-extrabold text-xs shadow-md cursor-pointer hover:bg-zinc-200 transition-colors" title="Montaser (Founder / Admin)">
          M
        </div>
      </div>
    </header>
  );
};
