// src/features/ai-platform/AIModelsPage.tsx
// Model & provider surface (/ai/models).
// The gateway abstraction is real; the actual registered adapters are read
// from the live registry — if none are registered, the page says so and shows
// the abstraction rather than fabricating a model picker.

import React from 'react';
import { listProviders, pickDefaultProvider } from '../../intelligence/gateway';
import { EmptyState } from '../../components/design-system';
import { StatusPill } from '../../components/kinetic/primitives';
import { useI18n } from '../../lib/i18n';

const GATEWAY_SURFACE = [
  { id: 'gemini', label: 'Gemini' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'local', label: 'Local / private cloud' },
  { id: 'custom', label: 'Custom (Arabic-native or sovereign)' },
] as const;

export const AIModelsPage: React.FC = () => {
  const { t } = useI18n();
  const registered = listProviders();
  const active = pickDefaultProvider();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline text-[28px] md:text-[32px] font-semibold tracking-tight text-on-surface leading-[1.3] mb-1">
          Models & Providers
        </h2>
        <p className="text-on-surface-variant text-[16px] font-body">
          AI Platform configuration. Model routing is provider-agnostic through the gateway.
        </p>
      </div>

      <div className="bento-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-[15px] font-semibold text-on-surface">Active provider</h3>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-signal' : 'bg-amber-signal'}`} />
            <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
              {active ? 'available' : 'none registered'}
            </span>
          </div>
        </div>

        {active ? (
          <div className="rounded-lg border border-outline-variant/40 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-on-surface font-body">{active.id}</span>
            <StatusPill label="default" variant="success" />
          </div>
        ) : (
          <EmptyState
            icon="dns"
            title="No provider adapter registered"
            description="The gateway abstraction is live, but the app shell has not registered a model adapter yet. On the server, /api/v1/ai/run executes the pipeline; client-side model selection remains on the roadmap until an adapter registers here."
          />
        )}
      </div>

      <div className="bento-card rounded-xl p-5 space-y-4">
        <h3 className="font-headline text-[15px] font-semibold text-on-surface">
          Gateway abstraction surface <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">(architecture)</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GATEWAY_SURFACE.map((p) => (
            <div key={p.id} className="rounded-lg bg-surface-container-low px-3 py-2.5 flex items-center justify-between gap-2">
              <span className="font-body text-[13px] text-on-surface">{p.label}</span>
              {registered.includes(p.id) ? (
                <StatusPill label="registered" variant="success" />
              ) : (
                <StatusPill label="not wired" variant="neutral" />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider">
          {registered.length} adapter{registered.length === 1 ? '' : 's'} registered · {t('common.plannedRoadmap')}
        </p>
      </div>
    </div>
  );
};