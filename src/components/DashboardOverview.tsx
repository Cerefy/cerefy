import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../store/useAgentStore';
import {
  Sparkles,
  TrendingUp,
  Zap,
  Activity,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Globe,
  CheckCircle2,
  Clock,
  Download,
  Bot,
  Layers,
  Search,
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const { decisions, approveDecision, runDecisionSimulation } = useAgentStore();
  const [timeframe, setTimeframe] = useState<'Real-time' | 'Past 24h' | 'Reports'>('Real-time');
  const [filterText, setFilterText] = useState('');

  return (
    <div className="space-y-6 font-sans text-dark-text-muted selection:bg-indigo-signal/30">
      {/* Top Header Navigation & Time Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/workspace/dashboard')}
            className="px-3 py-1.5 bg-indigo-signal/10 text-indigo-signal-strong font-bold text-xs rounded-xl border border-indigo-signal/20 cursor-pointer flex items-center gap-1.5 font-sans"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-signal animate-pulse" />
            <span>Mission Control</span>
          </button>
          <button
            onClick={() => navigate('/workspace/studio')}
            className="px-3 py-1.5 text-dark-muted hover:text-dark-text font-medium text-xs rounded-xl hover:bg-dark-panel-raised transition-colors cursor-pointer font-sans"
          >
            Studio
          </button>
          <button
            onClick={() => navigate('/workspace/memory')}
            className="px-3 py-1.5 text-dark-muted hover:text-dark-text font-medium text-xs rounded-xl hover:bg-dark-panel-raised transition-colors cursor-pointer font-sans"
          >
            Memory
          </button>
          <button
            onClick={() => navigate('/workspace/analytics')}
            className="px-3 py-1.5 text-dark-muted hover:text-dark-text font-medium text-xs rounded-xl hover:bg-dark-panel-raised transition-colors cursor-pointer font-sans"
          >
            Analytics
          </button>
        </div>

        <div className="flex bg-dark-panel-deep p-1 rounded-xl font-mono text-xs self-start md:self-auto border border-dark-panel-raised">
          {(['Real-time', 'Past 24h', 'Reports'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-sans ${
                timeframe === t ? 'bg-dark-panel-raised font-bold text-dark-text-bright shadow-sm' : 'text-dark-muted hover:text-dark-text-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPIs: Strategic ROI Impact, Decision Velocity, Autonomous Load */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Strategic ROI Impact */}
        <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-3 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs font-mono text-dark-muted uppercase tracking-wider font-semibold">
            <span>STRATEGIC ROI IMPACT</span>
            <span className="text-emerald-signal-strong font-bold">+12.4%</span>
          </div>
          <div className="text-3xl font-extrabold text-dark-text-bright font-sans tracking-tight">
            $2.44M <span className="text-xs font-normal text-dark-muted">/ quarterly</span>
          </div>
          <p className="text-[10px] text-dark-muted font-sans">
            Measured across 18 autonomous departmental pipelines
          </p>
        </div>

        {/* KPI 2: Decision Velocity */}
        <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-3 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs font-mono text-dark-muted uppercase tracking-wider font-semibold">
            <span>DECISION VELOCITY</span>
            <span className="text-emerald-signal-strong font-bold">-45ms</span>
          </div>
          <div className="text-3xl font-extrabold text-dark-text-bright font-sans tracking-tight">
            1.2s <span className="text-xs font-normal text-dark-muted">avg response</span>
          </div>
          <p className="text-[10px] text-dark-muted font-sans">
            End-to-end multi-agent orchestration latency
          </p>
        </div>

        {/* KPI 3: Autonomous Load */}
        <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-3 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs font-mono text-dark-muted uppercase tracking-wider font-semibold">
            <span>AUTONOMOUS LOAD</span>
            <span className="text-indigo-signal-strong font-bold">88% of workflows</span>
          </div>
          <div className="text-3xl font-extrabold text-dark-text-bright font-sans tracking-tight">
            88%
          </div>
          <div className="flex justify-between items-center text-[10px] text-dark-muted font-sans pt-1">
            <span>ACTIVE: <strong className="text-dark-text-muted font-mono">1,402</strong></span>
            <span>PENDING: <strong className="text-dark-text-muted font-mono">128</strong></span>
            <span>MANUAL: <strong className="text-dark-text-muted font-mono">42</strong></span>
          </div>
        </div>
      </div>

      {/* Strategic Alerts Section */}
      <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
        <h3 className="text-base font-bold text-dark-text-bright font-sans flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-signal-strong" /> Strategic Alerts
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Alert 1 */}
          <div className="p-4 bg-amber-signal/5 border border-amber-signal/20 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <span className="font-bold text-xs text-amber-signal-tint font-sans flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-signal" /> Compliance Drift Detected
              </span>
              <span className="px-2 py-0.5 bg-amber-signal/20 text-amber-signal-soft font-mono text-[9px] font-bold rounded border border-amber-signal/30">
                HIGH PRIORITY
              </span>
            </div>
            <p className="text-xs text-amber-signal-faint/70 leading-relaxed font-sans">
              Agent 'Fin-Alpha-4' initiated a transaction protocol that deviates from 2024 EU-AI data sovereignty frameworks.
            </p>
            <div className="flex items-center gap-2 pt-1 font-sans">
              <button
                onClick={() => alert("Agent 'Fin-Alpha-4' frozen.")}
                className="px-3 py-1.5 bg-amber-signal-deep hover:bg-amber-signal text-dark-text-bright rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Freeze Agent
              </button>
              <button
                onClick={() => navigate('/workspace/security')}
                className="px-3 py-1.5 bg-dark-panel/50 border border-amber-signal/30 text-amber-signal-tint rounded-lg text-xs font-semibold cursor-pointer hover:bg-amber-signal/10 transition-colors"
              >
                Review Logs
              </button>
            </div>
          </div>

          {/* Alert 2 */}
          <div className="p-4 bg-indigo-signal/5 border border-indigo-signal/20 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <span className="font-bold text-xs text-indigo-signal-tint font-sans flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-indigo-signal-strong" /> Optimization Opportunity
              </span>
              <span className="px-2 py-0.5 bg-indigo-signal/20 text-indigo-signal-soft font-mono text-[9px] font-bold rounded border border-indigo-signal/30">
                RECOMMENDED
              </span>
            </div>
            <p className="text-xs text-indigo-signal-faint/70 leading-relaxed font-sans">
              Supply chain routing agents have identified a $45k monthly saving by switching EMEA logistics to Node B.
            </p>
            <div className="flex items-center gap-2 pt-1 font-sans">
              <button
                onClick={() => alert('Executing supply chain node optimization...')}
                className="px-3.5 py-1.5 bg-indigo-signal-deep hover:bg-indigo-signal text-dark-text-bright rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
              >
                Execute Action <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous Decision Log Table */}
      <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-dark-text-bright font-sans">Autonomous Decision Log</h3>
          <div className="relative w-64">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dark-muted" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search decisions..."
              className="w-full pl-9 pr-3 py-1.5 bg-dark-panel-deep border border-dark-panel-raised rounded-xl text-xs outline-none focus:border-indigo-signal text-dark-text font-sans"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-dark-panel-raised text-dark-muted font-mono text-[10px] uppercase">
                <th className="pb-2 font-semibold">DECISION &amp; OBJECTIVE</th>
                <th className="pb-2 font-semibold">CONFIDENCE SCORE</th>
                <th className="pb-2 font-semibold">BUSINESS IMPACT</th>
                <th className="pb-2 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-panel-raised/50">
              {decisions.map((dec) => (
                <tr key={dec.id} className="hover:bg-dark-panel-raised/30 transition-colors">
                  <td className="py-3 max-w-xs">
                    <div className="font-bold text-dark-text-bright">{dec.title}</div>
                    <div className="text-[11px] text-dark-muted truncate">{dec.question}</div>
                  </td>
                  <td className="py-3 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-dark-panel-raised rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-signal rounded-full"
                          style={{ width: `${dec.confidenceScore}%` }}
                        />
                      </div>
                      <span className="font-bold text-dark-text-muted">{dec.confidenceScore}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-emerald-signal/10 text-emerald-signal-strong font-mono text-[10px] font-bold rounded border border-emerald-signal/20">
                      {dec.expectedROI}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {dec.status === 'APPROVED' ? (
                      <span className="text-emerald-signal-strong font-bold font-mono">EXECUTED</span>
                    ) : (
                      <button
                        onClick={() => approveDecision(dec.id)}
                        className="px-3 py-1 bg-indigo-signal-deep hover:bg-indigo-signal text-dark-text-bright rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Strategic Footprint Map / Grid */}
      <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-dark-text-bright font-sans flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-signal-strong" /> Global Strategic Footprint
            </h3>
            <p className="text-xs text-dark-muted font-sans">
              Distributed agent execution clusters operating across global cloud regions.
            </p>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-signal/10 text-emerald-signal-strong font-mono text-[10px] font-bold rounded border border-emerald-signal/20">
            ALL REGIONS HEALTHY
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans text-xs">
          <div className="p-4 bg-dark-panel-deep border border-dark-panel-raised rounded-xl space-y-1 hover:border-dark-panel-soft transition-colors">
            <div className="font-bold text-dark-text">US-East (Virginia)</div>
            <div className="text-[10px] text-dark-muted font-mono">4,200 agent req/min</div>
            <span className="inline-block mt-2 px-1.5 py-0.5 bg-emerald-signal/10 text-emerald-signal-strong text-[9px] font-bold rounded border border-emerald-signal/20">
              High Utility
            </span>
          </div>

          <div className="p-4 bg-dark-panel-deep border border-dark-panel-raised rounded-xl space-y-1 hover:border-dark-panel-soft transition-colors">
            <div className="font-bold text-dark-text">EU-Central (Frankfurt)</div>
            <div className="text-[10px] text-dark-muted font-mono">2,800 agent req/min</div>
            <span className="inline-block mt-2 px-1.5 py-0.5 bg-emerald-signal/10 text-emerald-signal-strong text-[9px] font-bold rounded border border-emerald-signal/20">
              GDPR Isolated
            </span>
          </div>

          <div className="p-4 bg-dark-panel-deep border border-dark-panel-raised rounded-xl space-y-1 hover:border-dark-panel-soft transition-colors">
            <div className="font-bold text-dark-text">AP-East (Tokyo)</div>
            <div className="text-[10px] text-dark-muted font-mono">1,950 agent req/min</div>
            <span className="inline-block mt-2 px-1.5 py-0.5 bg-emerald-signal/10 text-emerald-signal-strong text-[9px] font-bold rounded border border-emerald-signal/20">
              Normal
            </span>
          </div>

          <div className="p-4 bg-dark-panel-deep border border-dark-panel-raised rounded-xl space-y-1 hover:border-dark-panel-soft transition-colors">
            <div className="font-bold text-dark-text">SA-East (São Paulo)</div>
            <div className="text-[10px] text-dark-muted font-mono">820 agent req/min</div>
            <span className="inline-block mt-2 px-1.5 py-0.5 bg-dark-panel-raised text-dark-muted text-[9px] font-bold rounded border border-dark-panel-soft">
              Standby
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
