// src/features/dashboard/DashboardPage.tsx
// Personalized overview. Only real values are counted (projects, decisions,
// agent roster from refs api), each widget falls back to EmptyState when the
// data source isn't live. Never fabricated metrics.

import React, { useEffect, useState } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import { apiGet } from '../../lib/apiClient';
import { CountUp } from '../../lib/motion';
import { EmptyState, LoadingState } from '../../components/design-system';
import { MsIcon, StatusPill } from '../../components/kinetic/primitives';
import { useI18n } from '../../lib/i18n';
import { listMarkets } from '../../intelligence/markets/catalog';

interface AgentRecord {
  id?: string;
  name?: string;
  role?: string;
  status?: string;
}

interface MetricCardProps {
  icon: string;
  label: string;
  value: number;
  footnote?: string;
}

const MetricCard = ({ icon, label, value, footnote }: MetricCardProps) => (
  <div className="bento-card rounded-xl p-5 flex flex-col gap-2">
    <div className="flex items-center gap-2 text-on-surface-variant">
      <MsIcon name={icon} size={18} />
      <span className="font-label text-[11px] uppercase tracking-wider">{label}</span>
    </div>
    <CountUp value={value} className="font-headline text-[34px] font-semibold tracking-tight text-on-surface leading-none" />
    {footnote && <p className="text-[11px] font-label text-on-surface-variant">{footnote}</p>}
  </div>
);

export const DashboardPage: React.FC = () => {
  const { t } = useI18n();
  const projects = useAgentStore((s) => s.projects);
  const decisions = useAgentStore((s) => s.decisions);
  const fetchProjects = useAgentStore((s) => s.fetchProjects);
  const fetchDecisions = useAgentStore((s) => s.fetchDecisions);
  const [agents, setAgents] = useState<AgentRecord[] | null>(null);

  useEffect(() => {
    void fetchProjects();
    void fetchDecisions();
  }, [fetchProjects, fetchDecisions]);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ data?: AgentRecord[] }>('/api/v1/agents')
      .then(({ data }) => {
        if (!cancelled) setAgents(Array.isArray(data?.data) ? data.data : null);
      })
      .catch(() => {
        if (!cancelled) setAgents(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline text-[28px] md:text-[32px] font-semibold tracking-tight text-on-surface leading-[1.3] mb-1">
          {t('nav.dashboard')}
        </h2>
        <p className="text-on-surface-variant text-[16px] font-body">
          Live overview — values below are read from real workspace APIs.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Projects" icon="folder_copy" value={projects.length} footnote="from /api/v1/projects" />
        <MetricCard label="Decisions" icon="gavel" value={decisions.length} footnote="from /api/v1/decisions" />
        <MetricCard
          label="Agents"
          icon="precision_manufacturing"
          value={agents ? agents.length : 0}
          footnote={agents ? 'from /api/v1/agents' : 'agents endpoint unavailable'}
        />
        <MetricCard label={t('nav.markets')} icon="public" value={listMarkets().length} footnote="from the MENA country catalog" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent decisions */}
        <div className="bento-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-[15px] font-semibold text-on-surface">Recent decisions</h3>
            <StatusPill label="live" variant="success" />
          </div>
          {decisions.length === 0 ? (
            <EmptyState
              icon="gavel"
              title="No decisions yet"
              description="Once Cerefy analyzes your first business decision, recommendations and evidence will appear here."
            />
          ) : (
            <ul className="space-y-2">
              {decisions.slice(0, 4).map((d, i) => (
                <li key={String((d as { id?: string }).id ?? `d-${i}`)} className="rounded-lg border border-outline-variant/40 px-3 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-on-surface font-body truncate">
                      {(d as { title?: string }).title ?? (d as { decision?: string }).decision ?? 'Untitled decision'}
                    </p>
                    <p className="text-[11px] text-on-surface-variant font-label uppercase tracking-wider">
                      {(d as { status?: string }).status ?? 'draft'}
                    </p>
                  </div>
                  <StatusPill label="review" variant="neutral" />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Agents */}
        <div className="bento-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-[15px] font-semibold text-on-surface">Agent roster</h3>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${agents ? 'bg-emerald-signal' : 'bg-amber-signal'}`} />
              <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
                {agents ? 'live' : 'unavailable'}
              </span>
            </div>
          </div>
          {agents === null ? (
            <LoadingState label="Fetching agent roster" rows={2} />
          ) : agents.length === 0 ? (
            <EmptyState
              icon="precision_manufacturing"
              title="No agents deployed"
              description="Agents you deploy for your workspace will be listed here."
            />
          ) : (
            <ul className="space-y-2">
              {agents.map((a) => (
                <li key={a.id ?? a.name} className="rounded-lg border border-outline-variant/40 px-3 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-on-surface font-body truncate">{a.name ?? a.id}</p>
                    <p className="text-[11px] text-on-surface-variant font-label uppercase tracking-wider">{a.role ?? 'agent'}</p>
                  </div>
                  <StatusPill label={a.status ?? 'ready'} variant={a.status === 'running' ? 'success' : 'neutral'} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};