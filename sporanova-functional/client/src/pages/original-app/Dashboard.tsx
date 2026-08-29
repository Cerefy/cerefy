import { useEffect, useState } from "react";

function StatCard({ label, value, change, delay = 0 }: { label: string; value: string; change: string; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const positive = change.startsWith("+");
  return (
    <div
      className="p-5 rounded-2xl transition-all duration-300"
      style={{
        background: "#FAFAF8",
        border: "1px solid #E8E6E2",
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(12px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms, box-shadow 0.2s`,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(26,31,60,0.06)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = ""; (e.currentTarget as HTMLDivElement).style.transform = visible ? "none" : "translateY(12px)"; }}
    >
      <div className="sn-label mb-3">{label}</div>
      <div className="text-2xl font-medium mb-1" style={{ color: "#1A1F3C", fontFamily: "Inter, sans-serif" }}>{value}</div>
      <div className="text-xs font-medium" style={{ color: positive ? "#4A8B8C" : "#B8675A" }}>{change} vs last period</div>
    </div>
  );
}

function MiniChart({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const normalize = (v: number) => ((v - min) / (max - min || 1)) * 100;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${100 - normalize(v)}`).join(" ");
  return (
    <svg viewBox="0 0 100 50" className="w-full" style={{ height: 48 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,50 ${pts} 100,50`} fill={color} fillOpacity="0.08" stroke="none" />
    </svg>
  );
}

const agentsList = [
  { name: "DataSync Agent", status: "active", task: "Syncing Salesforce CRM data", progress: 78 },
  { name: "Report Analyst", status: "active", task: "Generating Q3 executive summary", progress: 45 },
  { name: "Anomaly Detector", status: "idle", task: "Waiting for next scan cycle", progress: 0 },
  { name: "Forecast Engine", status: "active", task: "Processing 18-month projections", progress: 62 },
];

const signals = [
  { type: "opportunity", title: "Revenue concentration risk", desc: "3 clients represent 68% of ARR. Consider diversification.", severity: "medium" },
  { type: "insight", title: "Churn signal detected", desc: "Segment B engagement dropped 22% over 30 days.", severity: "high" },
  { type: "positive", title: "Pipeline velocity +18%", desc: "Average deal cycle shortened from 38 to 31 days.", severity: "low" },
];

export default function Dashboard() {
  const chartData = [42, 58, 51, 67, 73, 69, 82, 78, 91, 88, 94, 97];
  const [activeSignal, setActiveSignal] = useState(0);

  return (
    <div className="sn-page-enter max-w-6xl">
      <div className="mb-8">
        <div className="sn-label mb-2">Overview</div>
        <h1 className="text-2xl font-medium" style={{ color: "#1A1F3C" }}>Good morning, Jane</h1>
        <p className="text-sm mt-1" style={{ color: "#8C887F" }}>Your enterprise intelligence is updated as of 2 minutes ago.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Revenue (YTD)" value="$24.8M" change="+12.4%" delay={0} />
        <StatCard label="Active Agents" value="7 / 12" change="+2" delay={60} />
        <StatCard label="Data Sources" value="34" change="+3" delay={120} />
        <StatCard label="Insights Today" value="18" change="+6" delay={180} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Main chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="sn-label mb-1">Revenue Trend</div>
              <div className="text-xl font-medium" style={{ color: "#1A1F3C" }}>$24.8M YTD</div>
            </div>
            <div className="flex gap-2">
              {["7D", "30D", "90D", "1Y"].map((p, i) => (
                <button key={p} className="px-2.5 py-1 text-xs rounded-lg transition-all duration-150"
                  style={{ background: i === 3 ? "#1A1F3C" : "transparent", color: i === 3 ? "#F8F6F2" : "#8C887F" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <MiniChart values={chartData} color="#5B6FA8" />
          <div className="flex justify-between mt-2">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
              <span key={m} style={{ fontSize: "0.6rem", color: "#B8B4AC" }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Intelligence signals */}
        <div className="p-6 rounded-2xl" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
          <div className="sn-label mb-4">Intelligence Signals</div>
          <div className="flex flex-col gap-2">
            {signals.map((s, i) => (
              <button
                key={i}
                className="text-left p-3 rounded-xl transition-all duration-200"
                style={{
                  background: activeSignal === i ? "#F0EFF8" : "#F4F3F0",
                  borderLeft: `3px solid ${s.severity === "high" ? "#B8675A" : s.severity === "medium" ? "#C5974A" : "#4A8B8C"}`,
                }}
                onClick={() => setActiveSignal(i)}
              >
                <div className="text-xs font-medium mb-0.5" style={{ color: "#1A1F3C" }}>{s.title}</div>
                <div style={{ fontSize: "0.7rem", color: "#8C887F", lineHeight: 1.4 }}>{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Agents */}
      <div className="p-6 rounded-2xl mb-6" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="sn-label">Active Agents</div>
          <a href="/app/agents" className="text-xs font-medium transition-colors" style={{ color: "#6B7FBF" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1F3C")} onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7FBF")}>
            View all →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agentsList.map((agent) => (
            <div key={agent.name} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "#F4F3F0" }}>
              <div className="relative">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold"
                  style={{ background: "#1A1F3C", color: "#F8F6F2" }}>
                  {agent.name[0]}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sn-50"
                  style={{ background: agent.status === "active" ? "#4A8B8C" : "#D4D1CB" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate mb-0.5" style={{ color: "#1A1F3C" }}>{agent.name}</div>
                <div className="text-xs truncate mb-1.5" style={{ color: "#8C887F" }}>{agent.task}</div>
                {agent.progress > 0 && (
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "#E8E6E2" }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${agent.progress}%`, background: "#5B6FA8" }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="p-6 rounded-2xl" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
        <div className="sn-label mb-4">Recent Activity</div>
        <div className="flex flex-col">
          {[
            { time: "2m ago", event: "DataSync Agent completed Salesforce sync — 3,421 records updated" },
            { time: "14m ago", event: "Intelligence detected revenue concentration anomaly in Segment A" },
            { time: "1h ago", event: "Report Analyst generated Q3 Board Summary (47 pages)" },
            { time: "3h ago", event: "New data source connected: Snowflake Production warehouse" },
            { time: "Yesterday", event: "Automation triggered: Churn Risk notification sent to 3 account managers" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex gap-4 py-3 border-b last:border-0 transition-all duration-150"
              style={{ borderColor: "#F4F3F0" }}
            >
              <div className="text-xs pt-0.5 shrink-0" style={{ color: "#B8B4AC", minWidth: 72 }}>{item.time}</div>
              <div className="text-sm" style={{ color: "#6B6660" }}>{item.event}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
