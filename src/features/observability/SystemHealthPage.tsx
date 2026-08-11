// src/features/observability/SystemHealthPage.tsx
// Honest system-health surface (execution guide Part 3, /observability).
//
// Reads the REAL backend health endpoints (/health/live, /health/ready).
// Overall status and every component row come from the backend response;
// if the endpoint is unreachable we show an ErrorState — we never simulate
// uptime. Count-up is applied only to backend-reported numbers (uptime).

import React, { useEffect, useState } from 'react';
import { apiGet } from '../../lib/apiClient';
import { CountUp } from '../../lib/motion';
import { EmptyState, ErrorState, LoadingState } from '../../components/design-system';
import { StatusPill, StatusDot } from '../../components/kinetic/primitives';
import { useI18n } from '../../lib/i18n';

interface ComponentHealth {
  status: 'up' | 'down' | 'unknown';
  latencyMs?: number;
  message?: string;
}

interface HealthSnapshot {
  status: string | null;
  uptime?: number;
  version?: string;
  environment?: string;
  timestamp?: string;
  checks?: Record<string, ComponentHealth>;
}

const PILL_FOR_STATUS: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  alive: 'success',
  healthy: 'success',
  degraded: 'warning',
  unhealthy: 'error',
  ok: 'success',
};

export const SystemHealthPage: React.FC = () => {
  const { t } = useI18n();
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const live = await apiGet<HealthSnapshot>('/health/live');
      if (!cancelled && !live.error) {
        const ready = await apiGet<HealthSnapshot>('/health/ready');
        if (!cancelled && !ready.error) {
          const base = ready.data ?? ({} as HealthSnapshot);
          setSnapshot({ ...base, uptime: base.uptime ?? live.data?.uptime });
          return;
        }
        setSnapshot(live.data);
        return;
      }
      if (!cancelled) setError('Health endpoints unreachable in this environment.');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const checksMap = snapshot?.checks ?? {};
  const componentRows = (Object.keys(checksMap) as string[]).map((name) => ({
    name,
    ...checksMap[name],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline text-[28px] md:text-[32px] font-semibold tracking-tight text-on-surface leading-[1.3] mb-1">
          {t('nav.health')}
        </h2>
        <p className="text-on-surface-variant text-[16px] font-body">
          Read-only view of the real backend health checks. Nothing here is simulated client-side.
        </p>
      </div>

      {snapshot === null && error === null && <LoadingState label="Querying /health/live + /health/ready" rows={3} />}

      {error && <ErrorState variant="backend-unavailable" message={error} />}

      {snapshot !== null && (
        <>
          {/* Overall status card */}
          <div className="bento-card rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <StatusPill
                label={snapshot.status ?? 'unknown'}
                variant={PILL_FOR_STATUS[snapshot.status ?? ''] ?? 'neutral'}
              />
              <span className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
                {snapshot.environment ?? 'unknown environment'}
              </span>
            </div>
            <div className="flex items-center gap-6 text-start">
              <div>
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">uptime (s)</p>
                <p className="font-headline text-xl font-semibold text-on-surface">
                  <CountUp value={snapshot.uptime ?? 0} />
                </p>
              </div>
              {typeof snapshot.version === 'string' && (
                <div>
                  <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">version</p>
                  <p className="font-mono text-sm text-on-surface">{snapshot.version}</p>
                </div>
              )}
            </div>
          </div>

          {/* Component checks */}
          {componentRows.length === 0 ? (
            <EmptyState
              icon="monitor_heart"
              title="No component checks reported"
              description="The backend returned a health status without per-component checks."
            />
          ) : (
            <div className="bento-card rounded-xl overflow-hidden">
              <ul className="divide-y divide-outline-variant/20">
                {componentRows.map((row) => (
                  <li key={row.name} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusDot
                        color={
                          row.status === 'up'
                            ? 'bg-emerald-signal'
                            : row.status === 'down'
                              ? 'bg-rose-signal'
                              : 'bg-surface-container-highest'
                        }
                      />
                      <div className="min-w-0">
                        <p className="font-body text-sm text-on-surface capitalize">{row.name}</p>
                        {row.message && (
                          <p className="text-[11px] font-label text-on-surface-variant truncate">{row.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {typeof row.latencyMs === 'number' && (
                        <span className="text-[11px] font-label text-on-surface-variant">{row.latencyMs} ms</span>
                      )}
                      <StatusPill
                        label={row.status}
                        variant={row.status === 'up' ? 'success' : row.status === 'down' ? 'error' : 'neutral'}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};