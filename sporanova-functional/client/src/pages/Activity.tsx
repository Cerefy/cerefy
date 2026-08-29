import { useWorkspace } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

const typeColor: Record<string, { bg: string; color: string; dot: string }> = {
  agent: { bg: "#EEF6F6", color: "#4A8B8C", dot: "#4A8B8C" },
  ai: { bg: "#F0EFF8", color: "#5B6FA8", dot: "#6B7FBF" },
  data: { bg: "#F4F3F0", color: "#6B6660", dot: "#B8B4AC" },
  decision: { bg: "#FDF4EE", color: "#C5974A", dot: "#C5974A" },
  automation: { bg: "#F4F3F0", color: "#8C887F", dot: "#8C887F" },
};

export default function Activity() {
  const { workspaceId } = useWorkspace();
  const [filter, setFilter] = useState("All");
  const tabs = ["All", "AI", "Agents", "Data", "Decisions", "Automations"];

  const { data, isLoading } = trpc.audit.list.useQuery(
    { workspaceId: workspaceId ?? 0, page: 1, pageSize: 50 },
    { enabled: Boolean(workspaceId) }
  );

  const items = data?.items ?? [];
  const filtered = filter === "All" ? items : items.filter((a: any) => a.tag === filter);
  const grouped = filtered.reduce((acc: Record<string, any[]>, item: any) => {
    const date = new Date(item.createdAt).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div>
        <div className="sn-label mb-1">Activity</div>
        <h1 className="text-xl font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>Activity Center</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{ background: filter === t ? "#1A1F3C" : "#F4F3F0", color: filter === t ? "#F8F6F2" : "#6B6660" }}>
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: "#FAFAF8", borderColor: "#E8E6E2" }}>
        {isLoading && (
          <div className="py-16 text-center" style={{ color: "#8C887F" }}>
            <p className="text-sm">Loading activity...</p>
          </div>
        )}
        {!isLoading && Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="px-5 py-2.5 border-b" style={{ background: "#F4F3F0", borderColor: "#E8E6E2" }}>
              <span className="sn-label">{date}</span>
            </div>
            {(items as any[]).map((item: any, i: number) => {
              const type = item.type || "data";
              const tc = typeColor[type] ?? typeColor.data;
              const time = new Date(item.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={item.id} className={`flex items-start gap-4 px-5 py-3.5 ${i < (items as any[]).length - 1 ? "border-b" : ""} transition-colors`}
                  style={{ borderColor: "#F4F3F0" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#F4F3F0"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <div className="flex items-center gap-3 flex-shrink-0 pt-0.5">
                    <span className="w-12 text-xs text-right" style={{ color: "#B8B4AC" }}>{time}</span>
                    <div className="w-2 h-2 rounded-full" style={{ background: tc.dot }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed" style={{ color: "#1A1F3C" }}>{item.action}</p>
                    {item.details && (
                      <p className="mt-0.5 text-xs" style={{ color: "#8C887F" }}>{item.details}</p>
                    )}
                  </div>
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: tc.bg, color: tc.color }}>{item.tag ?? type}</span>
                </div>
              );
            })}
          </div>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: "#8C887F" }}>
            <p className="text-sm">No activity for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
