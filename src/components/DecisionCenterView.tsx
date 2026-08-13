import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BrainCircuit, CheckCircle2, Play, Scale } from 'lucide-react';
import { useApproveDecision, useDecisions, useSimulateDecision } from '../hooks/useApi';
import { EmptyState, ErrorState, LoadingState } from './design-system';

function confidencePercent(score: number): string {
  const normalized = score <= 1 ? score * 100 : score;
  return `${Math.round(Math.max(0, Math.min(100, normalized)))}%`;
}

export const DecisionCenterView: React.FC = () => {
  const { data: decisions = [], isLoading, isError, error, refetch } = useDecisions();
  const approveDecision = useApproveDecision();
  const simulateDecision = useSimulateDecision();
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  useEffect(() => {
    if (decisions.length === 0) {
      setSelectedDecisionId(null);
      return;
    }
    if (!selectedDecisionId || !decisions.some((decision) => decision.id === selectedDecisionId)) {
      setSelectedDecisionId(decisions[0].id);
    }
  }, [decisions, selectedDecisionId]);

  const selectedDecision = decisions.find((decision) => decision.id === selectedDecisionId) ?? null;
  const openDecisions = decisions.filter((decision) => decision.status === 'OPEN');
  const averageConfidence = useMemo(() => {
    if (decisions.length === 0) return null;
    return decisions.reduce((total, decision) => total + decision.confidenceScore, 0) / decisions.length;
  }, [decisions]);

  if (isLoading) return <LoadingState label="Loading decisions" rows={3} />;

  if (isError) {
    return (
      <ErrorState
        title="Unable to load decisions"
        message={error instanceof Error ? error.message : undefined}
        variant="backend-unavailable"
        onRetry={() => void refetch()}
      />
    );
  }

  if (decisions.length === 0) {
    return (
      <EmptyState
        icon="balance"
        title="No decisions available"
        description="This workspace has no decision records returned by the decision API."
      />
    );
  }

  return (
    <section className="space-y-6" aria-labelledby="decision-center-heading">
      <header className="bento-card rounded-xl p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary font-label text-xs font-semibold uppercase tracking-widest">
            <Scale className="h-4 w-4" aria-hidden="true" /> Decision governance
          </div>
          <h1 id="decision-center-heading" className="mt-1 font-headline text-xl font-semibold text-on-surface">
            Executive Decision Center
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant font-body">
            Decision records and recommendation fields returned by the workspace API.
          </p>
        </div>
        <dl className="flex flex-wrap gap-3 font-label text-xs">
          <div className="rounded-lg bg-surface-container px-3 py-2 text-on-surface-variant">
            <dt className="inline">Open decisions: </dt>
            <dd className="inline font-semibold text-on-surface">{openDecisions.length}</dd>
          </div>
          {averageConfidence !== null && (
            <div className="rounded-lg bg-surface-container px-3 py-2 text-on-surface-variant">
              <dt className="inline">Average confidence: </dt>
              <dd className="inline font-semibold text-on-surface">{confidencePercent(averageConfidence)}</dd>
            </div>
          )}
        </dl>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <aside className="space-y-3" aria-label="Decision list">
          <h2 className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            Decisions
          </h2>
          {decisions.map((decision) => {
            const selected = selectedDecision?.id === decision.id;
            return (
              <button
                key={decision.id}
                type="button"
                onClick={() => setSelectedDecisionId(decision.id)}
                className={`w-full rounded-xl border p-4 text-start transition-colors ${
                  selected
                    ? 'border-primary bg-primary-container'
                    : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
                }`}
                aria-pressed={selected}
              >
                <div className="flex items-center justify-between gap-2 font-label text-xs">
                  <span className="rounded-full bg-surface-container-high px-2 py-1 text-on-surface-variant">
                    {decision.status}
                  </span>
                  <span className="text-on-surface-variant">Risk: {decision.riskScore}/100</span>
                </div>
                <h3 className="mt-3 font-headline text-sm font-semibold text-on-surface">{decision.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{decision.question}</p>
              </button>
            );
          })}
        </aside>

        {selectedDecision && (
          <article className="bento-card rounded-xl p-6 space-y-6 lg:col-span-2">
            <div className="flex flex-col gap-3 border-b border-outline-variant pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-label text-xs text-on-surface-variant">
                  {selectedDecision.category} · {selectedDecision.businessImpact}
                </p>
                <h2 className="mt-1 font-headline text-lg font-semibold text-on-surface">{selectedDecision.title}</h2>
              </div>
              {selectedDecision.status === 'APPROVED' ? (
                <span className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-3 py-2 text-xs font-semibold text-on-primary-container">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Approved
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => approveDecision.mutate(selectedDecision.id)}
                  disabled={approveDecision.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {approveDecision.isPending ? 'Approving…' : 'Approve decision'}
                </button>
              )}
            </div>

            {approveDecision.isError && (
              <ErrorState
                title="Unable to approve decision"
                message={approveDecision.error instanceof Error ? approveDecision.error.message : undefined}
                variant="generic"
              />
            )}

            <div className="rounded-xl bg-surface-container p-4">
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Decision question</p>
              <p className="mt-2 text-sm leading-relaxed text-on-surface">{selectedDecision.question}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-surface-container p-3">
                <dt className="font-label text-xs text-on-surface-variant">Expected ROI</dt>
                <dd className="mt-1 font-headline text-base font-semibold text-on-surface">{selectedDecision.expectedROI || '—'}</dd>
              </div>
              <div className="rounded-xl bg-surface-container p-3">
                <dt className="font-label text-xs text-on-surface-variant">Risk score</dt>
                <dd className="mt-1 font-headline text-base font-semibold text-on-surface">{selectedDecision.riskScore}/100</dd>
              </div>
              <div className="rounded-xl bg-surface-container p-3">
                <dt className="font-label text-xs text-on-surface-variant">Confidence</dt>
                <dd className="mt-1 font-headline text-base font-semibold text-on-surface">
                  {confidencePercent(selectedDecision.confidenceScore)}
                </dd>
              </div>
              <div className="rounded-xl bg-surface-container p-3">
                <dt className="font-label text-xs text-on-surface-variant">Alternatives</dt>
                <dd className="mt-1 font-headline text-base font-semibold text-on-surface">{selectedDecision.alternatives.length}</dd>
              </div>
            </dl>

            {selectedDecision.aiRecommendation && (
              <div className="rounded-xl border border-primary/20 bg-primary-container p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="inline-flex items-center gap-2 font-label text-sm font-semibold text-on-primary-container">
                    <BrainCircuit className="h-4 w-4" aria-hidden="true" /> API recommendation
                  </h3>
                  <button
                    type="button"
                    onClick={() => simulateDecision.mutate(selectedDecision.id)}
                    disabled={simulateDecision.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    {simulateDecision.isPending ? 'Requesting…' : 'Request simulation'}
                  </button>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-on-primary-container">{selectedDecision.aiRecommendation}</p>
              </div>
            )}

            {simulateDecision.isError && (
              <ErrorState
                title="Simulation unavailable"
                message={simulateDecision.error instanceof Error ? simulateDecision.error.message : undefined}
                variant="backend-unavailable"
              />
            )}

            <div className="space-y-3">
              <h3 className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Returned alternatives</h3>
              {selectedDecision.alternatives.length === 0 ? (
                <EmptyState
                  icon="alt_route"
                  title="No alternatives returned"
                  description="The decision API did not return evaluated alternatives for this record."
                  className="p-6"
                />
              ) : (
                <div className="space-y-2">
                  {selectedDecision.alternatives.map((alternative) => (
                    <div key={`${alternative.name}-${alternative.score}`} className="flex flex-col gap-2 rounded-xl bg-surface-container p-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-body text-sm text-on-surface">{alternative.name}</span>
                      <span className="font-label text-xs text-on-surface-variant">
                        Score: {alternative.score}/100 · Cost: {alternative.cost}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {simulateDecision.data?.simulationResult && (
              <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Simulation result</p>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><dt className="text-on-surface-variant">Revenue</dt><dd className="font-semibold text-on-surface">{simulateDecision.data.simulationResult.expectedRevenue}</dd></div>
                  <div><dt className="text-on-surface-variant">Cost</dt><dd className="font-semibold text-on-surface">{simulateDecision.data.simulationResult.estimatedCost}</dd></div>
                  <div><dt className="text-on-surface-variant">Risk</dt><dd className="font-semibold text-on-surface">{simulateDecision.data.simulationResult.riskFactor}</dd></div>
                  <div><dt className="text-on-surface-variant">Timeline</dt><dd className="font-semibold text-on-surface">{simulateDecision.data.simulationResult.timeline}</dd></div>
                </dl>
              </div>
            )}
          </article>
        )}
      </div>

      {!selectedDecision && (
        <div className="flex items-center gap-2 rounded-xl bg-error-container p-4 text-sm text-on-error-container">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" /> No selected decision is available.
        </div>
      )}
    </section>
  );
};

export default DecisionCenterView;
