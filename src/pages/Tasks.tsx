import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BackendApi, type TaskExecutionRead } from "@/services/backend-api.service";
import { AppShell } from "@/components/layout/AppShell";
import { Card, DataTable, Badge, Tabs } from "@/components/common/primitives";
import { Loader2 } from "lucide-react";

const STATUS_MAP: Record<
  string,
  { label: string; tone: "neutral" | "success" | "warn" | "danger" | "info" }
> = {
  completed: { label: "Completed", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  running: { label: "Running", tone: "info" },
  pending: { label: "Pending", tone: "warn" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

function TaskDetail({ task }: { task: TaskExecutionRead }) {
  const st = STATUS_MAP[task.status] ?? { label: task.status, tone: "neutral" as const };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Badge tone={st.tone}>{st.label}</Badge>
        <span className="text-xs font-mono text-muted-foreground">
          {task.agent_role ?? "Unknown"}
        </span>
        {task.duration_ms != null && (
          <span className="text-xs font-mono text-muted-foreground">{task.duration_ms}ms</span>
        )}
      </div>
      <div>
        <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1">
          Input
        </div>
        <div className="bg-secondary/40 rounded-md px-4 py-3 text-sm text-white font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
          {task.input_text ?? "No input"}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1">
          Output
        </div>
        <div className="bg-secondary/40 rounded-md px-4 py-3 text-sm text-white font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
          {task.output_text ?? "No output"}
        </div>
      </div>
      {task.error && (
        <div>
          <div className="text-[10px] font-mono uppercase text-rose-400 tracking-wider mb-1">
            Error
          </div>
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-md px-4 py-3 text-sm text-rose-300 font-mono">
            {task.error}
          </div>
        </div>
      )}
    </div>
  );
}

export function TasksPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTask, setSelectedTask] = useState<TaskExecutionRead | null>(null);

  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => BackendApi.listWorkspaces(),
  });
  const workspaceId = workspaces?.workspaces?.[0]?.id ?? "";

  const statusFilter = activeTab === "all" ? undefined : activeTab;

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["tasks", workspaceId, 1, statusFilter],
    queryFn: () => BackendApi.listTasks(workspaceId, 1, 50, statusFilter),
    enabled: !!workspaceId,
  });

  const tasks = tasksData?.tasks ?? [];
  const total = tasksData?.total ?? 0;

  const columns: { key: string; label: string; align?: "left" | "right"; render?: (row: TaskExecutionRead) => React.ReactNode }[] = [
    {
      key: "agent_role",
      label: "Agent",
      render: (row: TaskExecutionRead) => (
        <span className="text-white font-medium">{row.agent_role ?? "—"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: TaskExecutionRead) => {
        const st = STATUS_MAP[row.status] ?? { label: row.status, tone: "neutral" as const };
        return <Badge tone={st.tone}>{st.label}</Badge>;
      },
    },
    {
      key: "duration_ms",
      label: "Duration",
      render: (row: TaskExecutionRead) => (
        <span className="font-mono text-muted-foreground">
          {row.duration_ms != null ? `${row.duration_ms}ms` : "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Date",
      render: (row: TaskExecutionRead) => (
        <span className="font-mono text-muted-foreground text-[10px]">
          {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <AppShell title="Task History" subtitle="Browse past agent executions">
      <div className="mb-4 flex items-center gap-2">
        {["all", "completed", "failed", "running", "pending"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedTask(null);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab
                ? "bg-white text-black"
                : "text-muted-foreground hover:text-white bg-white/5"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">{total} total</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : tasks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="Executions">
              {selectedTask ? (
                <div className="p-5">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-xs text-muted-foreground hover:text-white mb-4 block"
                  >
                    &larr; Back to list
                  </button>
                  <TaskDetail task={selectedTask} />
                </div>
              ) : (
                <DataTable<TaskExecutionRead>
                  columns={columns}
                  rows={tasks}
                  onRowClick={(row) => setSelectedTask(row)}
                />
              )}
            </Card>
          </div>
          <div>
            <Card title="Summary">
              <div className="p-5 space-y-4">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-sm text-white font-semibold">{total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Completed</span>
                  <span className="text-sm text-emerald-400 font-semibold">
                    {tasks.filter((t) => t.status === "completed").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Failed</span>
                  <span className="text-sm text-rose-400 font-semibold">
                    {tasks.filter((t) => t.status === "failed").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Running</span>
                  <span className="text-sm text-sky-400 font-semibold">
                    {tasks.filter((t) => t.status === "running").length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card title="Tasks">
          <div className="p-8 text-center text-muted-foreground text-sm">
            No task executions yet. Start a conversation with an agent to see results here.
          </div>
        </Card>
      )}
    </AppShell>
  );
}
