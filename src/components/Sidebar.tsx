import React from 'react';
import { NavLink } from 'react-router-dom';
import { WorkspaceTab } from '../types';
import {
  Sparkles,
  LayoutDashboard,
  BrainCircuit,
  BookOpen,
  FolderKanban,
  FileText,
  CalendarDays,
  CheckSquare,
  Bot,
  Workflow,
  Scale,
  BarChart3,
  Blocks,
  Settings,
  ShieldCheck,
  Activity,
  Network,
  FileCode,
  Cpu,
  Terminal,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const mainNavItems: { id: WorkspaceTab; label: string; icon: React.FC<{ className?: string }>; badge?: string; isPrimary?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'command-center', label: 'AI Command Center', icon: Sparkles, isPrimary: true, badge: '⭐ PRIMARY' },
    { id: 'memory', label: 'Enterprise Memory', icon: BrainCircuit, badge: '6 Tiers' },
    { id: 'knowledge', label: 'Knowledge Hub', icon: BookOpen },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'meetings', label: 'Meetings', icon: CalendarDays },
    { id: 'agents', label: 'AI Agents', icon: Bot, badge: '40+ Roster' },
    { id: 'studio', label: 'Automation', icon: Workflow, badge: 'Studio' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'decisions', label: 'Decision Center', icon: Scale, badge: '94% ROI' },
    { id: 'integrations', label: 'Integrations', icon: Blocks, badge: '16 Active' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const devNavItems: { id: WorkspaceTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'orchestrator', label: 'LangGraph Orchestrator', icon: Cpu },
    { id: 'graph', label: 'Knowledge Graph Map', icon: Network },
    { id: 'ingestion', label: 'Vector RAG Ingestion', icon: FileCode },
    { id: 'security', label: 'RLS & ABAC Security', icon: ShieldCheck },
    { id: 'telemetry', label: 'System Telemetry', icon: Activity },
  ];

  return (
    <aside className="w-64 bg-[#08080a] border-r border-zinc-800/80 flex flex-col justify-between shrink-0 select-none overflow-y-auto custom-scrollbar font-sans">
      <div className="p-3 space-y-5">
        {/* Workspace Operations Category */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
            <span>Enterprise Workspace</span>
            <span className="text-indigo-400 text-[9px] bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              Active
            </span>
          </div>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={`/workspace/${item.id}`}
                  className={({ isActive }) => `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                    item.isPrimary && isActive
                      ? 'bg-white text-zinc-950 font-bold shadow-lg'
                      : item.isPrimary
                      ? 'bg-zinc-900/90 text-zinc-200 border border-zinc-800 hover:bg-zinc-800'
                      : isActive
                      ? 'bg-zinc-800 text-white font-semibold border border-zinc-700/80 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                  }`}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`h-4 w-4 shrink-0 ${item.isPrimary ? 'text-indigo-400' : isActive ? 'text-white' : 'text-zinc-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono rounded-full border shrink-0 ${
                            item.isPrimary
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              : isActive
                              ? 'bg-zinc-700 text-white border-zinc-600'
                              : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Technical Deep Engine */}
        <div className="pt-2 border-t border-zinc-900">
          <div className="px-3 mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
            Deep Tech &amp; Telemetry
          </div>
          <nav className="space-y-1">
            {devNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={`/workspace/${item.id}`}
                  className={({ isActive }) => `w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  {({ isActive }) => (
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-zinc-600'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Health Diagnostics Widget */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3 space-y-2 font-mono">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" /> Platform Engine
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-1 text-[10px] text-zinc-400">
            <div className="flex justify-between items-center">
              <span>System Status</span>
              <span className="text-emerald-400 font-bold">OPERATIONAL</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Memory Vector RAG</span>
              <span className="text-cyan-300 font-bold">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-900 text-[10px] text-zinc-500 font-mono flex items-center justify-between bg-[#08080a]">
        <span className="flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5 text-zinc-600" /> CEREFY OS
        </span>
        <span className="text-emerald-400 font-bold">READY</span>
      </div>
    </aside>
  );
};
