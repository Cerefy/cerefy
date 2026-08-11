import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../store/useAgentStore';
import { LogoIcon } from './LogoIcon';
import { useI18n } from '../lib/i18n';
import { NotificationCenter } from './notifications/NotificationCenter';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, activeRole, setCommandPaletteOpen } = useAgentStore();
  const { t } = useI18n();
  const [command, setCommand] = React.useState('');

  const submitCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = command.trim();
    if (!trimmed) return;
    setCommand('');
    navigate(`/workspace/ai?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="fixed top-0 end-0 start-64 z-40 bg-surface-container-lowest/70 backdrop-blur-md border-b border-outline-variant/30 flex justify-between items-center px-6 h-14 hidden md:flex">
      {/* Left: Search (logical side) */}
      <div className="flex items-center gap-4 text-on-surface-variant">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/20 hover:border-on-surface transition-colors group"
          aria-label={t('search.placeholder')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
            search
          </span>
          <span className="text-[12px] text-on-surface-variant/70 font-label group-hover:text-on-surface transition-colors">
            {t('search.placeholder')}
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high font-label text-[10px] text-on-surface-variant ms-1">
            ⌘K
          </kbd>
        </button>

        {/* AI Command Center — persistent header input routing to the same
            /workspace/ai execution pipeline (no second implementation) */}
        <form onSubmit={submitCommand} className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/20 focus-within:border-primary transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
            auto_awesome
          </span>
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Ask Cerefy…"
            aria-label="Ask Cerefy"
            className="bg-transparent border-none focus:outline-none text-[12px] w-40 placeholder:text-on-surface-variant/50 font-label"
          />
          {command.trim() && (
            <button type="submit" aria-label="Run command">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
                arrow_forward
              </span>
            </button>
          )}
        </form>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-6">
        <NotificationCenter />
        <button className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">
            settings_heart
          </span>
        </button>
        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-end">
            <p className="text-[12px] font-semibold text-on-surface leading-tight">
              {currentUser?.name || currentUser?.email || 'System Admin'}
            </p>
            <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-wider">
              {activeRole || 'TENANT_ADMIN'}
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/30 flex items-center justify-center hover:ring-2 hover:ring-outline-variant/50 transition-all"
          >
            <LogoIcon className="w-5 h-5 text-on-surface" />
          </button>
        </div>
      </div>
    </header>
  );
};