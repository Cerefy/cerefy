// src/features/ai-workspace/ExecutionPipeline.tsx
// Honest execution pipeline for the AI Workspace.
//
// The backend's /agents/execute returns coarse status (queued → success/error)
// with no per-stage events, so per the build guide we render only the real
// states we can back: Idle → Executing → Done/Failed. We do NOT synthesize
// step names like Retrieve/Validate that the backend cannot report yet.
// When it does report stages, extend `stageKind` below — never fake them.

import React from 'react';
import { ExecutionPulse, FlowDraw } from '../../lib/motion';
import { MsIcon } from '../../components/kinetic/primitives';

export type PipelineState = 'idle' | 'running' | 'done' | 'error';

const STAGE_META: Record<'executing' | 'result', { label: string; icon: string }> = {
  executing: { label: 'Executing', icon: 'sync' },
  result: { label: 'Answer', icon: 'reply' },
};

export const ExecutionPipeline: React.FC<{
  state: PipelineState;
  executionId?: string | null;
  latencyLabel?: string | null;
}> = ({ state, executionId, latencyLabel }) => {
  if (state === 'idle') {
    return (
      <div className="flex items-center gap-2 opacity-70">
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }} aria-hidden="true">
          radio_button_unchecked
        </span>
        <span className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
          Awaiting instruction
        </span>
      </div>
    );
  }

  const executing = state === 'running';
  const done = state === 'done' || state === 'error';

  return (
    <div className="space-y-3">
      <FlowDraw>
        <ExecutionPulse active={executing}>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-label text-[11px] uppercase tracking-wider ${
              executing
                ? 'bg-on-surface text-surface border-on-surface'
                : state === 'error'
                  ? 'bg-error-container text-on-error-container border-error-container'
                  : 'bg-tertiary-container text-on-tertiary-container border-tertiary-container'
            }`}
          >
            <MsIcon name={STAGE_META.executing.icon} size={14} className={executing ? 'animate-spin' : ''} />
            {STAGE_META.executing.label}
          </div>
        </ExecutionPulse>

        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-label text-[11px] uppercase tracking-wider ${
            done
              ? state === 'error'
                ? 'bg-error-container text-on-error-container border-error-container'
                : 'bg-tertiary-container text-on-tertiary-container border-tertiary-container'
              : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40'
          }`}
        >
          <MsIcon name={state === 'error' ? 'error' : 'reply'} size={14} />
          {state === 'error' ? 'Failed' : STAGE_META.result.label}
        </div>
      </FlowDraw>

      {(executionId || latencyLabel) && (
        <p className="text-[11px] font-label text-on-surface-variant">
          {executionId && (
            <>
              Execution <span className="font-mono">{executionId}</span>
            </>
          )}
          {executionId && latencyLabel && <span aria-hidden="true"> · </span>}
          {latencyLabel}
        </p>
      )}
    </div>
  );
};