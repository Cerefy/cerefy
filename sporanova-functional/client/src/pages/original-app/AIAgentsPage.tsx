import { useState } from "react";

interface Agent {
  id: number;
  name: string;
  purpose: string;
  status: "active" | "idle" | "paused" | "error";
  task: string;
  lastActivity: string;
  progress?: number;
  runs: number;
}

const agents: Agent[] = [
  { id: 1, name: "DataSync Agent", purpose: "Synchronizes enterprise data sources in real time", status: "active", task: "Syncing Salesforce CRM — 3,421 of 4,412 records", lastActivity: "2m ago", progress: 78, runs: 2847 },
  { id: 2, name: "Report Analyst", purpose: "Generates executive reports from structured intelligence", status: "active", task: "Building Q3 Board Summary — section 4 of 7", lastActivity: "14m ago", progress: 57, runs: 482 },
  { id: 3, name: "Anomaly Detector", purpose: "Monitors data streams for statistical anomalies", status: "idle", task: "Awaiting next scheduled scan at 18:00", lastActivity: "1h ago", runs: 12603 },
  { id: 4, name: "Forecast Engine", purpose: "Produces revenue and demand forecasts using ML models", status: "active", task: "18-month projection — model training iteration 4/6", lastActivity: "38m ago", progress: 62, runs: 731 },
  { id: 5, name: "Churn Sentinel", purpose: "Detects at-risk customer signals before churn occurs", status: "paused", task: "Paused by admin — scheduled restart at 20:00", lastActivity: "4h ago", runs: 5219 },
  { id: 6, name: "Compliance Monitor", purpose: "Audits enterprise activity for regulatory compliance", status: "idle", task: "No violations detected — all clear", lastActivity: "30m ago", runs: 9874 },
];

const statusConfig = {
  active:  { color: "#4A8B8C", bg: "#EEF6F6", label: "Active" },
  idle:    { color: "#8C887F", bg: "#F4F3F0", label: "Idle" },
  paused:  { color: "#C5974A", bg: "#FDF4EE", label: "Paused" },
  error:   { color: "#B8675A", bg: "#FDF0EE", label: "Error" },
};

export default function AIAgentsPage() {
  const [selected, setSelected] = useState<Agent | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "idle" | "paused">("all");

  const filtered = agents.filter((a) => filter === "all" || a.status === filter);

  return (
    <div className="sn-page-enter flex gap-4 h-[calc(100vh-112px)]">
      {/* Agent list */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="sn-label mb-1">Agent Library</div>
            <h1 className="text-xl font-medium" style={{ color: "#1A1F3C" }}>
              {agents.filter((a) => a.status === "active").length} agents running
            </h1>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "#1A1F3C", color: "#F8F6F2" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#252B4A"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; e.currentTarget.style.transform = ""; }}>
            + Deploy Agent
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: "#F4F3F0" }}>
          {(["all", "active", "idle", "paused"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
              style={{ background: filter === f ? "#FAFAF8" : "transparent", color: filter === f ? "#1A1F3C" : "#8C887F",
                boxShadow: filter === f ? "0 1px 3px rgba(26,31,60,0.08)" : "none" }}>
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto">
          {filtered.map((agent, i) => {
            const sc = statusConfig[agent.status];
            const isSelected = selected?.id === agent.id;
            return (
              <div
                key={agent.id}
                className="p-5 rounded-2xl cursor-pointer transition-all duration-200"
                style={{
                  background: isSelected ? "#F0EFF8" : "#FAFAF8",
                  border: `1px solid ${isSelected ? "#D8D6ED" : "#E8E6E2"}`,
                  animation: `sn-slide-up 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms both`,
                }}
                onClick={() => setSelected(isSelected ? null : agent)}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(26,31,60,0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{ background: "#1A1F3C", color: "#F8F6F2" }}>
                      {agent.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm" style={{ color: "#1A1F3C" }}>{agent.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: sc.bg, color: sc.color }}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs mb-2 truncate" style={{ color: "#8C887F" }}>{agent.purpose}</p>
                      <p className="text-xs" style={{ color: "#6B6660" }}>{agent.task}</p>
                      {agent.progress !== undefined && (
                        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "#E8E6E2" }}>
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${agent.progress}%`, background: "#5B6FA8" }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {agent.status === "active" && (
                      <button className="p-2 rounded-lg transition-all" style={{ background: "#F4F3F0", color: "#6B6660" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#E8E6E2"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#F4F3F0"}
                        onClick={(e) => e.stopPropagation()}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <rect x="3" y="2" width="3" height="10" rx="1" fill="currentColor" />
                          <rect x="8" y="2" width="3" height="10" rx="1" fill="currentColor" />
                        </svg>
                      </button>
                    )}
                    {agent.status === "paused" && (
                      <button className="p-2 rounded-lg transition-all" style={{ background: "#F4F3F0", color: "#6B6660" }}
                        onClick={(e) => e.stopPropagation()}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 2l9 5-9 5V2z" fill="currentColor" />
                        </svg>
                      </button>
                    )}
                    <button className="p-2 rounded-lg transition-all" style={{ background: "#F4F3F0", color: "#6B6660" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#E8E6E2"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#F4F3F0"}
                      onClick={(e) => e.stopPropagation()}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="4" r="1" fill="currentColor" />
                        <circle cx="7" cy="7" r="1" fill="currentColor" />
                        <circle cx="7" cy="10" r="1" fill="currentColor" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-sn-100">
                  <span className="sn-label">{agent.runs.toLocaleString()} total runs</span>
                  <span className="sn-label">Last active {agent.lastActivity}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div
          className="hidden lg:flex flex-col w-72 rounded-2xl overflow-hidden shrink-0"
          style={{ background: "#FAFAF8", border: "1px solid #E8E6E2", animation: "sn-slide-up 0.3s cubic-bezier(0.16,1,0.3,1)" }}
        >
          <div className="p-6 border-b border-sn-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold"
                style={{ background: "#1A1F3C", color: "#F8F6F2" }}>{selected.name[0]}</div>
              <div>
                <div className="font-medium text-sm" style={{ color: "#1A1F3C" }}>{selected.name}</div>
                <div className="sn-label mt-0.5">{statusConfig[selected.status].label}</div>
              </div>
            </div>
            <p className="text-sm" style={{ color: "#6B6660" }}>{selected.purpose}</p>
          </div>

          <div className="p-6 flex flex-col gap-4 flex-1 overflow-y-auto">
            <div>
              <div className="sn-label mb-2">Current Task</div>
              <p className="text-sm" style={{ color: "#1A1F3C" }}>{selected.task}</p>
              {selected.progress !== undefined && (
                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: "0.7rem", color: "#8C887F" }}>Progress</span>
                    <span style={{ fontSize: "0.7rem", color: "#6B6660", fontWeight: 500 }}>{selected.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E8E6E2" }}>
                    <div className="h-full rounded-full" style={{ width: `${selected.progress}%`, background: "#5B6FA8" }} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="sn-label mb-2">Statistics</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Total Runs", value: selected.runs.toLocaleString() },
                  { label: "Success Rate", value: "99.7%" },
                  { label: "Avg Duration", value: "4m 32s" },
                  { label: "Last Active", value: selected.lastActivity },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl" style={{ background: "#F4F3F0" }}>
                    <div className="sn-label mb-1">{stat.label}</div>
                    <div className="text-sm font-medium" style={{ color: "#1A1F3C" }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              <button className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: "#1A1F3C", color: "#F8F6F2" }}>
                View Full Activity
              </button>
              <button className="w-full py-2.5 rounded-xl text-sm font-medium transition-all border"
                style={{ borderColor: "#E8E6E2", color: "#6B6660" }}>
                Configure Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
