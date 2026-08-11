import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogoIcon } from './LogoIcon';
import { useI18n } from '../lib/i18n';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  end?: boolean;
  badge?: string;
}

interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    titleKey: 'nav.overview',
    items: [
      { path: '/workspace/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
      { path: '/workspace/command-center', label: 'Mission Control', icon: 'dashboard_customize' },
    ],
  },
  {
    titleKey: 'nav.intelligence',
    items: [
      { path: '/workspace/ai', label: 'AI Workspace', icon: 'psychology' },
      { path: '/workspace/conversations', label: 'Conversations', icon: 'forum' },
      { path: '/workspace/agents', label: 'Agent Studio', icon: 'precision_manufacturing' },
      { path: '/workspace/workflows', label: 'Autonomous Workflows', icon: 'account_tree' },
      { path: '/workspace/decisions', label: 'Decision Center', icon: 'gavel' },
    ],
  },
  {
    titleKey: 'nav.knowledge',
    items: [
      { path: '/workspace/documents', label: 'Documents', icon: 'description' },
      { path: '/workspace/memory', label: 'Enterprise Memory', icon: 'database' },
      { path: '/workspace/graph', label: 'Knowledge Graph', icon: 'hub' },
    ],
  },
  {
    titleKey: 'nav.mena',
    items: [
      { path: '/workspace/mena/countries', label: 'Countries', icon: 'flag' },
      { path: '/workspace/mena/markets', label: 'Markets', icon: 'public' },
      { path: '/workspace/mena/industries', label: 'Industries', icon: 'domain' },
    ],
  },
  {
    titleKey: 'nav.business',
    items: [
      { path: '/workspace/projects', label: 'Projects', icon: 'folder_copy', badge: 'live' },
      { path: '/workspace/analytics', label: 'Analytics', icon: 'monitoring' },
      { path: '/workspace/crm', label: 'CRM', icon: 'groups' },
      { path: '/workspace/finance', label: 'Finance', icon: 'account_balance' },
      { path: '/workspace/hr', label: 'HR', icon: 'badge' },
    ],
  },
  {
    titleKey: 'nav.automation',
    items: [
      { path: '/workspace/integrations', label: 'Marketplace', icon: 'storefront' },
      { path: '/workspace/orchestrator', label: 'Orchestrator', icon: 'sync_alt' },
      { path: '/workspace/automations', label: 'Automations', icon: 'bolt' },
    ],
  },
  {
    titleKey: 'nav.governance',
    items: [
      { path: '/workspace/governance', label: 'Compliance', icon: 'verified_user' },
      { path: '/workspace/audit', label: 'Audit Log', icon: 'fact_check' },
      { path: '/workspace/security', label: 'Security', icon: 'shield_lock' },
    ],
  },
  {
    titleKey: 'nav.organization',
    items: [
      { path: '/workspace/organization/members', label: 'Members', icon: 'groups' },
      { path: '/workspace/organization/roles', label: 'Roles & Permissions', icon: 'admin_panel_settings' },
      { path: '/workspace/organization/workspaces', label: 'Workspaces', icon: 'workspaces' },
    ],
  },
  {
    titleKey: 'nav.aiPlatform',
    items: [
      { path: '/workspace/ai/models', label: 'Models & Providers', icon: 'dns' },
      { path: '/workspace/ai/settings', label: 'AI Settings', icon: 'tune' },
      { path: '/workspace/ai/agents/builder', label: 'Agent Builder', icon: 'add_box' },
    ],
  },
  {
    titleKey: 'nav.observability',
    items: [
      { path: '/workspace/observability/executions', label: 'Executions', icon: 'activity_zone' },
      { path: '/workspace/system/health', label: 'System Health', icon: 'monitor_heart' },
    ],
  },
];

const footerNavItems: NavItem[] = [
  { path: '/workspace/settings', label: 'Settings', icon: 'settings' },
  { path: '/workspace/billing', label: 'Billing & Usage', icon: 'payments' },
  { path: '/workspace/developer', label: 'Developer Portal', icon: 'terminal' },
];

const NavLinkItem: React.FC<{ item: NavItem }> = ({ item }) => (
  <NavLink
    to={item.path}
    end={item.end}
    className={({ isActive }) =>
      `group flex items-center gap-3 px-4 py-2.5 rounded-lg font-label text-[13px] uppercase tracking-wider transition-all cursor-pointer ${
        isActive
          ? 'bg-secondary-container text-on-secondary-container font-medium shadow-sm'
          : 'text-on-surface-variant hover:bg-surface-container-high'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <span
          className={`material-symbols-outlined ${isActive ? 'ms-fill' : ''}`}
          style={{ fontSize: 20 }}
          aria-hidden="true"
        >
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className="px-1.5 py-0.5 rounded bg-tertiary-container text-on-tertiary-container font-label text-[8px]">
            {item.badge}
          </span>
        )}
      </>
    )}
  </NavLink>
);

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useI18n();

  return (
    <aside className="h-screen w-64 fixed start-0 top-0 bg-surface-container-lowest border-e border-outline-variant/50 flex flex-col py-6 z-50 hidden md:flex">
      {/* Brand */}
      <div className="px-6 mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-surface-container-high">
          <LogoIcon className="w-6 h-6 text-on-surface" />
        </div>
        <div>
          <h1 className="font-headline text-lg font-bold text-on-surface leading-tight tracking-tight">
            Cerefy
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">
            {t('app_tagline')}
          </p>
        </div>
      </div>

      {/* Language Toggle */}
      <div className="px-3 mb-4">
        <button
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-label uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-low transition-colors"
          title="Toggle العربية / English"
        >
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
            translate
          </span>
          {locale === 'en' ? 'English (EN)' : 'العربية (AR)'}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.titleKey}>
            <div className="px-3 mb-2">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">
                {t(group.titleKey)}
              </span>
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLinkItem key={item.path} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* CTA */}
      <div className="px-3 mb-4">
        <button
          onClick={() => navigate('/workspace/agents')}
          className="w-full bg-on-surface text-surface py-2.5 rounded-lg font-label text-[13px] uppercase tracking-widest hover:bg-inverse-surface transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
            add
          </span>
          {t('action.newAgent')}
        </button>
      </div>

      {/* Footer Links */}
      <div className="px-3 pt-4 border-t border-outline-variant/20 space-y-1">
        {footerNavItems.map((item) => (
          <NavLinkItem key={item.path} item={item} />
        ))}
      </div>
    </aside>
  );
};