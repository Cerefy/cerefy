import { useState } from "react";

interface WorkflowNode {
  id: string;
  type: "trigger" | "intelligence" | "action" | "condition";
  label: string;
  desc: string;
  x: number;
  y: number;
}

const flowNodes: WorkflowNode[] = [
  { id: "t1", type: "trigger",     label: "Trigger",       desc: "Churn risk score > 80",           x: 50,  y: 80  },
  { id: "i1", type: "intelligence",label: "Intelligence",  desc: "Analyze account health signals",  x: 50,  y: 200 },
  { id: "c1", type: "condition",   label: "Condition",     desc: "Is ACV > $50K?",                  x: 50,  y: 320 },
  { id: "a1", type: "action",      label: "Action",        desc: "Alert VP of Customer Success",    x: -90, y: 440 },
  { id: "a2", type: "action",      label: "Action",        desc: "Schedule automated EBR meeting",  x: 190, y: 440 },
];

const typeConfig = {
  trigger:      { bg: "#F0EFF8", border: "#C8C5E8", color: "#5B6FA8", dot: "#5B6FA8" },
  intelligence: { bg: "#FAFAF8", border: "#E8E6E2", color: "#1A1F3C", dot: "#6B7FBF" },
  condition:    { bg: "#FDF4EE", border: "#EDD8B8", color: "#C5974A", dot: "#C5974A" },
  action:       { bg: "#EEF6F6", border: "#C8E0E0", color: "#4A8B8C", dot: "#4A8B8C" },
};

const workflows = [
  { name: "Churn Risk Response", trigger: "Risk score > 80", status: "active", runs: 142, lastRun: "3h ago" },
  { name: "Revenue Forecast Refresh", trigger: "Weekly, Monday 7AM", status: "active", runs: 48, lastRun: "2 days ago" },
  { name: "New Account Onboarding", trigger: "Deal marked Closed Won", status: "active", runs: 89, lastRun: "Yesterday" },
  { name: "Anomaly Alert", trigger: "Data anomaly detected", status: "paused", runs: 312, lastRun: "5 days ago" },
];

export default function AutomationsPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(0);

  return (
    <div className="sn-page-enter max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="sn-label mb-1">Automations</div>
          <h1 className="text-xl font-medium" style={{ color: "#1A1F3C" }}>Intelligent Workflows</h1>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: "#1A1F3C", color: "#F8F6F2" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#252B4A"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; }}>
          + New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Workflow list */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {workflows.map((wf, i) => (
            <button
              key={wf.name}
              onClick={() => setSelectedWorkflow(i)}
              className="text-left p-4 rounded-2xl transition-all duration-200"
              style={{
                background: selectedWorkflow === i ? "#F0EFF8" : "#FAFAF8",
                border: `1px solid ${selectedWorkflow === i ? "#D8D6ED" : "#E8E6E2"}`,
                animation: `sn-slide-up 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both`,
              }}
              onMouseEnter={(e) => { if (selectedWorkflow !== i) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-medium text-sm" style={{ color: "#1A1F3C" }}>{wf.name}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                  style={{ background: wf.status === "active" ? "#EEF6F6" : "#F4F3F0", color: wf.status === "active" ? "#4A8B8C" : "#8C887F" }}>
                  {wf.status}
                </span>
              </div>
              <p className="text-xs mb-2" style={{ color: "#8C887F" }}>Trigger: {wf.trigger}</p>
              <div className="flex items-center gap-3">
                <span className="sn-label">{wf.runs} runs</span>
                <span className="sn-label">Last: {wf.lastRun}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Flow visualization */}
        <div className="lg:col-span-3 rounded-2xl p-6 relative overflow-hidden"
          style={{ background: "#FAFAF8", border: "1px solid #E8E6E2", minHeight: 540 }}>
          <div className="sn-label mb-4">Workflow Visualization</div>

          {/* Grid background */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.4 }}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#E8E6E2" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Flow nodes */}
          <div className="relative" style={{ height: 520 }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Connector lines */}
              <line x1="50%" y1="115" x2="50%" y2="185" stroke="#D4D1CB" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="50%" y1="235" x2="50%" y2="305" stroke="#D4D1CB" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="42%" y1="360" x2="34%" y2="420" stroke="#D4D1CB" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="58%" y1="360" x2="66%" y2="420" stroke="#D4D1CB" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>

            {/* Nodes */}
            {flowNodes.map((node, i) => {
              const cfg = typeConfig[node.type];
              return (
                <div
                  key={node.id}
                  className="absolute transition-all duration-300 cursor-pointer"
                  style={{
                    left: `calc(50% + ${node.x}px - 100px)`,
                    top: node.y,
                    width: 200,
                    animation: `sn-node-pop 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms both`,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px) scale(1.02)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; }}
                >
                  <div className="rounded-xl p-3.5" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                      <span className="sn-label" style={{ color: cfg.color }}>{node.label}</span>
                    </div>
                    <p className="text-xs font-medium" style={{ color: "#1A1F3C" }}>{node.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2 pt-4 border-t border-sn-100">
            <div className="flex gap-4">
              {(["trigger", "intelligence", "condition", "action"] as const).map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: typeConfig[t].dot }} />
                  <span style={{ fontSize: "0.6rem", color: "#8C887F", textTransform: "capitalize" }}>{t}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs rounded-lg" style={{ background: "#F4F3F0", color: "#6B6660" }}>Edit</button>
              <button className="px-3 py-1.5 text-xs rounded-lg" style={{ background: "#1A1F3C", color: "#F8F6F2" }}>Run Now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
