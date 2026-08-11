import React from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { Bot, CheckCircle2, AlertCircle, RefreshCw, Cpu, Sparkles, Terminal, FileCheck } from 'lucide-react';

export const AgentMonitor: React.FC = () => {
  const { executionPlan, isExecuting, logs, activeTenantId } = useAgentStore();

  const tenantLogs = logs.filter((l) => l.tenantId === activeTenantId);

  return (
    <div className="bg-slate-deep border border-slate-panel-raised rounded-xl p-5 w-full text-slate-text-bright shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-panel-raised/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-signal/10 text-blue-signal-strong border border-blue-signal/20">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-text">
              Agent Execution Monitor
            </h3>
            <p className="text-[11px] text-slate-muted-strong">
              LangGraph StateGraph Execution Pipeline & Self-Correction
            </p>
          </div>
        </div>

        {isExecuting ? (
          <span className="flex items-center gap-2 px-2.5 py-1 bg-amber-signal/10 border border-amber-signal/30 rounded-full text-[11px] font-mono text-amber-signal-strong">
            <RefreshCw className="h-3 w-3 animate-spin text-amber-signal-strong" />
            Executing DAG
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-signal/10 border border-emerald-signal/30 rounded-full text-[11px] font-mono text-emerald-signal-strong">
            <CheckCircle2 className="h-3 w-3 text-emerald-signal-strong" />
            Engine Ready
          </span>
        )}
      </div>

      {/* Active Execution Steps Stream */}
      {executionPlan ? (
        <div className="space-y-3">
          <div className="bg-slate-panel/90 border border-slate-panel-raised/90 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-muted-strong font-mono">Target Query:</span>
              <span className="text-slate-muted font-mono text-[10px]">
                Session: {executionPlan.sessionId}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-text font-mono bg-slate-deep p-2 rounded border border-slate-panel-raised">
              "{executionPlan.query}"
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-2">
            {executionPlan.steps.map((step, idx) => (
              <div
                key={step.id}
                className={`p-3 rounded-lg border transition-all text-xs space-y-1.5 ${
                  step.status === 'completed'
                    ? 'bg-slate-panel/60 border-slate-panel-raised text-slate-text'
                    : step.status === 'running'
                    ? 'bg-blue-signal-ink/40 border-blue-signal/40 text-blue-signal-soft shadow-sm shadow-blue-signal/10'
                    : step.status === 'failed'
                    ? 'bg-rose-signal-ink/30 border-rose-signal/30 text-rose-signal-soft'
                    : 'bg-slate-deep/50 border-slate-panel-raised/60 text-slate-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-slate-panel-raised font-mono text-[10px] font-bold text-slate-muted-strong flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold font-mono">{step.agentName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-panel-raised text-slate-muted-strong font-mono">
                      {step.agentRole}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-slate-muted">
                    {step.status.toUpperCase()}
                  </span>
                </div>

                {step.output && (
                  <p className="text-[11px] text-slate-text-muted bg-slate-deep/80 p-2 rounded border border-slate-panel-raised font-mono leading-relaxed">
                    {step.output}
                  </p>
                )}

                {step.reflectionNotes && (
                  <div className="text-[10px] font-mono text-amber-signal-soft/90 bg-amber-signal/10 border border-amber-signal/20 p-2 rounded flex items-start gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-signal-strong shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Reflection Self-Correction:</span>{' '}
                      {step.reflectionNotes}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final Response Display */}
          {executionPlan.finalResponse && (
            <div className="bg-emerald-signal-ink/20 border border-emerald-signal/30 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-signal-strong font-mono">
                <FileCheck className="h-4 w-4 text-emerald-signal-strong" /> Output Synthesis Verified
              </div>
              <div className="text-xs text-slate-text leading-relaxed font-sans whitespace-pre-line bg-slate-deep p-3 rounded border border-slate-panel-raised/80">
                {executionPlan.finalResponse}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty / Idle State */
        <div className="p-8 text-center space-y-3 bg-slate-panel/40 rounded-lg border border-slate-panel-raised/60">
          <Cpu className="h-8 w-8 text-slate-border mx-auto animate-pulse" />
          <div>
            <div className="text-xs font-semibold text-slate-text-muted font-mono">
              No Active Execution Session
            </div>
            <p className="text-[11px] text-slate-muted max-w-xs mx-auto mt-1">
              Trigger a multi-agent workflow query using the Command Palette (⌘K) or the Orchestrator tab.
            </p>
          </div>
        </div>
      )}

      {/* Audit Log Stream */}
      <div className="pt-2 border-t border-slate-panel-raised/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-semibold text-slate-muted-strong uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="h-3 w-3 text-slate-muted" /> Recent Execution Logs ({tenantLogs.length})
          </span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {tenantLogs.map((log) => (
            <div
              key={log.id}
              className="p-2 bg-slate-panel/80 rounded border border-slate-panel-raised/80 text-[11px] flex items-center justify-between font-mono"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-emerald-signal-strong text-[9px] px-1 bg-emerald-signal/10 rounded">
                  {log.status}
                </span>
                <span className="text-slate-text-muted font-medium truncate">{log.agentId}</span>
              </div>
              <div className="text-slate-muted text-[10px] shrink-0">
                {log.executionTimeMs}ms
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
