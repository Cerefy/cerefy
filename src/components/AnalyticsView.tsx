import React from 'react';
import { Activity, BarChart3, Clock, Cpu, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAgentPerformance, useDecisions, useExecutiveKPIs } from '../hooks/useApi';
import { EmptyState, ErrorState, LoadingState } from './design-system';

function displayConfidence(score: number | null): string {
  if (score === null || !Number.isFinite(score)) return '—';
  const normalized = score <= 1 ? score * 100 : score;
  return `${Math.round(Math.max(0, Math.min(100, normalized)))}%`;
}

export const AnalyticsView: React.FC = () => {
  const executiveKPIs = useExecutiveKPIs();
  const agentPerformance = useAgentPerformance();
  const decisions = useDecisions();

  if (executiveKPIs.isLoading && agentPerformance.isLoading && decisions.isLoading) {
    return <LoadingState label="Loading analytics" rows={4} />;
  }

  if (executiveKPIs.isError) {
    return (
      <ErrorState
        title="Unable to load executive analytics"
        message={executiveKPIs.error instanceof Error ? executiveKPIs.error.message : undefined}
        variant="backend-unavailable"
        onRetry={() => void executiveKPIs.refetch()}
      />
    );
  }

  if (!executiveKPIs.data) {
    return (
      <EmptyState
        icon="monitoring"
        title="No executive analytics"
        description="The executive analytics API did not return KPI data for this workspace."
      />
    );
  }

  const kpis = executiveKPIs.data;
  const kpiCards = [
    { label: 'Projects', value: String(kpis.totalProjects), icon: BarChart3 },
    { label: 'Active agents', value: String(kpis.activeAgents), icon: Cpu },
    { label: 'Decisions this month', value: String(kpis.decisionsThisMonth), icon: ShieldCheck },
    { label: 'Average confidence', value: displayConfidence(kpis.avgConfidenceScore), icon: TrendingUp },
    { label: 'Automation rate', value: displayConfidence(kpis.automationRate), icon: Activity },
    { label: 'Processing time', value: kpis.processingTime ?? '—', icon: Clock },
  ];

  return (
    <section className="space-y-6" aria-labelledby="analytics-heading">
      <header className="bento-card rounded-xl p-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary font-label text-xs font-semibold uppercase tracking-widest">
            <BarChart3 className="h-4 w-4" aria-hidden="true" /> Workspace analytics
          </div>
          <h1 id="analytics-heading" className="mt-1 font-headline text-xl font-semibold text-on-surface">Analytics</h1>
          <p className="mt-1 text-sm text-on-surface-variant font-body">
            Aggregates returned by the executive analytics and agent performance APIs.
          </p>
        </div>
        <dl className="flex flex-wrap gap-3 font-label text-xs">
          <div className="rounded-lg bg-surface-container px-3 py-2 text-on-surface-variant">
            <dt className="inline">Cost savings: </dt>
            <dd className="inline font-semibold text-on-surface">{kpis.costSavings ?? '—'}</dd>
          </div>
          <div className="rounded-lg bg-surface-container px-3 py-2 text-on-surface-variant">
            <dt className="inline">ROI multiple: </dt>
            <dd className="inline font-semibold text-on-surface">{kpis.roiMultiple ?? '—'}</dd>
          </div>
        </dl>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Executive KPI cards">
        {kpiCards.map(({ label, value, icon: Icon }) => (
          <article key={label} className="bento-card rounded-xl p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">{label}</p>
              <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-4 font-headline text-2xl font-semibold text-on-surface">{value}</p>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="bento-card rounded-xl p-6 space-y-4" aria-labelledby="agent-performance-heading">
          <div>
            <h2 id="agent-performance-heading" className="font-headline text-base font-semibold text-on-surface">Agent performance</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Operational values returned by the agent performance endpoint.</p>
          </div>

          {agentPerformance.isLoading ? (
            <LoadingState label="Loading agent performance" rows={3} />
          ) : agentPerformance.isError ? (
            <ErrorState
              title="Unable to load agent performance"
              message={agentPerformance.error instanceof Error ? agentPerformance.error.message : undefined}
              variant="backend-unavailable"
              onRetry={() => void agentPerformance.refetch()}
            />
          ) : (agentPerformance.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon="smart_toy"
              title="No agent performance data"
              description="The agent performance API returned no records for this workspace."
            />
          ) : (
            <div className="space-y-3">
              {agentPerformance.data?.map((agent) => (
                <article key={agent.agentId} className="rounded-xl bg-surface-container p-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-headline text-sm font-semibold text-on-surface">{agent.agentName}</h3>
                    <span className="rounded-full bg-surface-container-high px-2 py-1 text-xs font-label text-on-surface-variant">
                      Success: {displayConfidence(agent.successRate)}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-on-surface-variant">Tasks completed</dt><dd className="mt-1 font-semibold text-on-surface">{agent.tasksCompleted}</dd></div>
                    <div><dt className="text-on-surface-variant">Average latency</dt><dd className="mt-1 font-semibold text-on-surface">{agent.avgLatencyMs === null ? '—' : `${agent.avgLatencyMs} ms`}</dd></div>
                    <div><dt className="text-on-surface-variant">Tokens used</dt><dd className="mt-1 font-semibold text-on-surface">{agent.tokensUsed ?? '—'}</dd></div>
                    <div><dt className="text-on-surface-variant">Cost incurred</dt><dd className="mt-1 font-semibold text-on-surface">{agent.costIncurred ?? '—'}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="bento-card rounded-xl p-6 space-y-4" aria-labelledby="decision-log-heading">
          <div>
            <h2 id="decision-log-heading" className="font-headline text-base font-semibold text-on-surface">Decision log</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Decision records returned by the decision API.</p>
          </div>

          {decisions.isLoading ? (
            <LoadingState label="Loading decisions" rows={3} />
          ) : decisions.isError ? (
            <ErrorState
              title="Unable to load decisions"
              message={decisions.error instanceof Error ? decisions.error.message : undefined}
              variant="backend-unavailable"
              onRetry={() => void decisions.refetch()}
            />
          ) : (decisions.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon="balance"
              title="No decisions available"
              description="The decision API returned no decision records for this workspace."
            />
          ) : (
            <div className="space-y-3">
              {decisions.data?.map((decision) => (
                <article key={decision.id} className="rounded-xl bg-surface-container p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-headline text-sm font-semibold text-on-surface">{decision.title}</h3>
                    <p className="mt-1 text-xs text-on-surface-variant">Confidence: {displayConfidence(decision.confidenceScore)}</p>
                  </div>
                  <span className="rounded-full bg-surface-container-high px-2 py-1 text-xs font-label text-on-surface-variant">
                    {decision.status}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

export default AnalyticsView;
