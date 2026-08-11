import React from 'react';
import { MsIcon, GlassPanel, BentoCard, ProgressBar } from './primitives';

export const AnalyticsDashboard: React.FC = () => (
  <div className="flex flex-col gap-6">
    {/* Header Section */}
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 className="font-headline text-2xl md:text-4xl font-bold tracking-tight text-gradient">
          Analytics Dashboard
        </h2>
        <p className="font-body text-on-surface-variant mt-2 text-sm md:text-base">
          Real-time performance metrics for deployed intelligence.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <GlassPanel className="px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-label text-on-surface border border-electric-cobalt/30">
          <span className="w-2 h-2 rounded-full bg-electric-cobalt animate-pulse shadow-glow-blue-xs" />
          <span>System Nominal</span>
        </GlassPanel>
        <button className="p-2 rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface transition-colors">
          <MsIcon name="calendar_today" size={16} />
        </button>
      </div>
    </div>

    {/* Bento Grid Layout */}
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
      {/* KPI Card 1: Compute Efficiency */}
      <BentoCard className="rounded-xl p-6 flex flex-col justify-between h-40">
        <div className="flex justify-between items-start">
          <span className="font-body text-sm text-on-surface-variant font-medium">Compute Efficiency</span>
          <div className="p-1.5 rounded-md bg-surface-container-low border border-outline-variant/40">
            <MsIcon name="speed" className="text-on-surface-variant" size={16} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-4xl font-bold tracking-tighter text-on-surface">94.2%</span>
            <span className="font-label text-xs text-electric-cobalt font-medium flex items-center">
              <MsIcon name="trending_up" size={10} />
              +1.2%
            </span>
          </div>
          <ProgressBar
            value={94.2}
            className="mt-4 border border-dark-text-bright/60"
            fillClassName="bg-gradient-to-r from-electric-cobalt to-cyber-purple"
          />
        </div>
      </BentoCard>

      {/* KPI Card 2: Agent Success Rate */}
      <BentoCard className="rounded-xl p-6 flex flex-col justify-between h-40 relative overflow-hidden">
        <div className="flex justify-between items-start">
          <span className="font-body text-sm text-on-surface-variant font-medium">Agent Success Rate</span>
          <div className="p-1.5 rounded-md bg-surface-container-low border border-outline-variant/40">
            <MsIcon name="check_circle" className="text-on-surface-variant" size={16} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-4xl font-bold tracking-tighter text-on-surface">99.98%</span>
            <span className="font-label text-xs text-on-surface-variant font-medium px-1.5 py-0.5 rounded bg-surface-container-low border border-outline-variant/40">
              Stable
            </span>
          </div>
          <p className="font-label text-xs text-on-surface-variant mt-2">Over last 10M operations</p>
        </div>
      </BentoCard>

      {/* KPI Card 3: Decision Velocity */}
      <BentoCard className="rounded-xl p-6 flex flex-col justify-between h-40">
        <div className="flex justify-between items-start">
          <span className="font-body text-sm text-on-surface-variant font-medium">Decision Velocity</span>
          <div className="p-1.5 rounded-md bg-surface-container-low border border-outline-variant/40">
            <MsIcon name="bolt" className="text-on-surface-variant" size={16} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="font-headline text-4xl font-bold tracking-tighter text-on-surface">142</span>
            <span className="font-label text-sm text-on-surface-variant">ms</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <svg width="60" height="16" viewBox="0 0 60 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 8C5 8 10 12 15 12C20 12 25 4 30 4C35 4 40 14 45 14C50 14 55 6 60 6"
                stroke="#9333EA"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">
              Latency Trend
            </span>
          </div>
        </div>
      </BentoCard>

      {/* Chart Section: Intelligence Usage */}
      <BentoCard className="rounded-xl p-6 md:col-span-8 min-h-[380px] flex flex-col relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyber-purple/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-electric-cobalt/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex justify-between items-center mb-8 gap-4">
          <h3 className="font-headline text-lg font-semibold tracking-tight text-on-surface">
            Intelligence Usage
          </h3>
          <div className="flex gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/40">
            <button className="px-3 py-1 bg-surface-container-lowest rounded-md text-xs font-label text-on-surface shadow-sm border border-outline-variant/40">
              Compute Cycles
            </button>
            <button className="px-3 py-1 text-on-surface-variant rounded-md text-xs font-label hover:text-on-surface transition-colors">
              Token Output
            </button>
          </div>
        </div>
        {/* Chart Area */}
        <div className="flex-1 w-full relative flex items-end pt-4 pb-6 z-10">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pt-4 pb-10">
            <div className="border-b border-outline-variant/30 w-full border-dashed" />
            <div className="border-b border-outline-variant/30 w-full border-dashed" />
            <div className="border-b border-outline-variant/30 w-full border-dashed" />
            <div className="border-b border-outline-variant/30 w-full border-dashed" />
          </div>
          {/* SVG Chart */}
          <svg
            className="w-full h-full relative z-10 overflow-visible"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="chartGradientLight" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Area Fill */}
            <path
              d="M0 100 L0 60 Q 15 70 30 40 T 60 50 T 85 20 L 100 30 L 100 100 Z"
              fill="url(#chartGradientLight)"
            />
            {/* Line */}
            <path
              d="M0 60 Q 15 70 30 40 T 60 50 T 85 20 L 100 30"
              fill="none"
              stroke="#2563EB"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
            {/* Data Points */}
            <circle className="animate-pulse" cx="30" cy="40" fill="#ffffff" r="3" stroke="#2563EB" strokeWidth="2" />
            <circle cx="60" cy="50" fill="#ffffff" r="3" stroke="#2563EB" strokeWidth="2" />
            <circle className="animate-pulse" cx="85" cy="20" fill="#ffffff" r="3" stroke="#2563EB" strokeWidth="2" />
          </svg>
          {/* X-Axis Labels */}
          <div className="absolute bottom-0 left-0 w-full flex justify-between px-2 font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span className="text-electric-cobalt font-semibold">Now</span>
          </div>
        </div>
      </BentoCard>

      {/* ROI Summary Card */}
      <BentoCard className="rounded-xl p-6 flex flex-col justify-between relative overflow-hidden md:col-span-4">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <MsIcon name="account_balance" className="text-on-surface" size={88} />
        </div>
        <div className="relative z-10">
          <h3 className="font-headline text-lg font-semibold tracking-tight mb-3 text-on-surface flex items-center">
            <MsIcon name="diamond" className="text-cyber-purple mr-2 text-xl" size={20} />
            Enterprise ROI
          </h3>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">
            Cumulative value generated through autonomous workflows and optimized compute routing.
          </p>
          <div className="space-y-5">
            <div className="flex justify-between items-end border-b border-outline-variant/30 pb-3">
              <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Hours Saved</span>
              <span className="font-headline font-bold text-xl text-on-surface">
                1,240 <span className="text-sm text-on-surface-variant font-normal">h</span>
              </span>
            </div>
            <div className="flex justify-between items-end border-b border-outline-variant/30 pb-3">
              <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Resource Offset</span>
              <span className="font-headline font-bold text-xl text-emerald-signal">$84.2K</span>
            </div>
          </div>
        </div>
        <button className="mt-8 w-full py-3 glass-panel rounded-xl font-body font-medium text-sm flex items-center justify-center gap-2 text-on-surface bg-cyber-purple/5 hover:bg-cyber-purple/10 border-cyber-purple/20 transition-all relative z-10">
          <MsIcon name="download" size={16} />
          Download Full Audit
        </button>
      </BentoCard>

      {/* Table Section: Autonomous Decisions Log */}
      <BentoCard className="rounded-xl md:col-span-12 overflow-hidden flex flex-col p-0">
        <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
          <h3 className="font-headline text-lg font-semibold tracking-tight text-on-surface flex items-center">
            <MsIcon name="list_alt" className="text-electric-cobalt mr-2" size={20} />
            Autonomous Decisions Log
          </h3>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface transition-colors">
              <MsIcon name="search" size={16} />
            </button>
            <button className="p-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface transition-colors">
              <MsIcon name="filter_list" size={16} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/60 font-label text-[10px] text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/30">
                <th className="px-6 py-4 font-semibold">Action Event</th>
                <th className="px-6 py-4 font-semibold">Agent Module</th>
                <th className="px-6 py-4 font-semibold text-center">Confidence</th>
                <th className="px-6 py-4 font-semibold">Business Impact</th>
                <th className="px-6 py-4 font-semibold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="font-body text-sm divide-y divide-outline-variant/30">
              {/* Row 1 */}
              <tr className="hover:bg-surface-container-low transition-colors cursor-default">
                <td className="px-6 py-4 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-electric-cobalt shadow-glow-blue-xs" />
                  <span className="font-medium text-on-surface">Routing Optimization Auth</span>
                </td>
                <td className="px-6 py-4 text-on-surface-variant font-label text-xs">Network_Node_Alpha</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-electric-cobalt/10 font-label text-xs text-electric-cobalt border border-electric-cobalt/20 font-medium">
                    0.99
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-signal/10 text-xs font-medium border border-emerald-signal/20 text-emerald-signal">
                    High
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-on-surface-variant font-label text-xs">12s ago</td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-surface-container-low transition-colors cursor-default">
                <td className="px-6 py-4 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-surface-container-highest" />
                  <span className="font-medium text-on-surface">Data Normalization Sync</span>
                </td>
                <td className="px-6 py-4 text-on-surface-variant font-label text-xs">ETL_Stream_Processor</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-surface-container-low font-label text-xs text-on-surface-variant border border-outline-variant/40 font-medium">
                    0.95
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container-low text-xs font-medium border border-outline-variant/40 text-on-surface-variant">
                    Low
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-on-surface-variant font-label text-xs">4m ago</td>
              </tr>
              {/* Row 3 */}
              <tr className="hover:bg-surface-container-low transition-colors cursor-default">
                <td className="px-6 py-4 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-rose-signal shadow-glow-rose-hot-xs" />
                  <span className="font-medium text-on-surface">Security Policy Enforcement</span>
                </td>
                <td className="px-6 py-4 text-on-surface-variant font-label text-xs">Guardrail_Sentinel</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-cyber-purple/10 font-label text-xs text-cyber-purple border border-cyber-purple/20 font-medium">
                    1.00
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-signal/10 text-xs font-medium border border-rose-signal/20 text-rose-signal">
                    Critical
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-on-surface-variant font-label text-xs">18m ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BentoCard>
    </div>
  </div>
);