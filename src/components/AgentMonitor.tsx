import React from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { Bot, CheckCircle2, AlertCircle, RefreshCw, Cpu, Sparkles, Terminal, FileCheck } from 'lucide-react';

export const AgentMonitor: React.FC = () => {
  const { executionPlan, isExecuting, logs, activeTenantId } = useAgentStore();

  const tenantLogs = logs.filter((l) => l.tenantId === activeTenantId);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 w-full text-slate-100 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
              Agent Execution Monitor
            </h3>
            <p className="text-[11px] text-slate-400">
              LangGraph StateGraph Execution Pipeline & Self-Correction
            </p>
          </div>
        </div>

        {isExecuting ? (
          <span className="flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] font-mono text-amber-400">
            <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
            Executing DAG
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] font-mono text-emerald-400">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Engine Ready
          </span>
        )}
      </div>

      {/* Active Execution Steps Stream */}
      {executionPlan ? (
        <div className="space-y-3">
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono">Target Query:</span>
              <span className="text-slate-500 font-mono text-[10px]">
                Session: {executionPlan.sessionId}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-200 font-mono bg-slate-950 p-2 rounded border border-slate-800">
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
                    ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                    : step.status === 'running'
                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-200 shadow-sm shadow-blue-500/10'
                    : step.status === 'failed'
                    ? 'bg-red-950/30 border-red-500/30 text-red-300'
                    : 'bg-slate-950/50 border-slate-800/60 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-slate-800 font-mono text-[10px] font-bold text-slate-400 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold font-mono">{step.agentName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {step.agentRole}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-slate-500">
                    {step.status.toUpperCase()}
                  </span>
                </div>

                {step.output && (
                  <p className="text-[11px] text-slate-300 bg-slate-950/80 p-2 rounded border border-slate-800 font-mono leading-relaxed">
                    {step.output}
                  </p>
                )}

                {step.reflectionNotes && (
                  <div className="text-[10px] font-mono text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2 rounded flex items-start gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
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
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
                <FileCheck className="h-4 w-4 text-emerald-400" /> Output Synthesis Verified
              </div>
              <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line bg-slate-950 p-3 rounded border border-slate-800/80">
                {executionPlan.finalResponse}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty / Idle State */
        <div className="p-8 text-center space-y-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
          <Cpu className="h-8 w-8 text-slate-600 mx-auto animate-pulse" />
          <div>
            <div className="text-xs font-semibold text-slate-300 font-mono">
              No Active Execution Session
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
              Trigger a multi-agent workflow query using the Command Palette (⌘K) or the Orchestrator tab.
            </p>
          </div>
        </div>
      )}

      {/* Audit Log Stream */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="h-3 w-3 text-slate-500" /> Recent Execution Logs ({tenantLogs.length})
          </span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {tenantLogs.map((log) => (
            <div
              key={log.id}
              className="p-2 bg-slate-900/80 rounded border border-slate-800/80 text-[11px] flex items-center justify-between font-mono"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-emerald-400 text-[9px] px-1 bg-emerald-500/10 rounded">
                  {log.status}
                </span>
                <span className="text-slate-300 font-medium truncate">{log.agentId}</span>
              </div>
              <div className="text-slate-500 text-[10px] shrink-0">
                {log.executionTimeMs}ms
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
