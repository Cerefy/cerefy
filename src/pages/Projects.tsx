import { useQuery } from "@tanstack/react-query";
import { ModulePage, KpiRow, TableCard } from "@/components/common/SharedBlocks";
import { Card, Badge, BarChart } from "@/components/common/primitives";
import { ProjectsService } from "@/services/data";

function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-4 w-full animate-pulse rounded bg-[#1A1A1C]" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-[#A1A1AA]">No data available</p>
    </div>
  );
}

export function ProjectsPage() {
  const projectsQuery = useQuery({
    queryKey: ["projects-list"],
    queryFn: () => ProjectsService.getProjects(),
  });

  const tasksQuery = useQuery({
    queryKey: ["projects-tasks"],
    queryFn: () => ProjectsService.getTasks(),
  });

  const projects = projectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const statusTone = (s: string) => {
    if (s === "completed") return "info" as const;
    if (s === "in_progress") return "success" as const;
    if (s === "on_hold") return "warn" as const;
    return "neutral" as const;
  };

  return (
    <ModulePage
      title="Projects"
      subtitle="Tasks · Teams · Timeline"
      tabs={[
        {
          key: "proj",
          label: "Projects",
          render: () => {
            if (projectsQuery.isLoading) return <LoadingSkeleton />;
            if (projects.length === 0) return <EmptyState />;
            return (
              <TableCard
                title="All projects"
                columns={[
                  { key: "name", label: "Project" },
                  { key: "priority", label: "Priority" },
                  {
                    key: "status",
                    label: "Status",
                    render: (r: (typeof projects)[number]) => (
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    ),
                  },
                  { key: "start_date", label: "Start" },
                  { key: "end_date", label: "Due", align: "right" },
                ]}
                rows={projects}
              />
            );
          },
        },
        {
          key: "tasks",
          label: "Tasks",
          render: () => {
            if (tasksQuery.isLoading) return <LoadingSkeleton />;
            if (tasks.length === 0) return <EmptyState />;
            return (
              <TableCard
                title="Tasks"
                columns={[
                  { key: "title", label: "Task" },
                  { key: "assignee_id", label: "Assignee" },
                  {
                    key: "priority",
                    label: "Priority",
                    render: (r: (typeof tasks)[number]) => (
                      <Badge
                        tone={
                          r.priority === "high"
                            ? "warn"
                            : r.priority === "medium"
                              ? "info"
                              : "neutral"
                        }
                      >
                        {r.priority}
                      </Badge>
                    ),
                  },
                  { key: "due_date", label: "Due", align: "right" },
                ]}
                rows={tasks}
              />
            );
          },
        },
        {
          key: "time",
          label: "Timeline",
          render: () => {
            if (projectsQuery.isLoading) return <LoadingSkeleton />;
            if (projects.length === 0) return <EmptyState />;
            return (
              <Card title="Timeline">
                <div className="p-5 space-y-4">
                  {projects.map((p) => (
                    <div key={p.id}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-white">{p.name}</span>
                        <span className="font-mono text-muted-foreground">{p.end_date ?? "—"}</span>
                      </div>
                      <div className="h-1 bg-border rounded">
                        <div
                          className="h-full bg-white"
                          style={{
                            width: `${p.status === "completed" ? 100 : p.status === "in_progress" ? 50 : 20}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          },
        },
        {
          key: "teams",
          label: "Teams",
          render: () => {
            if (projectsQuery.isLoading) return <LoadingSkeleton />;
            const statusCounts = projects.reduce(
              (acc, p) => {
                acc[p.status] = (acc[p.status] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>,
            );
            const statuses = Object.keys(statusCounts);
            if (statuses.length === 0) return <EmptyState />;
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statuses.map((s) => (
                  <div key={s} className="bento-card rounded-lg p-5">
                    <div className="text-white text-sm">{s}</div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
                      {statusCounts[s]} projects
                    </div>
                  </div>
                ))}
              </div>
            );
          },
        },
        {
          key: "kanban",
          label: "Kanban",
          render: () => {
            if (projectsQuery.isLoading) return <LoadingSkeleton />;
            if (projects.length === 0) return <EmptyState />;
            const kanbanCols = ["planning", "in_progress", "review", "completed"];
            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {kanbanCols.map((col) => (
                  <div key={col} className="bento-card rounded-lg p-4">
                    <div className="text-[10px] font-mono uppercase text-muted-foreground mb-3">
                      {col}
                    </div>
                    <div className="space-y-2">
                      {projects
                        .filter((p) => p.status === col)
                        .map((p) => (
                          <div
                            key={p.id}
                            className="border border-border rounded p-3 text-xs text-white hover:bg-secondary/40"
                          >
                            {p.name}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          },
        },
        {
          key: "an",
          label: "Analytics",
          render: () => (
            <Card title="Velocity">
              <EmptyState message="Connect a data source to view project analytics" />
            </Card>
          ),
        },
      ]}
    />
  );
}
