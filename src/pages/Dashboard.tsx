import { useQuery } from "@tanstack/react-query";
import { BackendApi, type DashboardStats } from "@/services/backend-api.service";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/providers/auth-provider";
import {
  TrendingUp,
  Gauge,
  AlertTriangle,
  Target,
  Gavel,
  Cpu,
  BarChart3,
  MemoryStick,
  Bot,
} from "lucide-react";

/* ── mock data (will wire to real API when endpoints exist) ── */
const SWARM_AGENTS = [
  {
    name: "CEO-Agent Alpha",
    icon: "person_check",
    status: "PROCESSING",
    statusColor: "text-[#00e5ff]",
    barColor: "bg-[#00e5ff]",
    barWidth: "78%",
    desc: "Analyzing Q3 strategic acquisitions in EMEA region. Confidence score high.",
    meta: ["Compute: 78%", "ETA: 2m 14s"],
    glow: true,
    alert: false,
  },
  {
    name: "CFO-Agent Theta",
    icon: "query_stats",
    status: "IDLE",
    statusColor: "text-muted-foreground",
    barColor: "bg-muted-foreground/40",
    barWidth: "100%",
    desc: "Awaiting raw data sync from sub-ledger databases. Ready for deployment.",
    meta: ["Compute: 0%", "Status: Standby"],
    glow: false,
    alert: false,
  },
  {
    name: "CTO-Agent Nexus",
    icon: "memory",
    status: "ALERT",
    statusColor: "text-rose-400",
    barColor: "bg-rose-500",
    barWidth: "45%",
    desc: "Detecting anomaly in load balancer cluster US-EAST. Mitigating...",
    meta: ["Intervention Req: Low", "Action: Auto-scaling"],
    glow: false,
    alert: true,
  },
];

const MISSIONS = [
  {
    title: "Global Market Expansion - APAC",
    pct: 64,
    barColor: "bg-[#00e5ff]",
    agents: 3,
    target: "Q4 Completion",
  },
  {
    title: "Infrastructure Sync Protocol",
    pct: 89,
    barColor: "bg-amber-400",
    agents: 0,
    target: "Imminent",
    label: "Data Center Alignment",
  },
];

const DECISIONS = [
  {
    title: "Reallocate Compute Resources",
    desc: "AI recommends shifting 15% compute from R&D to Logistics forecasting due to emergent supply chain anomaly.",
    confidence: "Confidence: 92.4% | Est. Impact: +$1.2M",
    borderColor: "border-l-[#00e5ff]",
    urgent: false,
  },
  {
    title: "Liquidate Underperforming Asset X",
    desc: "Market trend analysis indicates structural decline. Immediate divestiture minimizes projected loss.",
    confidence: "Time Sensitive | Execute within 12hrs",
    borderColor: "border-l-rose-500",
    urgent: true,
  },
];

/* ── Agent status icon helper ── */
function AgentIcon({ name, alert }: { name: string; alert: boolean }) {
  if (name.includes("CEO")) return <Bot size={18} className="text-white" />;
  if (name.includes("CFO")) return <BarChart3 size={18} className="text-amber-400" />;
  return <MemoryStick size={18} className={alert ? "text-rose-400" : "text-muted-foreground"} />;
}

export function DashboardPage() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name ?? user?.email ?? "User";

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => BackendApi.getDashboardStats(),
    refetchInterval: 15000,
  });

  return (
    <AppShell title={`Welcome, ${name}`} subtitle="EXECUTIVE_COMMAND_CENTER">
      <div className="space-y-6 pb-20">
        {/* ═══ Global Swarm Status ═══ */}
        <section className="glass-panel rounded-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white mb-1 flex items-center gap-2">
                <Cpu size={20} className="text-[#00e5ff]" />
                Global Swarm Status
              </h2>
              <p className="text-xs text-muted-foreground">
                Real-time intelligence feed &amp; agent telemetry.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#00e5ff]/10 text-[#00e5ff] text-[10px] font-mono font-semibold flex items-center gap-1.5 border border-[#00e5ff]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse" />
              SYSTEM NOMINAL
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {SWARM_AGENTS.map((agent) => (
              <div
                key={agent.name}
                className={`bg-secondary/60 border rounded-lg p-4 relative overflow-hidden transition-all hover:border-white/20 ${
                  agent.alert ? "border-rose-500/30" : "border-border"
                } ${agent.glow ? "shadow-[0_0_10px_rgba(0,229,255,0.1)]" : ""}`}
              >
                {/* Top glow bar */}
                {(agent.glow || agent.alert) && (
                  <div
                    className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${
                      agent.alert ? "from-rose-500 to-transparent" : "from-[#00e5ff] to-transparent"
                    } opacity-60`}
                  />
                )}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <AgentIcon name={agent.name} alert={agent.alert} />
                    <span className="text-xs font-mono font-bold text-white">{agent.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono ${agent.statusColor} ${
                      agent.alert ? "animate-pulse" : ""
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{agent.desc}</p>
                <div className="w-full bg-background h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${agent.barColor} h-full transition-all duration-1000`}
                    style={{ width: agent.barWidth }}
                  />
                </div>
                <div
                  className={`mt-2 flex justify-between text-[10px] font-mono ${
                    agent.alert ? "text-rose-400" : "text-muted-foreground"
                  }`}
                >
                  {agent.meta.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ KPI Widgets ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Revenue Velocity */}
          <div className="glass-panel rounded-xl p-5 flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                GROSS REVENUE VELOCITY
              </span>
              <TrendingUp size={16} className="text-[#00e5ff]" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-white">
                $4.2M<span className="text-base text-muted-foreground">/hr</span>
              </div>
              <div className="text-[10px] font-mono text-[#00e5ff] flex items-center gap-1 mt-1">
                <TrendingUp size={12} /> +12.4% vs prev cycle
              </div>
            </div>
          </div>

          {/* System Efficiency */}
          <div className="glass-panel rounded-xl p-5 flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                SYSTEM EFFICIENCY INDEX
              </span>
              <Gauge size={16} className="text-amber-400" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-white">
                94.8<span className="text-base text-muted-foreground">μs</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">
                Optimal execution state
              </div>
            </div>
          </div>

          {/* Risk Exposure */}
          <div className="glass-panel rounded-xl p-5 flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                RISK EXPOSURE VECTOR
              </span>
              <AlertTriangle size={16} className="text-rose-400" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-white">
                0.03<span className="text-base text-muted-foreground">%</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">
                Within acceptable variance
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Missions & Decisions split ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Active Strategic Missions */}
          <section className="glass-panel rounded-xl p-6">
            <h3 className="text-lg font-semibold tracking-tight text-white mb-4 flex items-center gap-2">
              <Target size={18} className="text-white" />
              Active Strategic Missions
            </h3>
            <div className="space-y-4">
              {MISSIONS.map((m) => (
                <div
                  key={m.title}
                  className="p-4 bg-background/60 rounded-lg border border-border hover:border-white/20 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                    <span className="text-xs font-mono text-[#00e5ff]">{m.pct}%</span>
                  </div>
                  <div className="w-full bg-background h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className={`${m.barColor} h-full transition-all duration-1000`}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {m.agents > 0 ? (
                        <>
                          <Bot size={12} /> {m.agents} Agents Deployed
                        </>
                      ) : (
                        <span>{m.label}</span>
                      )}
                    </div>
                    <span>Target: {m.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Council Decisions Required */}
          <section className="glass-panel rounded-xl p-6">
            <h3 className="text-lg font-semibold tracking-tight text-white mb-4 flex items-center gap-2">
              <Gavel size={18} className="text-white" />
              Council Decisions Required
            </h3>
            <div className="space-y-4">
              {DECISIONS.map((d) => (
                <div
                  key={d.title}
                  className={`p-4 bg-secondary/60 border-l-4 ${d.borderColor} rounded-r-lg relative`}
                >
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button
                      className={`px-3 py-1 text-[10px] font-mono font-bold rounded transition-colors ${
                        d.urgent
                          ? "bg-rose-500 text-white hover:bg-rose-600"
                          : "bg-[#00e5ff] text-black hover:bg-[#00e5ff]/80"
                      }`}
                    >
                      Approve
                    </button>
                    <button className="px-3 py-1 border border-border text-white text-[10px] font-mono rounded hover:bg-white/5 transition-colors">
                      Discuss
                    </button>
                  </div>
                  <h4 className="text-sm font-semibold text-white pr-36 mb-1">{d.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2 pr-36 leading-relaxed">
                    {d.desc}
                  </p>
                  <div
                    className={`text-[10px] font-mono flex items-center gap-1 ${
                      d.urgent ? "text-rose-400" : "text-[#00e5ff]"
                    }`}
                  >
                    {d.urgent ? <AlertTriangle size={12} /> : <TrendingUp size={12} />}
                    {d.confidence}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ═══ Live Stats from API (preserving existing data wiring) ═══ */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-5 flex flex-col justify-between h-32">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                TOTAL TASKS
              </span>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold tracking-tight text-white">
                  {stats.total_tasks ?? "—"}
                </span>
                <span className="text-[10px] font-mono text-[#00e5ff]">
                  +{stats.tasks_today ?? 0} today
                </span>
              </div>
            </div>
            <div className="glass-panel rounded-xl p-5 flex flex-col justify-between h-32">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                SUCCESS RATE
              </span>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold tracking-tight text-white">
                  {stats.success_rate ?? "—"}%
                </span>
                <span className="text-[10px] font-mono text-emerald-400">STABLE</span>
              </div>
            </div>
            <div className="glass-panel rounded-xl p-5 flex flex-col justify-between h-32">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                ACTIVE AGENTS
              </span>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold tracking-tight text-white">
                  {stats.active_agents_count ?? "—"}
                </span>
                <span className="text-[10px] font-mono text-[#00e5ff]">ONLINE</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Recent Tasks Feed ═══ */}
        <section className="glass-panel rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/40">
            <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
              RECENT_TASKS
            </h3>
            <span className="px-2 py-0.5 bg-[#00e5ff] text-[10px] font-mono rounded text-black font-bold">
              LOGS
            </span>
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {(stats?.recent_tasks ?? []).slice(0, 8).map((task) => (
              <div
                key={task.id}
                className="p-4 border-b border-border/50 hover:bg-white/[0.02] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#00e5ff]">{task.status}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {task.created_at ? new Date(task.created_at).toLocaleTimeString() : "—"}
                  </span>
                </div>
                <p className="text-sm text-white mb-1 truncate">{task.agent_role ?? "Task"}</p>
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider group-hover:text-[#00e5ff] transition-colors">
                  VIEW_DETAILS →
                </span>
              </div>
            ))}
            {(!stats?.recent_tasks || stats.recent_tasks.length === 0) && (
              <div className="p-8 text-center text-xs font-mono text-muted-foreground">
                NO_TASKS_DETECTED
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
