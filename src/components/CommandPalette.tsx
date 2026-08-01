import React, { useEffect, useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import {
  Search,
  Bot,
  Network,
  FileText,
  ShieldAlert,
  Building2,
  X,
  Zap,
} from 'lucide-react';

interface CommandPaletteProps {
  onSelectAction?: (actionType: string, payload?: any) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onSelectAction }) => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    tenants,
    setActiveTenantId,
    activeTenantId,
  } = useAgentStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const actions = [
    {
      id: 'action_audit',
      title: 'Execute Security Audit Workflow',
      category: 'Agent Workflows',
      icon: ShieldAlert,
      handler: () => {
        onSelectAction?.('run_query', 'Audit SOC2 compliance for tenant vector store and WebAuthn MFA.');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'action_graph_query',
      title: 'Query Contract & Policy Knowledge Graph',
      category: 'Knowledge Graph',
      icon: Network,
      handler: () => {
        onSelectAction?.('switch_tab', 'graph');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'action_ingest_soc2',
      title: 'Ingest Enterprise Security Policy Document',
      category: 'Ingestion Engine',
      icon: FileText,
      handler: () => {
        onSelectAction?.('switch_tab', 'ingestion');
        setCommandPaletteOpen(false);
      },
    },
  ];

  const filteredActions = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 p-4 select-none animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl shadow-blue-950/30">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-800 bg-slate-950/60">
          <Search className="h-4 w-4 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command, query knowledge graph, or switch tenant..."
            className="w-full py-3.5 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none font-medium"
            autoFocus
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Tenant Quick Switch */}
          <div className="px-2">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-blue-400" /> Switch Active Tenant
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {tenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTenantId(t.id);
                    setCommandPaletteOpen(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs text-left font-mono border transition-all ${
                    t.id === activeTenantId
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate font-sans font-medium text-[11px]">{t.name}</div>
                  <div className="text-[9px] text-slate-500 truncate">{t.domain}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action List */}
          <div>
            <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1 flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-amber-400" /> Quick Commands
            </div>

            {filteredActions.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center font-mono">
                No matching enterprise commands found.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.handler}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-slate-800/80 rounded-lg text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-blue-600/20 text-slate-400 group-hover:text-blue-400 transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-200 group-hover:text-white">
                            {action.title}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {action.category}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono group-hover:text-slate-400">
                        Run ↵
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between items-center">
          <span>
            Press <kbd className="px-1 bg-slate-800 text-slate-400 rounded">ESC</kbd> to close
          </span>
          <span className="text-blue-400">Enterprise Intelligence Gateway</span>
        </div>
      </div>
    </div>
  );
};
