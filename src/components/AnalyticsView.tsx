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
    <div className="space-y-6 font-sans text-zinc-300 selection:bg-indigo-500/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight font-sans">
              Analytics / Global Monitoring
            </h2>
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold rounded-full border border-indigo-500/20">
              REAL-TIME TELEMETRY
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-sans">
            Autonomous agent performance, compute efficiency, and strategic enterprise ROI metrics.
          </p>
        </div>
        <button
          onClick={() => alert('Exporting full Enterprise ROI Audit & Telemetry report (PDF)...')}
          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer self-start md:self-auto border border-zinc-700"
        >
          <Download className="h-4 w-4 text-cyan-400" />
          <span>Download Telemetry Export</span>
        </button>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Compute Efficiency */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-3 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs font-mono text-zinc-500 uppercase tracking-wider font-semibold">
            <span>COMPUTE EFFICIENCY</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" /> +2.4%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white font-sans tracking-tight">
            94.2%
          </div>
          <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
            <div className="h-full bg-indigo-500 rounded-full w-[94.2%]" />
          </div>
        </div>

        {/* KPI 2: Agent Success Rate */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-3 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs font-mono text-zinc-500 uppercase tracking-wider font-semibold">
            <span>AGENT SUCCESS RATE</span>
            <span className="text-emerald-400 font-bold">Stable</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-sans tracking-tight">
            99.98%
          </div>
          {/* Step bar visualizer */}
          <div className="flex gap-1 h-2">
            {[98, 100, 100, 99, 100, 100, 100, 99, 100, 100].map((val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-emerald-500/80 rounded-sm"
                title={`Cycle #${idx + 1}: ${val}%`}
              />
            ))}
          </div>
        </div>

        {/* KPI 3: Decision Velocity */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-3 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs font-mono text-zinc-500 uppercase tracking-wider font-semibold">
            <span>DECISION VELOCITY</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowDownRight className="h-3.5 w-3.5 text-emerald-400" /> -12ms
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white font-sans tracking-tight">
            142ms
          </div>
          <p className="text-[10px] text-zinc-500 font-sans">
            Avg latency per autonomous cycle
          </p>
        </div>
      </div>

      {/* Middle Section: Intelligence Usage + Enterprise ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Intelligence Usage Chart */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white font-sans">Intelligence Usage</h3>
              <p className="text-xs text-zinc-500 font-sans">Compute cycles vs. Token output - Last 30 Days</p>
            </div>
            <div className="flex bg-zinc-950 p-1 rounded-xl font-mono text-xs border border-zinc-800">
              {(['D', 'W', 'M'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeframe === t ? 'bg-zinc-800 font-bold text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Smooth area chart visualizer */}
          <div className="h-56 flex items-end justify-between gap-2 pt-8 pb-2 border-b border-zinc-800">
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
                    className="bg-indigo-600 rounded-t w-1/3 group-hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                    style={{ height: `${d.cycles}%` }}
                    title={`Compute Cycles: ${d.cycles}%`}
                  />
                  <div
                    className="bg-cyan-500 rounded-t w-1/3 group-hover:bg-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                    style={{ height: `${d.tokens}%` }}
                    title={`Token Output: ${d.tokens}%`}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">{d.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 text-xs font-sans text-zinc-400">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded bg-indigo-600" /> Compute Cycles
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded bg-cyan-500" /> Token Output
            </span>
          </div>
        </div>

        {/* Right 1 Col: Enterprise ROI Card */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 backdrop-blur-sm">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white font-sans">Enterprise ROI</h3>
            <p className="text-xs text-zinc-500 font-sans">Quarterly cost savings and output gain.</p>

            <div className="space-y-3 font-sans pt-2">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-tight">HUMAN HOURS REPLACED</span>
                <span className="text-sm font-extrabold text-white font-mono">12,450 hrs</span>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-tight">INFRASTRUCTURE OPEX</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">-$42,100</span>
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex justify-between items-center text-indigo-100">
                <span className="text-xs font-bold uppercase tracking-tight">VALUE CREATION (EST.)</span>
                <span className="text-sm font-extrabold text-indigo-400 font-mono">$1.2M</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => alert('Downloading full Enterprise Financial Audit PDF...')}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-zinc-700"
          >
            Download Full Audit
          </button>
        </div>
      </div>

      {/* Bottom Section: Active Agent Clusters + Autonomous Decisions Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Agent Clusters */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white font-sans">Active Agent Clusters</h3>
            <button
              onClick={() => navigate('/workspace/agents')}
              className="text-xs text-zinc-500 hover:text-zinc-200 font-medium cursor-pointer"
            >
              View Roster
            </button>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {[
              { name: 'Procurement-a', load: 88, status: 'HIGH LOAD', color: 'bg-amber-500' },
              { name: 'Compliance-Engine', load: 42, status: 'OPTIMAL', color: 'bg-emerald-500' },
              { name: 'Market-Sentry', load: 12, status: 'IDLE', color: 'bg-zinc-700' },
              { name: 'Strategy-Agent', load: 94, status: 'BUSY', color: 'bg-indigo-600' },
            ].map((cluster, i) => (
              <div key={i} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-100">{cluster.name}</span>
                  <span className="font-mono text-[10px] text-zinc-500">{cluster.load}% Load</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${cluster.color} rounded-full`} style={{ width: `${cluster.load}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Autonomous Decisions Log */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white font-sans">Autonomous Decisions Log</h3>
            <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Real-time
            </span>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {[
              {
                title: 'Hedge Rebalancing (BTC/USD)',
                confidence: '0.992',
                badge: 'OPTIMIZED',
                badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              },
              {
                title: 'Data Breach Protocol 04-A',
                confidence: '0.998',
                badge: 'PREVENTATIVE',
                badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
              },
              {
                title: 'Supplier Node Switch (EMEA)',
                confidence: '0.845',
                badge: 'RECOVERY',
                badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              },
            ].map((dec, i) => (
              <div key={i} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-zinc-100">{dec.title}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">Confidence Score: {dec.confidence}</div>
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
