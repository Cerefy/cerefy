import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Zap,
  Clock,
  Download,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { decisions,  } = useAgentStore();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<'D' | 'W' | 'M'>('M');

  return (
    <div className="space-y-6 font-sans text-dark-text-muted selection:bg-indigo-signal/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-dark-text-bright tracking-tight font-sans">
              Analytics / Global Monitoring
            </h2>
            <span className="px-2.5 py-0.5 bg-indigo-signal/10 text-indigo-signal-strong text-[10px] font-mono font-bold rounded-full border border-indigo-signal/20">
              REAL-TIME TELEMETRY
            </span>
          </div>
          <p className="text-xs text-dark-muted mt-1 font-sans">
            Autonomous agent performance, compute efficiency, and strategic enterprise ROI metrics.
          </p>
        </div>
        <button
          onClick={() => alert('Exporting full Enterprise ROI Audit & Telemetry report (PDF)...')}
          className="px-4 py-2.5 bg-dark-panel-raised hover:bg-dark-panel-soft text-dark-text-bright text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer self-start md:self-auto border border-dark-panel-soft"
        >
          <Download className="h-4 w-4 text-cyan-signal-strong" />
          <span>Download Telemetry Export</span>
        </button>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Compute Efficiency */}
        <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-3 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs font-mono text-dark-muted uppercase tracking-wider font-semibold">
            <span>COMPUTE EFFICIENCY</span>
            <span className="text-emerald-signal-strong font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" /> +2.4%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-dark-text-bright font-sans tracking-tight">
            94.2%
          </div>
          <div className="w-full h-1.5 bg-dark-panel-deep rounded-full overflow-hidden border border-dark-panel-raised">
            <div className="h-full bg-indigo-signal rounded-full w-[94.2%]" />
          </div>
        </div>

        {/* KPI 2: Agent Success Rate */}
        <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-3 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs font-mono text-dark-muted uppercase tracking-wider font-semibold">
            <span>AGENT SUCCESS RATE</span>
            <span className="text-emerald-signal-strong font-bold">Stable</span>
          </div>
          <div className="text-3xl font-extrabold text-dark-text-bright font-sans tracking-tight">
            99.98%
          </div>
          {/* Step bar visualizer */}
          <div className="flex gap-1 h-2">
            {[98, 100, 100, 99, 100, 100, 100, 99, 100, 100].map((val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-emerald-signal/80 rounded-sm"
                title={`Cycle #${idx + 1}: ${val}%`}
              />
            ))}
          </div>
        </div>

        {/* KPI 3: Decision Velocity */}
        <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-3 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs font-mono text-dark-muted uppercase tracking-wider font-semibold">
            <span>DECISION VELOCITY</span>
            <span className="text-emerald-signal-strong font-bold flex items-center gap-0.5">
              <ArrowDownRight className="h-3.5 w-3.5 text-emerald-signal-strong" /> -12ms
            </span>
          </div>
          <div className="text-3xl font-extrabold text-dark-text-bright font-sans tracking-tight">
            142ms
          </div>
          <p className="text-[10px] text-dark-muted font-sans">
            Avg latency per autonomous cycle
          </p>
        </div>
      </div>

      {/* Middle Section: Intelligence Usage + Enterprise ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Intelligence Usage Chart */}
        <div className="lg:col-span-2 bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-dark-text-bright font-sans">Intelligence Usage</h3>
              <p className="text-xs text-dark-muted font-sans">Compute cycles vs. Token output - Last 30 Days</p>
            </div>
            <div className="flex bg-dark-panel-deep p-1 rounded-xl font-mono text-xs border border-dark-panel-raised">
              {(['D', 'W', 'M'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeframe === t ? 'bg-dark-panel-raised font-bold text-dark-text-bright shadow-sm' : 'text-dark-muted hover:text-dark-text-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Smooth area chart visualizer */}
          <div className="h-56 flex items-end justify-between gap-2 pt-8 pb-2 border-b border-dark-panel-raised">
            {[
              { label: 'W1', cycles: 40, tokens: 65 },
              { label: 'W2', cycles: 55, tokens: 78 },
              { label: 'W3', cycles: 48, tokens: 72 },
              { label: 'W4', cycles: 70, tokens: 88 },
              { label: 'W5', cycles: 85, tokens: 94 },
              { label: 'W6', cycles: 78, tokens: 90 },
              { label: 'W7', cycles: 92, tokens: 98 },
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  <div
                    className="bg-indigo-signal-deep rounded-t w-1/3 group-hover:bg-indigo-signal transition-all shadow-glow-indigo-tiny"
                    style={{ height: `${d.cycles}%` }}
                    title={`Compute Cycles: ${d.cycles}%`}
                  />
                  <div
                    className="bg-cyan-signal rounded-t w-1/3 group-hover:bg-cyan-signal-strong transition-all shadow-glow-cyan-soft"
                    style={{ height: `${d.tokens}%` }}
                    title={`Token Output: ${d.tokens}%`}
                  />
                </div>
                <span className="text-[10px] text-dark-muted font-mono">{d.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 text-xs font-sans text-dark-muted-strong">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded bg-indigo-signal-deep" /> Compute Cycles
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded bg-cyan-signal" /> Token Output
            </span>
          </div>
        </div>

        {/* Right 1 Col: Enterprise ROI Card */}
        <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 backdrop-blur-sm">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-dark-text-bright font-sans">Enterprise ROI</h3>
            <p className="text-xs text-dark-muted font-sans">Quarterly cost savings and output gain.</p>

            <div className="space-y-3 font-sans pt-2">
              <div className="p-3 bg-dark-panel-deep border border-dark-panel-raised rounded-xl flex justify-between items-center">
                <span className="text-xs text-dark-muted font-medium uppercase tracking-tight">HUMAN HOURS REPLACED</span>
                <span className="text-sm font-extrabold text-dark-text-bright font-mono">12,450 hrs</span>
              </div>

              <div className="p-3 bg-dark-panel-deep border border-dark-panel-raised rounded-xl flex justify-between items-center">
                <span className="text-xs text-dark-muted font-medium uppercase tracking-tight">INFRASTRUCTURE OPEX</span>
                <span className="text-sm font-extrabold text-emerald-signal-strong font-mono">-$42,100</span>
              </div>

              <div className="p-3 bg-indigo-signal/10 border border-indigo-signal/30 rounded-xl flex justify-between items-center text-indigo-signal-faint">
                <span className="text-xs font-bold uppercase tracking-tight">VALUE CREATION (EST.)</span>
                <span className="text-sm font-extrabold text-indigo-signal-strong font-mono">$1.2M</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => alert('Downloading full Enterprise Financial Audit PDF...')}
            className="w-full py-2.5 bg-dark-panel-raised hover:bg-dark-panel-soft text-dark-text-bright text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-dark-panel-soft"
          >
            Download Full Audit
          </button>
        </div>
      </div>

      {/* Bottom Section: Active Agent Clusters + Autonomous Decisions Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Agent Clusters */}
        <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-dark-text-bright font-sans">Active Agent Clusters</h3>
            <button
              onClick={() => navigate('/workspace/agents')}
              className="text-xs text-dark-muted hover:text-dark-text font-medium cursor-pointer"
            >
              View Roster
            </button>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {[
              { name: 'Procurement-a', load: 88, status: 'HIGH LOAD', color: 'bg-amber-signal' },
              { name: 'Compliance-Engine', load: 42, status: 'OPTIMAL', color: 'bg-emerald-signal' },
              { name: 'Market-Sentry', load: 12, status: 'IDLE', color: 'bg-dark-panel-soft' },
              { name: 'Strategy-Agent', load: 94, status: 'BUSY', color: 'bg-indigo-signal-deep' },
            ].map((cluster, i) => (
              <div key={i} className="p-3 bg-dark-panel-deep border border-dark-panel-raised rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-dark-text-bright">{cluster.name}</span>
                  <span className="font-mono text-[10px] text-dark-muted">{cluster.load}% Load</span>
                </div>
                <div className="w-full h-1.5 bg-dark-panel-raised rounded-full overflow-hidden">
                  <div className={`h-full ${cluster.color} rounded-full`} style={{ width: `${cluster.load}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Autonomous Decisions Log */}
        <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-dark-text-bright font-sans">Autonomous Decisions Log</h3>
            <span className="text-xs text-emerald-signal-strong font-mono font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-signal-strong animate-pulse" /> Real-time
            </span>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {[
              {
                title: 'Hedge Rebalancing (BTC/USD)',
                confidence: '0.992',
                badge: 'OPTIMIZED',
                badgeColor: 'bg-emerald-signal/10 text-emerald-signal-strong border-emerald-signal/20',
              },
              {
                title: 'Data Breach Protocol 04-A',
                confidence: '0.998',
                badge: 'PREVENTATIVE',
                badgeColor: 'bg-indigo-signal/10 text-indigo-signal-strong border-indigo-signal/20',
              },
              {
                title: 'Supplier Node Switch (EMEA)',
                confidence: '0.845',
                badge: 'RECOVERY',
                badgeColor: 'bg-amber-signal/10 text-amber-signal-strong border-amber-signal/20',
              },
            ].map((dec, i) => (
              <div key={i} className="p-3 bg-dark-panel-deep border border-dark-panel-raised rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-dark-text-bright">{dec.title}</div>
                  <div className="text-[10px] text-dark-muted font-mono">Confidence Score: {dec.confidence}</div>
                </div>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${dec.badgeColor}`}>
                  {dec.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
