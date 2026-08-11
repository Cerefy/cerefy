import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../store/useAgentStore';
import { useI18n } from '../lib/i18n';
import { MsIcon } from './kinetic/primitives';

interface CommandPaletteProps {
  onSelectAction?: (actionType: string, payload?: any) => void;
}

/* Real route index derived from the same IA as the sidebar — searching pages
 * here always matches what navigation actually links to. */
const PAGE_INDEX: Array<{ title: string; group: string; path: string; icon: string }> = [
  { title: 'Dashboard', group: 'Overview', path: '/workspace/dashboard', icon: 'dashboard' },
  { title: 'Mission Control', group: 'Overview', path: '/workspace/command-center', icon: 'dashboard_customize' },
  { title: 'AI Workspace', group: 'Intelligence', path: '/workspace/ai', icon: 'psychology' },
  { title: 'Conversations', group: 'Intelligence', path: '/workspace/conversations', icon: 'forum' },
  { title: 'Agent Studio', group: 'Intelligence', path: '/workspace/agents', icon: 'precision_manufacturing' },
  { title: 'Autonomous Workflows', group: 'Intelligence', path: '/workspace/workflows', icon: 'account_tree' },
  { title: 'Decision Center', group: 'Intelligence', path: '/workspace/decisions', icon: 'gavel' },
  { title: 'Documents', group: 'Knowledge', path: '/workspace/documents', icon: 'description' },
  { title: 'Enterprise Memory', group: 'Knowledge', path: '/workspace/memory', icon: 'database' },
  { title: 'Knowledge Graph', group: 'Knowledge', path: '/workspace/graph', icon: 'hub' },
  { title: 'Countries', group: 'MENA', path: '/workspace/mena/countries', icon: 'flag' },
  { title: 'Markets', group: 'MENA', path: '/workspace/mena/markets', icon: 'public' },
  { title: 'Industries', group: 'MENA', path: '/workspace/mena/industries', icon: 'domain' },
  { title: 'Projects', group: 'Business', path: '/workspace/projects', icon: 'folder_copy' },
  { title: 'Analytics', group: 'Business', path: '/workspace/analytics', icon: 'monitoring' },
  { title: 'CRM', group: 'Business', path: '/workspace/crm', icon: 'groups' },
  { title: 'Finance', group: 'Business', path: '/workspace/finance', icon: 'account_balance' },
  { title: 'HR', group: 'Business', path: '/workspace/hr', icon: 'badge' },
  { title: 'Integrations', group: 'Automation', path: '/workspace/integrations', icon: 'storefront' },
  { title: 'Orchestrator', group: 'Automation', path: '/workspace/orchestrator', icon: 'sync_alt' },
  { title: 'Automations', group: 'Automation', path: '/workspace/automations', icon: 'bolt' },
  { title: 'Compliance', group: 'Governance', path: '/workspace/governance', icon: 'verified_user' },
  { title: 'Audit Log', group: 'Governance', path: '/workspace/audit', icon: 'fact_check' },
  { title: 'Security', group: 'Governance', path: '/workspace/security', icon: 'shield_lock' },
  { title: 'Members', group: 'Organization', path: '/workspace/organization/members', icon: 'groups' },
  { title: 'Roles & Permissions', group: 'Organization', path: '/workspace/organization/roles', icon: 'admin_panel_settings' },
  { title: 'Workspaces', group: 'Organization', path: '/workspace/organization/workspaces', icon: 'workspaces' },
  { title: 'Models & Providers', group: 'AI Platform', path: '/workspace/ai/models', icon: 'dns' },
  { title: 'AI Settings', group: 'AI Platform', path: '/workspace/ai/settings', icon: 'tune' },
  { title: 'Agent Builder', group: 'AI Platform', path: '/workspace/ai/agents/builder', icon: 'add_box' },
  { title: 'Executions', group: 'Observability', path: '/workspace/observability/executions', icon: 'activity_zone' },
  { title: 'System Health', group: 'Observability', path: '/workspace/system/health', icon: 'monitor_heart' },
  { title: 'Settings', group: 'Tenant', path: '/workspace/settings', icon: 'settings' },
  { title: 'Billing & Usage', group: 'Tenant', path: '/workspace/billing', icon: 'payments' },
  { title: 'Developer Portal', group: 'Tenant', path: '/workspace/developer', icon: 'terminal' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onSelectAction }) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { commandPaletteOpen, setCommandPaletteOpen, tenants, setActiveTenantId, activeTenantId } = useAgentStore();
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

  const trimmed = search.trim().toLowerCase();

  const pages = useMemo(() => {
    if (!trimmed) return PAGE_INDEX;
    return PAGE_INDEX.filter(
      (p) => p.title.toLowerCase().includes(trimmed) || p.group.toLowerCase().includes(trimmed) || p.path.includes(trimmed),
    );
  }, [trimmed]);

  if (!commandPaletteOpen) return null;

  const goTo = (path: string) => {
    setCommandPaletteOpen(false);
    navigate(path);
  };

  const runAction = (type: string, payload?: any) => {
    onSelectAction?.(type, payload);
    setCommandPaletteOpen(false);
  };

  const quickCommands: Array<{ title: string; icon: string; run: () => void }> = [
    {
      title: 'Execute Security Audit Workflow',
      icon: 'shield_lock',
      run: () => runAction('run_query', 'Audit SOC2 compliance for tenant vector store and WebAuthn MFA.'),
    },
    {
      title: 'Query Contract & Policy Knowledge Graph',
      icon: 'hub',
      run: () => runAction('switch_tab', 'graph'),
    },
    {
      title: 'Open AI Orchestrator',
      icon: 'account_tree',
      run: () => runAction('switch_tab', 'orchestrator'),
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4 select-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setCommandPaletteOpen(false);
      }}
    >
      <div className="bento-card rounded-xl w-full max-w-xl overflow-hidden shadow-float border border-outline-variant/50">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-outline-variant/30 bg-surface-container-lowest">
          <span className="material-symbols-outlined text-on-surface-variant shrink-0 me-3" style={{ fontSize: 18 }} aria-hidden="true">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full py-3.5 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none font-body"
            autoFocus
          />
          <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high font-label text-[10px] text-on-surface-variant">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {tenants.length > 0 && (
            <div className="px-2">
              <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                Switch Tenant
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTenantId(t.id);
                      setCommandPaletteOpen(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs text-start border transition-all ${
                      t.id === activeTenantId
                        ? 'bg-on-surface text-surface border-on-surface'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border-outline-variant/40'
                    }`}
                  >
                    <div className="truncate font-body font-medium text-[11px]">{t.name}</div>
                    <div className="text-[9px] opacity-70 truncate font-label">{t.domain}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant px-2 mb-1 flex items-center gap-1.5">
              Quick Commands
            </div>
            <div className="space-y-1">
              {quickCommands.map((c) => (
                <button
                  key={c.title}
                  onClick={c.run}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-surface-container-low rounded-lg text-start transition-colors group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                    <MsIcon name={c.icon} size={16} />
                  </div>
                  <span className="text-xs font-medium text-on-surface truncate">{c.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant px-2 mb-1 flex items-center gap-1.5">
              Pages
            </div>
            {pages.length === 0 ? (
              <div className="p-4 text-xs text-on-surface-variant text-center font-body">
                No matching pages found.
              </div>
            ) : (
              <div className="space-y-1">
                {pages.map((p) => (
                  <button
                    key={p.path}
                    onClick={() => goTo(p.path)}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-surface-container-low rounded-lg text-start transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                        <MsIcon name={p.icon} size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-on-surface truncate">{p.title}</div>
                        <div className="text-[10px] text-on-surface-variant font-label uppercase tracking-wider">{p.group}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-label">Go ↵</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-outline-variant/30 bg-surface-container-lowest text-[10px] font-label text-on-surface-variant flex justify-between items-center">
          <span>⌘K to open · ESC to close</span>
          <span className="text-on-surface">Cerefy Enterprise Intelligence</span>
        </div>
      </div>
    </div>
  );
};