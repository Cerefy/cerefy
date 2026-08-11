import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import {
  Scale,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Play,
  Clock,
  DollarSign,
} from 'lucide-react';

export const DecisionCenterView: React.FC = () => {
  const { decisions, runDecisionSimulation, approveDecision } = useAgentStore();
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>(decisions[0]?.id || 'dec_1');

  const selectedDecision = decisions.find((d) => d.id === selectedDecisionId) || decisions[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-slate-panel border border-slate-panel-raised p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-signal-strong font-mono text-xs font-bold uppercase mb-1">
            <Scale className="h-4 w-4" /> AI Strategic Decision &amp; Simulation Engine
          </div>
          <h2 className="text-xl font-bold text-dark-text-bright tracking-tight">Executive Decision Center</h2>
          <p className="text-xs text-slate-muted-strong font-mono">
            Simulate financial ROI, risk scores, and alternative scenarios before board approvals.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 bg-slate-deep border border-slate-panel-raised rounded-xl text-slate-text-muted">
            Pending Decisions: <span className="text-amber-signal-strong font-bold">{decisions.filter(d => d.status === 'OPEN').length}</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-deep border border-slate-panel-raised rounded-xl text-slate-text-muted">
            Avg Confidence: <span className="text-emerald-signal-strong font-bold">92.4%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Decision Selector + Simulation Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Decisions List Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-muted-strong">
            Open Board Decisions
          </h3>
          <div className="space-y-3">
            {decisions.map((dec) => {
              const isSelected = dec.id === selectedDecisionId;
              return (
                <div
                  key={dec.id}
                  onClick={() => setSelectedDecisionId(dec.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-signal-ink/60 border-indigo-signal shadow-lg shadow-indigo-signal/10'
                      : 'bg-slate-panel border-slate-panel-raised hover:border-slate-panel-soft'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 font-mono text-xs">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dec.status === 'APPROVED'
                          ? 'bg-emerald-signal/20 text-emerald-signal-soft border border-emerald-signal/30'
                          : 'bg-amber-signal/20 text-amber-signal-soft border border-amber-signal/30'
                      }`}
                    >
                      {dec.status}
                    </span>
                    <span className="text-cyan-signal-strong font-bold">Risk: {dec.riskScore}/100</span>
                  </div>
                  <h4 className="text-sm font-bold text-dark-text-bright mb-1 leading-snug">{dec.title}</h4>
                  <p className="text-xs text-slate-muted-strong line-clamp-2">{dec.question}</p>
                </div>
              );
            })}
          </div>
        </div>

            {/* Selected Decision Detail & Interactive Simulation Engine */}
        {selectedDecision && (
          <div className="lg:col-span-2 bg-slate-panel/90 border border-slate-panel-raised rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-panel-raised pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-muted-strong mb-1">
                  <span>Category: {selectedDecision.category || selectedDecision.businessImpact || 'Strategy'}</span>
                  <span>•</span>
                  <span>Impact: {selectedDecision.businessImpact}</span>
                </div>
                <h3 className="text-lg font-bold text-dark-text-bright">{selectedDecision.title}</h3>
              </div>

              <div className="flex items-center gap-2 font-mono">
                {selectedDecision.status === 'APPROVED' ? (
                  <span className="px-3 py-1.5 bg-emerald-signal/20 text-emerald-signal-soft border border-emerald-signal/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Approved &amp; Executed
                  </span>
                ) : (
                  <button
                    onClick={() => approveDecision(selectedDecision.id)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-signal-deep to-teal-signal hover:from-emerald-signal hover:to-teal-signal-soft text-dark-text-bright font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Approve Board Action</span>
                  </button>
                )}
              </div>
            </div>

            {/* Question & Context */}
            <div className="bg-slate-deep p-4 rounded-xl border border-slate-panel-raised space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-muted uppercase">Executive Prompt Question</span>
              <p className="text-sm text-slate-text leading-relaxed font-sans">{selectedDecision.question}</p>
            </div>

            {/* Key Simulation KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              <div className="bg-slate-deep p-3.5 rounded-xl border border-slate-panel-raised">
                <div className="text-[10px] text-slate-muted uppercase">Expected ROI</div>
                <div className="text-lg font-bold text-emerald-signal-strong mt-1">{selectedDecision.expectedROI}</div>
              </div>
              <div className="bg-slate-deep p-3.5 rounded-xl border border-slate-panel-raised">
                <div className="text-[10px] text-slate-muted uppercase">Risk Level</div>
                <div className="text-lg font-bold text-amber-signal-soft mt-1">{selectedDecision.riskScore}/100</div>
              </div>
              <div className="bg-slate-deep p-3.5 rounded-xl border border-slate-panel-raised">
                <div className="text-[10px] text-slate-muted uppercase">AI Confidence</div>
                <div className="text-lg font-bold text-cyan-signal-strong mt-1">
                  {Math.round((selectedDecision.confidence ?? (selectedDecision.confidenceScore ? selectedDecision.confidenceScore / 100 : 0.9)) * 100)}%
                </div>
              </div>
              <div className="bg-slate-deep p-3.5 rounded-xl border border-slate-panel-raised">
                <div className="text-[10px] text-slate-muted uppercase">Alternatives</div>
                <div className="text-lg font-bold text-indigo-signal-soft mt-1">
                  {(selectedDecision.alternatives || []).length} Evaluated
                </div>
              </div>
            </div>

            {/* AI Recommendation Summary */}
            <div className="bg-indigo-signal-ink/40 border border-indigo-signal/30 p-4 rounded-xl space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-indigo-signal-soft font-bold">
                <span className="flex items-center gap-1.5">
                  <BrainCircuit className="h-4 w-4 text-cyan-signal-strong" /> Executive AI Recommendation:
                </span>
                <button
                  onClick={() => runDecisionSimulation(selectedDecision.id)}
                  className="text-[10px] bg-indigo-signal-deep hover:bg-indigo-signal text-dark-text-bright px-2.5 py-1 rounded cursor-pointer transition-colors"
                >
                  ▶ Re-Simulate
                </button>
              </div>
              <p className="text-slate-text-muted leading-relaxed font-sans text-xs">
                {selectedDecision.aiRecommendation}
              </p>
            </div>

            {/* Evaluated Scenarios & Alternatives */}
            <div className="space-y-3 font-mono text-xs">
              <h4 className="font-bold text-slate-text-muted uppercase">Simulated Strategic Options</h4>
              <div className="space-y-2">
                {(selectedDecision.alternatives || []).map((alt, idx) => (
                  <div key={idx} className="p-3 bg-slate-deep border border-slate-panel-raised rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-indigo-signal-strong font-bold me-2">Option {String.fromCharCode(65 + idx)}:</span>
                      <span className="text-slate-text">{alt.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="text-slate-muted-strong">Score: <strong className="text-cyan-signal-strong">{alt.score}/100</strong></span>
                      <span className="text-slate-muted-strong">Cost: <strong className="text-slate-text">{alt.cost}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
