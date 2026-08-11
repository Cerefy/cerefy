import React from 'react';
import { GlassPanel, BentoCard, StatusPill } from './primitives';

const logItems = [
  {
    icon: 'inventory_2',
    title: 'Inventory Rebalance',
    time: '2m ago',
    desc: 'Shifted 400 units to East Coast DC based on predictive weather modeling.',
    impact: { text: 'Impact: High', tone: 'success' as const },
    mode: 'Auto',
  },
  {
    icon: 'campaign',
    title: 'Ad Spend Optimization',
    time: '14m ago',
    desc: "Reduced bid on keyword group 'B' by 12% due to dropping conversion rate.",
    impact: { text: 'Impact: Med', tone: 'neutral' as const },
    mode: 'Auto',
  },
  {
    icon: 'security',
    title: 'Security Protocol',
    time: '42m ago',
    desc: 'Flagged unusual login pattern from Node 4; required 2FA step-up.',
    impact: { text: 'Impact: Med', tone: 'neutral' as const },
    mode: 'Supervised',
  },
];

export const ExecutiveMissionControl: React.FC = () => {
  return (
    <>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-4 flex-wrap gap-4">
        <div>
          <h2 className="font-headline text-[28px] md:text-[32px] font-semibold tracking-tight text-on-surface leading-[1.3] mb-1">
            Executive Mission Control
          </h2>
          <p className="text-on-surface-variant text-[16px] font-body">
            Strategic overview for active AI operations.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-outline-variant/50 rounded-lg text-on-surface text-[14px] font-medium hover:bg-surface-container-low transition-colors">
            Export Report
          </button>
          <button className="px-4 py-2 bg-on-surface text-surface rounded-lg text-[14px] font-medium hover:bg-on-surface-variant transition-colors">
            Manage Core
          </button>
        </div>
      </div>

      {/* Main Metrics Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {logMetrics.map((m, i) => (
            <BentoCard
              key={m.label}
              className="rounded-xl p-6 flex flex-col relative overflow-hidden group"
            >
              <div
                className={`absolute -right-12 -top-12 w-32 h-32 ${
                  i === 1 ? 'bg-secondary/5' : 'bg-primary/5'
                } rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500`}
              />
              <span className="text-on-surface-variant font-label text-[12px] uppercase tracking-widest mb-4">
                {m.label}
              </span>
              <div className="flex items-baseline gap-2 mt-auto flex-wrap">
                <span className="font-display text-[36px] md:text-[40px] font-bold tracking-tight text-on-surface leading-none">
                  {m.value}
                </span>
                <span
                  className={`text-[14px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    m.chip.tone === 'tertiary'
                      ? 'text-tertiary bg-tertiary-container'
                      : 'text-on-surface-variant bg-surface-container-high'
                  }`}
                >
                  {m.chip.icon && (
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                      {m.chip.icon}
                    </span>
                  )}
                  {m.chip.text}
                </span>
              </div>
            </BentoCard>
          ))}
        </div>
      </div>

      {/* Neural Core Vis & Log */}
      <div className="grid grid-cols-12 gap-6 flex-1">
        <div className="col-span-12 lg:col-span-8 flex flex-col">
          <GlassPanel className="rounded-xl p-8 flex-1 flex flex-col relative overflow-hidden shadow-sm min-h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-container-low opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10 flex justify-between items-center mb-6 flex-wrap gap-3">
              <div>
                <h3 className="font-headline text-[20px] font-semibold text-on-surface">
                  Neural Core Status
                </h3>
                <p className="text-on-surface-variant text-[14px] font-body mt-1">
                  Live visualization of processing node topology.
                </p>
              </div>
              <span className="bg-dark-text-bright/60 border border-outline-variant/30 text-on-surface px-3 py-1 rounded-full font-label text-[12px] flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" /> Active
              </span>
            </div>

            {/* Core Visualization Area */}
            <div className="flex-1 w-full relative bg-dark-text-bright/40 rounded-lg border border-outline-variant/20 overflow-hidden flex items-center justify-center min-h-[340px]">
              <div className="relative w-full h-full flex items-center justify-center p-8">
                <div className="w-48 h-48 rounded-full border border-primary/20 flex items-center justify-center relative">
                  <div className="w-32 h-32 rounded-full border border-primary/30 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                    <div className="w-2 h-2 bg-primary rounded-full absolute -top-1" />
                    <div className="w-2 h-2 bg-primary rounded-full absolute -bottom-1" />
                  </div>
                  <div className="w-16 h-16 rounded-full bg-primary/10 backdrop-blur flex items-center justify-center z-10 animate-pulse">
                    <span className="material-symbols-outlined text-primary text-[24px]" aria-hidden="true">
                      network_node
                    </span>
                  </div>
                  <div className="absolute w-full h-px bg-primary/20 top-1/2 -left-full" />
                  <div className="absolute w-full h-px bg-primary/20 top-1/2 -right-full" />
                  <div className="absolute w-px h-full bg-primary/20 left-1/2 -top-full" />
                </div>
              </div>
              <div className="absolute bottom-4 right-4 bg-dark-text-bright/70 backdrop-blur border border-outline-variant/20 rounded p-2 text-right">
                <div className="font-label text-[10px] text-on-surface-variant mb-1 uppercase">
                  Load Distribution
                </div>
                <div className="font-headline text-[14px] font-medium text-on-surface">Balanced</div>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Decision Log */}
        <div className="col-span-12 lg:col-span-4 flex flex-col">
          <BentoCard className="rounded-xl p-6 flex-1 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-[18px] font-semibold text-on-surface">
                Autonomous Log
              </h3>
              <button className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  filter_list
                </span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {logItems.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 items-start p-3 rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant/10"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px] text-on-surface" aria-hidden="true">
                      {item.icon}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-medium text-[14px] text-on-surface">{item.title}</span>
                      <span className="font-label text-[10px] text-on-surface-variant">{item.time}</span>
                    </div>
                    <p className="text-[13px] text-on-surface-variant leading-snug mb-2">{item.desc}</p>
                    <div className="flex items-center gap-2">
                      <StatusPill label={item.impact.text} variant={item.impact.tone} />
                      <span className="text-[10px] font-label uppercase tracking-wider text-on-surface-variant border border-outline-variant/30 px-2 py-0.5 rounded">
                        {item.mode}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
};

// Kept separate to avoid TS narrowing issues in the map above
const logMetrics = [
  {
    label: 'ROI Impact',
    value: '$2.4M',
    chip: { text: '+12.4%', icon: 'trending_up', tone: 'tertiary' as const },
  },
  {
    label: 'Decision Velocity',
    value: '1.2s',
    chip: { text: 'Optimal', icon: 'speed', tone: 'tertiary' as const },
  },
  {
    label: 'Autonomous Load',
    value: '88%',
    chip: { text: 'Target: 90%', icon: '', tone: 'neutral' as const },
  },
];