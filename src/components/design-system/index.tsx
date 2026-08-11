// src/components/patterns/index.tsx
// First-class UI patterns from the target design system: EmptyState,
// ErrorState, LoadingState, plus status indicators. No feature shows raw
// "no data" divs — pages compose these consistently.

import React from 'react';
import { MsIcon } from '../kinetic/primitives';
import { useI18n } from '../../lib/i18n';

/* ============================================================
   EMPTY STATE
   ============================================================ */

export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon = 'inbox', title, description, action, className = '' }) => (
  <div className={`bento-card rounded-xl p-10 flex flex-col items-center justify-center text-center gap-4 ${className}`}>
    <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center">
      <MsIcon name={icon} className="text-on-surface-variant" size={26} />
    </div>
    <div className="space-y-1">
      <h3 className="font-headline text-lg font-semibold text-on-surface">{title}</h3>
      {description && <p className="text-sm text-on-surface-variant max-w-md font-body">{description}</p>}
    </div>
    {action}
  </div>
);

/* ============================================================
   ERROR STATE
   ============================================================ */

export type ErrorVariant = '404' | '403' | '500' | 'network' | 'auth-expired' | 'backend-unavailable' | 'generic';

interface ErrorVariantConfig {
  title: string;
  icon: string;
  suggestion?: string;
}

const ERROR_VARIANTS: Record<ErrorVariant, ErrorVariantConfig> = {
  '404': { title: 'Page not found', icon: 'search_off', suggestion: 'The route you opened does not exist in the workspace.' },
  '403': { title: 'Access denied', icon: 'block', suggestion: 'Your role cannot view this surface. Ask a workspace admin for access.' },
  '500': { title: 'Server error', icon: 'report', suggestion: 'The request failed on the backend. Try again or check system health.' },
  network: { title: 'No connection', icon: 'cloud_off', suggestion: 'The backend is unreachable. Check your network and retry.' },
  'auth-expired': { title: 'Session expired', icon: 'lock_clock', suggestion: 'Sign in again to continue working.' },
  'backend-unavailable': { title: 'Backend unavailable', icon: 'dns_off', suggestion: 'The referenced capability is not reachable right now.' },
  generic: { title: 'Something went wrong', icon: 'error' },
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant?: ErrorVariant;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, message, onRetry, variant = 'generic', action, className = '' }) => {
  const cfg = ERROR_VARIANTS[variant] ?? ERROR_VARIANTS.generic;
  const headline = title ?? cfg.title;
  return (
    <div className={`bento-card rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 border-error/20 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
        <MsIcon name={cfg.icon} className="text-on-error-container" size={24} />
      </div>
      <h3 className="font-headline text-base font-semibold text-on-surface">{headline}</h3>
      {message && <p className="text-sm text-on-surface-variant font-body max-w-md">{message}</p>}
      {!message && cfg.suggestion && <p className="text-sm text-on-surface-variant font-body max-w-md">{cfg.suggestion}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-on-surface text-surface px-4 py-2 text-sm font-medium hover:bg-inverse-surface transition-colors"
        >
          <MsIcon name="refresh" size={16} />
          Retry
        </button>
      )}
      {action}
    </div>
  );
};

/* ============================================================
   LOADING STATE
   ============================================================ */

export const LoadingState: React.FC<{ label?: string; rows?: number; className?: string }> = ({
  label,
  rows = 3,
  className = '',
}) => {
  const { t } = useI18n();
  return (
    <div className={`space-y-3 ${className}`} aria-busy="true" aria-label={label || t('common.loading')}>
      {rows > 0 &&
        Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="bento-card rounded-xl p-6 flex flex-col gap-3"
            style={{ animation: `skeleton-breathe 1.6s ease-in-out ${i * 0.12}s infinite` }}
          >
            <div className="h-3 w-2/5 rounded bg-surface-container-high" />
            <div className="h-2.5 w-full rounded bg-surface-container" />
            <div className="h-2.5 w-4/5 rounded bg-surface-container" />
          </div>
        ))}
      {label && <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest">{label}</p>}
    </div>
  );
};

/* ============================================================
   STATUS INDICATORS
   ============================================================ */

export type AgentStatus = 'queued' | 'running' | 'done' | 'failed' | 'idle';

const agentStatusColor: Record<AgentStatus, string> = {
  queued: 'bg-amber-signal',
  running: 'bg-cyber-purple',
  done: 'bg-emerald-signal',
  failed: 'bg-rose-signal',
  idle: 'bg-surface-container-highest',
};

export const AgentStatusIndicator: React.FC<{ status: AgentStatus; label?: string; className?: string }> = ({
  status,
  label,
  className = '',
}) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <span className="relative flex h-2.5 w-2.5">
      {status === 'running' && (
        <span className={`absolute inline-flex h-full w-full rounded-full ${agentStatusColor[status]} opacity-40 animate-ping`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${agentStatusColor[status]}`} />
    </span>
    {label && (
      <span className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">{label}</span>
    )}
  </span>
);

export type PipelineStage = 'understand' | 'retrieve' | 'plan' | 'agents' | 'validate' | 'answer';

export const EXECUTION_STAGES: { id: PipelineStage; icon: string }[] = [
  { id: 'understand', icon: 'psychology' },
  { id: 'retrieve', icon: 'manage_search' },
  { id: 'plan', icon: 'account_tree' },
  { id: 'agents', icon: 'precision_manufacturing' },
  { id: 'validate', icon: 'verified' },
  { id: 'answer', icon: 'reply' },
];

/** Minimal execution stepper: given a current finished-stage index, renders
 *  the pipeline honestly — no intermediate steps are synthesized. */
export const ExecutionTimeline: React.FC<{
  current?: number;
  maxStage?: number;
  className?: string;
}> = ({ current = 0, className = '' }) => {
  const idx = Math.max(0, Math.min(current, EXECUTION_STAGES.length - 1));
  return (
    <div className={`flex items-center gap-2 overflow-x-auto ${className}`}>
      {EXECUTION_STAGES.map((stage, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={stage.id} className="flex items-center gap-2 shrink-0">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-label text-[11px] uppercase tracking-wider transition-colors ${
                done
                  ? 'bg-tertiary-container text-on-tertiary-container border-tertiary-container'
                  : active
                    ? 'bg-on-surface text-surface border-on-surface'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40'
              }`}
            >
              <MsIcon name={done ? 'check' : stage.icon} size={14} />
              {stage.id}
            </div>
            {i < EXECUTION_STAGES.length - 1 && (
              <div className="w-4 h-px bg-outline-variant/60" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ============================================================
   CAPABILITY-AWARE WRAPPER
   ============================================================ */

import { CapabilityKey, isImplemented, isPartial } from '../../lib/capabilities';

/**
 * Wraps a feature surface. When the capability is implemented or partial it
 * renders <Actual/>; otherwise it renders a Coming Soon empty state so no
 * page ever fakes functionality.
 */
export const CapabilityGate: React.FC<{
  capability: CapabilityKey;
  children: React.ReactNode;
  notImplementedTitle?: string;
  description?: string;
}> = ({ capability, children, notImplementedTitle = 'Module on the roadmap', description }) => {
  const available = isImplemented(capability) || isPartial(capability);
  if (available) return <>{children}</>;
  return (
    <EmptyState
      icon="hourglass_empty"
      title={notImplementedTitle}
      description={description || 'This module is part of the target architecture and will light up when the backend capability ships.'}
    />
  );
};

export function initSkeletonKeyframes() {
  if (typeof document !== 'undefined' && !document.getElementById('cerefy-skeleton-keyframes')) {
    const style = document.createElement('style');
    style.id = 'cerefy-skeleton-keyframes';
    style.textContent = '@keyframes skeleton-breathe{0%,100%{opacity:1}50%{opacity:.45}}';
    document.head.appendChild(style);
  }
}