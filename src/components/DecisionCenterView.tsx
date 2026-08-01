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
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase mb-1">
            <Scale className="h-4 w-4" /> AI Strategic Decision &amp; Simulation Engine
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Decision Center</h2>
          <p className="text-xs text-slate-400 font-mono">
            Simulate financial ROI, risk scores, and alternative scenarios before board approvals.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300">
            Pending Decisions: <span className="text-amber-400 font-bold">{decisions.filter(d => d.status === 'OPEN').length}</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300">
            Avg Confidence: <span className="text-emerald-400 font-bold">92.4%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Decision Selector + Simulation Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Decisions List Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
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
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 font-mono text-xs">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dec.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {dec.status}
                    </span>
                    <span className="text-cyan-400 font-bold">Risk: {dec.riskScore}/100</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1 leading-snug">{dec.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{dec.question}</p>
                </div>
              );
            })}
          </div>
        </div>

            {/* Selected Decision Detail & Interactive Simulation Engine */}
        {selectedDecision && (
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
                  <span>Category: {selectedDecision.category || selectedDecision.businessImpact || 'Strategy'}</span>
                  <span>•</span>
                  <span>Impact: {selectedDecision.businessImpact}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedDecision.title}</h3>
              </div>

              <div className="flex items-center gap-2 font-mono">
                {selectedDecision.status === 'APPROVED' ? (
                  <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Approved &amp; Executed
                  </span>
                ) : (
                  <button
                    onClick={() => approveDecision(selectedDecision.id)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Approve Board Action</span>
                  </button>
                )}
              </div>
            </div>

            {/* Question & Context */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Executive Prompt Question</span>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">{selectedDecision.question}</p>
            </div>

            {/* Key Simulation KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Expected ROI</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">{selectedDecision.expectedROI}</div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Risk Level</div>
                <div className="text-lg font-bold text-amber-300 mt-1">{selectedDecision.riskScore}/100</div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">AI Confidence</div>
                <div className="text-lg font-bold text-cyan-400 mt-1">
                  {Math.round((selectedDecision.confidence ?? (selectedDecision.confidenceScore ? selectedDecision.confidenceScore / 100 : 0.9)) * 100)}%
                </div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Alternatives</div>
                <div className="text-lg font-bold text-indigo-300 mt-1">
                  {(selectedDecision.alternatives || []).length} Evaluated
                </div>
              </div>
            </div>

            {/* AI Recommendation Summary */}
            <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-xl space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-indigo-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <BrainCircuit className="h-4 w-4 text-cyan-400" /> Executive AI Recommendation:
                </span>
                <button
                  onClick={() => runDecisionSimulation(selectedDecision.id)}
                  className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded cursor-pointer transition-colors"
                >
                  ▶ Re-Simulate
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-xs">
                {selectedDecision.aiRecommendation}
              </p>
            </div>

            {/* Evaluated Scenarios & Alternatives */}
            <div className="space-y-3 font-mono text-xs">
              <h4 className="font-bold text-slate-300 uppercase">Simulated Strategic Options</h4>
              <div className="space-y-2">
                {(selectedDecision.alternatives || []).map((alt, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-indigo-400 font-bold mr-2">Option {String.fromCharCode(65 + idx)}:</span>
                      <span className="text-slate-200">{alt.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="text-slate-400">Score: <strong className="text-cyan-400">{alt.score}/100</strong></span>
                      <span className="text-slate-400">Cost: <strong className="text-slate-200">{alt.cost}</strong></span>
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
