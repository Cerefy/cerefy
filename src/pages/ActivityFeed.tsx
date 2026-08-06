import { useActivity } from "@/hooks/use-cerefy";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/common/primitives";
import { Bell, CheckCircle2, Loader2, AlertTriangle, Info, Activity } from "lucide-react";
import { useState } from "react";

const TYPE_ICONS = {
  task_complete: CheckCircle2,
  task_start: Loader2,
  milestone: Bell,
  error: AlertTriangle,
  info: Info,
};

type BadgeTone = "neutral" | "success" | "warn" | "danger" | "info";

const TYPE_TONES: Record<string, BadgeTone> = {
  task_complete: "success",
  task_start: "info",
  milestone: "warn",
  error: "danger",
  info: "neutral",
};

function ActivityItem({
  event,
}: {
  event: {
    id: string;
    agentRole: string;
    agentName: string;
    message: string;
    type: string;
    timestamp: string;
  };
}) {
  const Icon = TYPE_ICONS[event.type as keyof typeof TYPE_ICONS] || Info;
  const tone = TYPE_TONES[event.type as keyof typeof TYPE_TONES] || "neutral";
  const timeAgo = getTimeAgo(event.timestamp);

  return (
    <div className="flex items-start gap-3 p-4 border-b border-border/50 hover:bg-white/[0.02] transition-colors fade-up">
      <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-white">{event.agentName}</span>
          <span className="text-[10px] font-mono text-muted-foreground">{event.agentRole}</span>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">{timeAgo}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{event.message}</p>
      </div>
      <Badge tone={tone}>{event.type.replace("_", " ")}</Badge>
    </div>
  );
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ActivityFeedPage() {
  const { data: events, isLoading } = useActivity("ws-1");
  const [filter, setFilter] = useState("all");
  const filtered =
    filter === "all" ? (events ?? []) : (events?.filter((e) => e.type === filter) ?? []);

  return (
    <AppShell title="AI Activity Feed" subtitle="Real-time updates from your founding agents">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {["all", "task_complete", "task_start", "milestone", "error", "info"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === f
                  ? "bg-white text-black"
                  : "text-muted-foreground hover:text-white bg-white/5"
              }`}
            >
              {f === "all" ? "All" : f.replace("_", " ")}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bento-card rounded-lg p-4 animate-pulse">
                <div className="h-3 w-16 bg-white/5 rounded mb-2" />
                <div className="h-3 w-full bg-white/5 rounded mb-1" />
                <div className="h-3 w-3/4 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bento-card rounded-lg overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No activity events
              </div>
            ) : (
              <div>
                <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-secondary/40">
                  <Activity size={14} className="text-primary" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Live
                  </span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                {filtered.map((event) => (
                  <ActivityItem key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ActivityFeedPage;
