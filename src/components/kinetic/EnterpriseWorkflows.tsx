import React from 'react';
import { MsIcon, GlassPanel, BentoCard } from './primitives';

export const EnterpriseWorkflows: React.FC = () => (
  <div className="flex flex-col gap-6">
    {/* Top Toolbar */}
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl flex items-center justify-between px-6 py-3 gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        <h2 className="font-headline font-semibold text-on-surface text-base">Cerefy - New Workflow</h2>
        <div className="flex items-center gap-1 bg-surface-container-low rounded p-1">
          <span className="px-2 py-0.5 text-xs font-label text-on-surface bg-surface-container-lowest shadow-sm rounded-sm">
            Design
          </span>
          <span className="px-2 py-0.5 text-xs font-label text-on-surface-variant hover:text-on-surface cursor-pointer">
            Test
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors text-on-surface-variant">
          <MsIcon name="undo" size={20} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors text-on-surface-variant">
          <MsIcon name="redo" size={20} />
        </button>
        <div className="w-px h-4 bg-outline-variant/50 mx-1" />
        <button className="px-4 py-1.5 bg-surface-container text-on-surface rounded font-medium text-sm hover:bg-surface-container-high transition-colors">
          Save Draft
        </button>
        <button className="px-4 py-1.5 bg-on-surface text-surface-container-lowest rounded font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
          <MsIcon name="play_arrow" size={16} />
          Deploy Agent
        </button>
      </div>
    </div>

    {/* Canvas Area */}
    <div className="flex overflow-hidden rounded-xl border border-outline-variant/30 relative bg-surface min-h-[640px]">
      {/* Elements Sidebar (Left) */}
      <aside className="w-72 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col shrink-0">
        <div className="p-4 border-b border-outline-variant/20">
          <div className="relative">
            <MsIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low border-none rounded text-sm focus:ring-1 focus:ring-outline placeholder:text-on-surface-variant/70"
              placeholder="Search nodes..."
              type="text"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Triggers */}
          <div>
            <h3 className="text-xs font-label uppercase text-on-surface-variant tracking-wider mb-3">Triggers</h3>
            <div className="space-y-2">
              <div className="p-3 bg-surface border border-outline-variant/40 rounded-lg flex items-start gap-3 cursor-grab hover:border-outline hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded bg-secondary-container/50 flex items-center justify-center text-on-secondary-container shrink-0">
                  <MsIcon name="webhook" size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-on-surface">Webhook</div>
                  <div className="text-xs text-on-surface-variant">Trigger on HTTP request</div>
                </div>
              </div>
              <div className="flex p-3 bg-surface border border-outline-variant/40 rounded-lg items-start gap-3 cursor-grab hover:border-outline hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded bg-secondary-container/50 flex items-center justify-center text-on-secondary-container shrink-0">
                  <MsIcon name="schedule" size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-on-surface">Schedule</div>
                  <div className="text-xs text-on-surface-variant">Run at specified intervals</div>
                </div>
              </div>
            </div>
          </div>
          {/* AI Agents */}
          <div>
            <h3 className="text-xs font-label uppercase text-on-surface-variant tracking-wider mb-3">AI Agents</h3>
            <div className="space-y-2">
              <div className="flex p-3 bg-surface border border-outline-variant/40 rounded-lg items-start gap-3 cursor-grab hover:border-outline hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded bg-primary-container border border-outline-variant/50 flex items-center justify-center text-primary shrink-0 shadow-sm">
                  <MsIcon name="analytics" size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-on-surface">Analyst Agent</div>
                  <div className="text-xs text-on-surface-variant">Data extraction &amp; synthesis</div>
                </div>
              </div>
              <div className="flex p-3 bg-surface border border-outline-variant/40 rounded-lg items-start gap-3 cursor-grab hover:border-outline hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded bg-primary-container border border-outline-variant/50 flex items-center justify-center text-primary shrink-0 shadow-sm">
                  <MsIcon name="translate" size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-on-surface">Linguist Agent</div>
                  <div className="text-xs text-on-surface-variant">Translation &amp; tone adjustment</div>
                </div>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div>
            <h3 className="text-xs font-label uppercase text-on-surface-variant tracking-wider mb-3">Actions</h3>
            <div className="space-y-2">
              <div className="flex p-3 bg-surface border border-outline-variant/40 rounded-lg items-start gap-3 cursor-grab hover:border-outline hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-on-surface shrink-0">
                  <MsIcon name="api" size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-on-surface">API Call</div>
                  <div className="text-xs text-on-surface-variant">Send data to external service</div>
                </div>
              </div>
              <div className="flex p-3 bg-surface border border-outline-variant/40 rounded-lg items-start gap-3 cursor-grab hover:border-outline hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-on-surface shrink-0">
                  <MsIcon name="mail" size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-on-surface">Email</div>
                  <div className="text-xs text-on-surface-variant">Send automated email</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Dotted Grid Canvas */}
      <div className="flex-1 dot-grid relative overflow-hidden bg-background min-w-[720px] overflow-x-auto">
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        {/* SVG Lines connecting nodes (simulated) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <path
            className="text-outline-variant/70"
            d="M 280 200 C 350 200, 350 200, 420 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className="text-outline-variant/70"
            d="M 680 200 C 750 200, 750 320, 820 320"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        {/* Trigger Node */}
        <GlassPanel className="absolute top-[160px] left-[80px] w-56 rounded-lg shadow-sm z-10">
          <div className="p-3 border-b border-outline-variant/20 flex items-center gap-2 bg-surface-container-lowest/60 rounded-t-lg">
            <div className="w-6 h-6 rounded bg-secondary-container/50 flex items-center justify-center text-on-secondary-container">
              <MsIcon name="webhook" size={14} />
            </div>
            <span className="font-medium text-sm text-on-surface">Incoming Request</span>
            <button className="ml-auto text-on-surface-variant hover:text-on-surface">
              <MsIcon name="more_vert" size={16} />
            </button>
          </div>
          <div className="p-3">
            <div className="text-xs text-on-surface-variant mb-2">Endpoint URL</div>
            <div className="bg-surface-container-low p-2 rounded text-xs font-label text-on-surface truncate border border-outline-variant/40">
              api.cerefy.os/wh/v1/a9x...
            </div>
          </div>
        </GlassPanel>
        {/* Agent Node */}
        <GlassPanel className="absolute top-[160px] left-[420px] w-64 rounded-lg shadow-md border-primary/20 z-10">
          <div className="p-3 border-b border-outline-variant/20 flex items-center gap-2 bg-surface-container-lowest/80 rounded-t-lg">
            <div className="w-6 h-6 rounded bg-primary-container border border-outline-variant/50 flex items-center justify-center text-primary shadow-sm">
              <MsIcon name="analytics" size={14} />
            </div>
            <span className="font-medium text-sm text-on-surface">Financial Analyst</span>
            <div className="ml-auto flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-signal" />
              <span className="text-[10px] text-on-surface-variant font-label">Ready</span>
            </div>
          </div>
          <div className="p-3 space-y-3">
            <div>
              <div className="text-[10px] uppercase font-label text-on-surface-variant mb-1">Model</div>
              <div className="flex items-center gap-2 text-xs border border-outline-variant/30 rounded px-2 py-1 bg-surface-container-lowest">
                <MsIcon name="memory" className="text-primary" size={14} />
                Cerefy-Turbo-128k
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-label text-on-surface-variant mb-1">Prompt Template</div>
              <div className="text-xs text-on-surface bg-surface-container-low p-2 rounded border border-outline-variant/40 italic">
                &quot;Extract Q3 revenue figures...&quot;
              </div>
            </div>
          </div>
        </GlassPanel>
        {/* Action Node */}
        <GlassPanel className="absolute top-[280px] left-[820px] w-56 rounded-lg shadow-sm z-10">
          <div className="p-3 border-b border-outline-variant/20 flex items-center gap-2 bg-surface-container-lowest/60 rounded-t-lg">
            <div className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center text-on-surface">
              <MsIcon name="api" size={14} />
            </div>
            <span className="font-medium text-sm text-on-surface">Update CRM</span>
            <button className="ml-auto text-on-surface-variant hover:text-on-surface">
              <MsIcon name="more_vert" size={16} />
            </button>
          </div>
          <div className="p-3">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-on-surface-variant">Method</span>
              <span className="font-label text-on-surface">POST</span>
            </div>
            <div className="bg-surface-container-low p-2 rounded text-xs font-label text-on-surface truncate border border-outline-variant/40">
              /api/salesforce/update
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Contextual Properties Panel (Right - Collapsed state hint) */}
      <div className="w-12 bg-surface-container-lowest border-l border-outline-variant/30 flex flex-col items-center py-4 shrink z-10">
        <button className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant mb-4">
          <MsIcon name="tune" size={20} />
        </button>
        <button className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant">
          <MsIcon name="info" size={20} />
        </button>
      </div>
    </div>
  </div>
);