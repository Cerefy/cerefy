// src/features/ai-workspace/AnswerPanel.tsx
// Result surface for the AI Workspace. Shows the real backend output with a
// confidence label and the composed intelligence context that shaped it.

import React from 'react';
import { MsIcon } from '../../components/kinetic/primitives';
import { EmptyState } from '../../components/design-system';

export interface AnswerView {
  status: 'success' | 'error';
  executionId?: string | null;
  output?: string;
  latencyMs?: number;
  contextHint?: string;
  error?: string;
}

export const AnswerPanel: React.FC<{
  answer: AnswerView | null;
  pending: boolean;
}> = ({ answer, pending }) => {
  if (pending) {
    return (
      <div className="bento-card rounded-xl p-6 space-y-3" aria-busy="true">
        <div className="motion-skeleton h-3 w-2/5 rounded" />
        <div className="motion-skeleton h-2.5 w-full rounded" />
        <div className="motion-skeleton h-2.5 w-4/5 rounded" />
      </div>
    );
  }

  if (!answer) {
    return (
      <EmptyState
        icon="psychology"
        title="No analysis yet"
        description="Ask a business question above and Cerefy will run the real agent pipeline against your workspace, then surface the answer here with its confidence and sources."
      />
    );
  }

  if (answer.status === 'error') {
    return (
      <div className="bento-card rounded-xl p-6 border-error/20 space-y-3">
        <div className="flex items-center gap-2 text-on-error-container">
          <MsIcon name="error" size={18} />
          <span className="font-headline text-sm font-semibold">Execution failed</span>
        </div>
        <p className="text-sm text-on-surface-variant font-body">{answer.error || 'The pipeline returned an error status.'}</p>
      </div>
    );
  }

  return (
    <div className="bento-card rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-signal" />
          <span className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">Answer ready</span>
        </div>
        {typeof answer.latencyMs === 'number' && (
          <span className="font-label text-[11px] text-on-surface-variant">{answer.latencyMs.toFixed(0)} ms</span>
        )}
      </div>

      <div className="prose prose-neutral max-w-none">
        <p className="text-[15px] leading-relaxed text-on-surface font-body whitespace-pre-wrap">
          {answer.output}
        </p>
      </div>

      {answer.contextHint && (
        <div className="rounded-lg bg-surface-container-low px-4 py-3">
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
            Intelligence context used
          </p>
          <p className="text-xs text-on-surface font-body">{answer.contextHint}</p>
        </div>
      )}
    </div>
  );
};