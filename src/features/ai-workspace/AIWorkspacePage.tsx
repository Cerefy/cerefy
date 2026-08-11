// src/features/ai-workspace/AIWorkspacePage.tsx
// The core loop: an intent in, a real pipeline execution, an answer.
//
// It wires the two honest stages the backend really supports (submission →
// result) and composes the deterministic intelligence context client-side.
// No intermediate steps are synthesized; the pipeline component renders the
// coarse states the /agents/execute endpoint actually returns.

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiPost } from '../../lib/apiClient';
import { ContextSelectors, DEFAULT_SELECTION, AIContextSelection } from './ContextSelectors';
import { ExecutionPipeline, PipelineState } from './ExecutionPipeline';
import { AnswerPanel, AnswerView } from './AnswerPanel';
import { composeContext } from '../../intelligence/context';
import { getMarketById } from '../../intelligence/markets/catalog';
import { getIndustryById } from '../../intelligence/industries';
import { detectLanguage } from '../../intelligence/detect';
import { useI18n } from '../../lib/i18n';

interface ExecuteResponse {
  status?: string;
  executionId?: string;
  latencyMs?: number;
  response?: string | Record<string, unknown> | null;
  output?: string;
  timestamp?: string;
  error?: string;
}

export const AIWorkspacePage: React.FC = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const prefilled = searchParams.get('q');
  const [selection, setSelection] = useState<AIContextSelection>(DEFAULT_SELECTION);
  const [query, setQuery] = useState(prefilled ?? '');
  const [state, setState] = useState<PipelineState>('idle');
  const [answer, setAnswer] = useState<AnswerView | null>(null);
  const [latencyLabel, setLatencyLabel] = useState<string | null>(null);
  const [sessionId] = useState(() => `ws_session_${Date.now().toString(36)}`);

  const run = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const market = selection.marketId ? getMarketById(selection.marketId) ?? null : null;
    const industry = selection.industryId ? getIndustryById(selection.industryId) ?? null : null;

    const context = composeContext({
      tenantId: 'org_demo_tenant',
      query: trimmed,
      organization: {
        tenantId: 'org_demo_tenant',
        marketId: selection.marketId ?? undefined,
        industryId: selection.industryId ?? undefined,
        language: selection.language,
        dialect: selection.dialect === 'arabizi' ? 'arabizi' : selection.dialect,
      },
      market,
      industry,
    });

setState('running');
    setAnswer(null);
    setLatencyLabel(null);
    const startedAt = performance.now();

    const { data, error } = await apiPost<ExecuteResponse, Record<string, unknown>>(`/api/v1/agents/execute`, {
      query: trimmed,
      sessionId,
      metadata: { dialect: selection.dialect, marketId: market?.id ?? null, industryId: industry?.id ?? null },
    });

    const latency = Math.round(performance.now() - startedAt);

    if (error) {
      setState('error');
      setAnswer({ status: 'error', executionId: data?.executionId, error: data?.error || error, latencyMs: latency });
      setLatencyLabel(`${latency} ms`);
      return;
    }

    const output =
      typeof data.response === 'string'
        ? data.response
        : data.response && typeof data.response === 'object'
          ? JSON.stringify(data.response)
          : data.output && typeof data.output === 'string'
            ? data.output
            : null;

    setState('done');
    setAnswer({
      status: 'success',
      executionId: data.executionId,
      output: output ?? 'The pipeline completed without a text answer.',
      latencyMs: latency,
      contextHint: context.contextHint,
    });
    setLatencyLabel(`${latency} ms`);
  }, [query, sessionId, selection]);

  // Auto-run once when the shell's AI Command Center routes intent here (?q=).
  // No duplicate run: the effect depends only on the prefilled value.
  const ranRef = React.useRef(false);
  useEffect(() => {
    if (prefilled && !ranRef.current) {
      ranRef.current = true;
      void run();
    }
  }, [prefilled, run]);

  const detectedLabel = query.trim()
    ? (() => {
        const d = detectLanguage(query.trim());
        return d?.language ? `detected: ${d.language}${d?.dialect?.dialect && d.dialect.dialect !== 'unknown' ? ` · ${d.dialect.dialect}` : ''}` : 'detected: —';
      })()
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-headline text-[28px] md:text-[32px] font-semibold tracking-tight text-on-surface leading-[1.3] mb-1">
            AI Workspace
          </h2>
          <p className="text-on-surface-variant text-[16px] font-body">
            Ask a business question. Cerefy runs the real agent pipeline against your workspace.
          </p>
        </div>
      </div>

      <ContextSelectors value={selection} onChange={setSelection} />

      <div className="bento-card rounded-xl p-5 space-y-4">
        {/* Input */}
        <div className="flex items-end gap-3">
          <label className="flex-1">
            <span className="block text-[11px] uppercase tracking-wider text-on-surface-variant font-label mb-1.5">
              Instruction {detectedLabel ? <span className="normal-case">({detectedLabel})</span> : null}
            </span>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void run();
              }}
              rows={3}
              placeholder="e.g. Provide a market entry recommendation for a fintech license in Saudi Arabia"
              className="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-on-surface transition-colors resize-none"
            />
          </label>
          <button
            onClick={() => void run()}
            disabled={!query.trim() || state === 'running'}
            className="inline-flex items-center gap-2 bg-on-surface text-surface px-5 py-3 rounded-xl font-label text-[13px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-inverse-surface transition-colors shrink-0"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
              {state === 'running' ? 'hourglass_top' : 'auto_awesome'}
            </span>
            {state === 'running' ? 'Running' : t('action.runAnalysis')}
          </button>
        </div>
        <p className="text-[11px] font-label text-on-surface-variant">{t('action.runHint')}</p>

        {/* Pipeline status */}
        <ExecutionPipeline state={state} executionId={answer?.executionId} latencyLabel={latencyLabel} />
      </div>

      <AnswerPanel answer={state === 'running' ? null : answer} pending={state === 'running'} />
    </div>
  );
};