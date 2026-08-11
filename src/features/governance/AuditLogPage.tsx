// src/features/governance/AuditLogPage.tsx
// Read-only audit view. It queries the backend audit surface; if the endpoint
// is unreachable it shows an ErrorState, and if it returns nothing it shows an
// EmptyState. No client-side log fabrication — ever.

import React, { useEffect, useState } from 'react';
import { apiGet } from '../../lib/apiClient';
import { EmptyState, ErrorState, LoadingState } from '../../components/design-system';
import { StatusPill } from '../../components/kinetic/primitives';
import { useI18n } from '../../lib/i18n';

interface AuditEntry {
  id?: string;
  timestamp?: string;
  action?: string;
  actor?: string;
  resource?: string;
  outcome?: string;
  status?: string;
}

const ENDPOINTS = ['/api/v1/audit', '/api/audit'];

export const AuditLogPage: React.FC = () => {
  const { t } = useI18n();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const url of ENDPOINTS) {
        const { data, error: err } = await apiGet<{ data?: AuditEntry[] } | unknown>(url);
        if (cancelled) return;
        if (!err) {
          const rows = (data as { data?: AuditEntry[] })?.data;
          if (Array.isArray(rows)) {
            setEntries(rows);
            setSource(url);
            return;
          }
        }
      }
      if (!cancelled) setError('No audit endpoint reachable in this environment.');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-headline text-[28px] md:text-[32px] font-semibold tracking-tight text-on-surface leading-[1.3] mb-1">
            Audit Log
          </h2>
          <p className="text-on-surface-variant text-[16px] font-body">
            Read-only view into the backend audit trail. Nothing here is fabricated client-side.
          </p>
        </div>
      </div>

      {entries === null && error === null && <LoadingState label="Connecting to audit backend" rows={4} />}

      {error && (
        <ErrorState
          title="Audit backend unreachable"
          message={error}
        />
      )}

      {entries !== null && entries.length === 0 && (
        <EmptyState
          icon="fact_check"
          title="No audit entries yet"
          description="Actor actions recorded by the backend will appear here in chronological order."
        />
      )}

      {entries !== null && entries.length > 0 && (
        <div className="bento-card rounded-xl overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between border-b border-outline-variant/30">
            <span className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
              {entries.length} events · {source}
            </span>
          </div>
          <ul className="divide-y divide-outline-variant/20">
            {entries.map((e) => (
              <li key={e.id ?? e.timestamp ?? 'entry'} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-body text-sm text-on-surface truncate">{e.action ?? 'action'}</p>
                  <p className="text-[11px] font-label text-on-surface-variant uppercase tracking-wider">
                    {e.actor ?? 'system'} · {e.timestamp ?? ''} · {e.resource ?? ''}
                  </p>
                </div>
                <StatusPill
                  label={e.status ?? 'ok'}
                  variant={e.status === 'denied' || e.status === 'failed' ? 'error' : 'success'}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};