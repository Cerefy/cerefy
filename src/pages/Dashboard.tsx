import { useQuery } from "@tanstack/react-query";
import { BackendApi } from "@/services/backend-api.service";
import { AppShell } from "@/components/layout/AppShell";
import { Card, Badge, Sparkline } from "@/components/common/primitives";
import { useAuth } from "@/components/providers/auth-provider";
import { Activity, Cpu, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

function SkeletonLine() {
  return <div className="h-3 w-full bg-white/5 rounded animate-pulse" />;
}

function EmptyBlock({ label }: { label: string }) {
  return <div className="text-center py-8 text-muted-foreground text-xs">{label}</div>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name ?? user?.email ?? "User";

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => BackendApi.getDashboardStats(),
    refetchInterval: 15000,
  });

  const { data: workspaces, isLoading: workspacesLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => BackendApi.listWorkspaces(),
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["usage-summary"],
    queryFn: () => BackendApi.getUsageSummary(),
    refetchInterval: 30000,
  });

  const { data: systemStatus } = useQuery({
    queryKey: ["system-status"],
    queryFn: () => BackendApi.getSystemStatus(),
    refetchInterval: 10000,
  });

  const workspaceCount = workspaces?.total ?? 0;
  const agentCount = stats?.active_agents_count ?? 0;
  const taskTotal = stats?.total_tasks ?? 0;
  const taskToday = stats?.tasks_today ?? 0;
  const successRate = stats?.success_rate ?? 0;
  const tokensUsed = stats?.total_tokens_used ?? 0;
  const membersCount = stats?.members_count ?? 0;
  const recentTasks = stats?.recent_tasks ?? [];

  return (
    <AppShell title={`Welcome, ${name}`} subtitle="Agent platform overview">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Agent Tasks</p>
            <span className="text-primary text-[14px] font-mono font-bold">+{taskToday} today</span>
          </div>
          <h3 className="text-3xl font-bold text-white">{statsLoading ? "—" : taskTotal.toLocaleString()}</h3>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/20">
            <div className="h-full bg-primary shadow-[0_0_10px_#38BDF8]" style={{ width: '70%' }}></div>
          </div>
        </div>
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Success Rate</p>
            {statsLoading ? null : successRate >= 80 ? (
              <span className="text-emerald-400 text-[14px] font-mono font-bold">STABLE</span>
            ) : (
              <span className="text-amber-400 text-[14px] font-mono font-bold">ATTENTION</span>
            )}
          </div>
          <h3 className="text-3xl font-bold text-white">{statsLoading ? "—" : `${successRate}%`}</h3>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/20">
            <div className="h-full bg-emerald-400 shadow-[0_0_10px_#34d399]" style={{ width: `${successRate}%` }}></div>
          </div>
        </div>
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Active Agents</p>
            <span className="text-sky-400 text-[14px] font-mono font-bold">ONLINE</span>
          </div>
          <h3 className="text-3xl font-bold text-white">{statsLoading ? "—" : agentCount}</h3>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-sky-400/20">
            <div className="h-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" style={{ width: '100%' }}></div>
          </div>
        </div>
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Tokens Used</p>
            <span className="text-primary text-[14px] font-mono font-bold">TOTAL</span>
          </div>
          <h3 className="text-3xl font-bold text-white">{statsLoading ? "—" : tokensUsed.toLocaleString()}</h3>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/20">
            <div className="h-full bg-primary shadow-[0_0_10px_#38BDF8]" style={{ width: '45%' }}></div>
          </div>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Agent Activity */}
        <div className="lg:col-span-2 bento-card rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-secondary/40">
            <h2 className="font-medium text-sm text-white flex items-center gap-2">
              <Activity size={16} className="text-muted-foreground" />
              Recent Agent Activity
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground">
              {recentTasks.length} events
            </span>
          </div>
          <div className="bg-background">
            {statsLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <SkeletonLine key={i} />
                ))}
              </div>
            ) : recentTasks.length > 0 ? (
              <div className="divide-y divide-border">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-sm ${
                          task.status === "completed"
                            ? "bg-emerald-400"
                            : task.status === "failed"
                              ? "bg-rose-400"
                              : task.status === "running"
                                ? "bg-sky-400"
                                : "bg-amber-400"
                        }`}
                      />
                      <div>
                        <span className="text-xs text-white font-medium">
                          {task.agent_role ?? "Agent"}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-2 font-mono">
                          {task.created_at ? new Date(task.created_at).toLocaleTimeString() : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={
                          task.status === "completed"
                            ? "success"
                            : task.status === "failed"
                              ? "danger"
                              : task.status === "running"
                                ? "info"
                                : "warn"
                        }
                      >
                        {task.status}
                      </Badge>
                      {task.duration_ms != null && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {task.duration_ms}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBlock label="No agent activity yet. Start a conversation in AI Copilot." />
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bento-card rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-secondary/40">
            <h2 className="font-medium text-sm text-white flex items-center gap-2">
              <Cpu size={16} className="text-muted-foreground" />
              System Status
            </h2>
          </div>
          <div className="bg-background p-5 space-y-4">
            {systemStatus ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge tone="success">{systemStatus.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Uptime</span>
                  <span className="text-xs font-mono text-white">
                    {Math.floor(systemStatus.uptime_seconds / 3600)}h{" "}
                    {Math.floor((systemStatus.uptime_seconds % 3600) / 60)}m
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Active Sessions</span>
                  <span className="text-xs font-mono text-white">
                    {systemStatus.sessions_active}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Workflows Completed</span>
                  <span className="text-xs font-mono text-white">
                    {systemStatus.workflows_completed}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Workflows Failed</span>
                  <span className="text-xs font-mono text-rose-400">
                    {systemStatus.workflows_failed}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Tools Available</span>
                  <span className="text-xs font-mono text-white">{systemStatus.tools_count}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-muted-foreground" size={16} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspaces Summary */}
        <Card title="Workspaces" icon="folder">
          <div className="p-5 space-y-3">
            {workspacesLoading || usageLoading || statsLoading ? (
              <div className="space-y-3">
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-xs text-muted-foreground">Total Workspaces</span>
                  <span className="text-sm font-semibold text-white">{workspaceCount}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-xs text-muted-foreground">Team Members</span>
                  <span className="text-sm font-semibold text-white">{membersCount}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-xs text-muted-foreground">Active Agents</span>
                  <span className="text-sm font-semibold text-white">{agentCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Monthly Tasks</span>
                  <span className="text-sm font-semibold text-white">
                    {usage?.tasks_this_month.toLocaleString() ?? "—"}
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Usage Summary */}
        <Card title="Usage Summary" icon="bar_chart">
          <div className="p-5 space-y-3">
            {usageLoading ? (
              <div className="space-y-3">
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-xs text-muted-foreground">Total Tasks</span>
                  <span className="text-sm font-semibold text-white">
                    {usage?.total_tasks.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-xs text-muted-foreground">Total Tokens</span>
                  <span className="text-sm font-semibold text-white">
                    {usage?.total_tokens.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-xs text-muted-foreground">Total Cost</span>
                  <span className="text-sm font-semibold text-white">
                    ${usage?.total_cost.toFixed(2) ?? "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Active Members</span>
                  <span className="text-sm font-semibold text-white">{usage?.active_members ?? 0}</span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card title="Agent Performance">
          <div className="p-5">
            {statsLoading ? (
              <div className="space-y-3">
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Avg Duration</span>
                    <span className="text-white font-mono">
                      {Math.round(stats?.avg_duration_ms ?? 0)}ms
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/60 rounded-full"
                      style={{ width: `${Math.min((stats?.avg_duration_ms ?? 0) / 20, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Tasks This Month</span>
                    <span className="text-white font-mono">
                      {stats?.tasks_this_month.toLocaleString() ?? 0}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400/60 rounded-full"
                      style={{ width: `${Math.min((stats?.tasks_this_month ?? 0) / 5, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="text-white font-mono">{successRate}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${successRate}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
