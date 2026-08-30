import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useWorkspace } from "@/contexts/WorkspaceContext";

type InsightStatus = "open" | "acknowledged" | "resolved";

const statusConfig: Record<InsightStatus, { label: string; bg: string; color: string }> = {
  open: { label: "Awaiting Approval", bg: "#FDF4EE", color: "#C5974A" },
  acknowledged: { label: "In Review", bg: "#F0EFF8", color: "#5B6FA8" },
  resolved: { label: "Approved", bg: "#EEF6F6", color: "#4A8B8C" },
};

const severityConfig: Record<string, { bg: string; color: string }> = {
  high: { bg: "#FDF0EE", color: "#B8675A" },
  medium: { bg: "#FDF4EE", color: "#C5974A" },
  low: { bg: "#F4F3F0", color: "#8C887F" },
};

export default function Decisions() {
  const { workspaceId } = useWorkspace();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const decisions = trpc.decisions.list.useQuery(
    { workspaceId: workspaceId ?? 0, limit: 50 },
    { enabled: Boolean(workspaceId) }
  );

  const stats = trpc.decisions.getStats.useQuery(
    { workspaceId: workspaceId ?? 0 },
    { enabled: Boolean(workspaceId) }
  );

  const approve = trpc.decisions.approve.useMutation({
    onSuccess: () => { decisions.refetch(); stats.refetch(); },
  });

  const reject = trpc.decisions.reject.useMutation({
    onSuccess: () => { decisions.refetch(); stats.refetch(); setSelectedId(null); },
  });

  const items = decisions.data ?? [];
  const selected = items.find((d) => d.id === selectedId) ?? items[0] ?? null;
  const currentStatus = (selected?.status ?? "open") as InsightStatus;
  const cfg = statusConfig[currentStatus] ?? statusConfig.open;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="sn-label mb-1">Decisions</div>
      <h1 className="text-xl font-medium mb-5" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>Decision Intelligence</h1>

      {/* Stats bar */}
      {stats.data && (
        <div className="mb-5 flex flex-wrap gap-3">
          {[
            { label: "Total", value: stats.data.total, bg: "#F4F3F0", color: "#6B6660" },
            { label: "Open", value: stats.data.open, bg: "#FDF4EE", color: "#C5974A" },
            { label: "Resolved", value: stats.data.resolved, bg: "#EEF6F6", color: "#4A8B8C" },
            { label: "High Severity", value: stats.data.high, bg: "#FDF0EE", color: "#B8675A" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl px-4 py-2.5" style={{ background: s.bg }}>
              <p className="text-xs font-medium" style={{ color: s.color }}>{s.label}</p>
              <p className="text-lg font-semibold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* List */}
        <aside className="space-y-2">
          {decisions.isLoading ? (
            <p className="text-sm text-[#8C887F]">Loading decisions…</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D4D1CB] bg-[#FAFAF8] p-6 text-center">
              <p className="text-sm font-medium" style={{ color: "#6B6660" }}>No decisions yet</p>
              <p className="mt-1 text-xs" style={{ color: "#8C887F" }}>Insights and recommendations will appear here.</p>
            </div>
          ) : (
            items.map((d) => {
              const s = (d.status ?? "open") as InsightStatus;
              const c = statusConfig[s] ?? statusConfig.open;
              const isActive = selected?.id === d.id;
              return (
                <button key={d.id} onClick={() => setSelectedId(d.id)}
                  className="w-full text-left rounded-2xl border p-4 transition-all duration-200"
                  style={{
                    background: isActive ? "#F0EFF8" : "#FAFAF8",
                    borderColor: isActive ? "#D8D6ED" : "#E8E6E2",
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium leading-snug" style={{ color: "#1A1F3C" }}>{d.title}</p>
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: c.bg, color: c.color }}>{c.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: "#B8B4AC" }}>{new Date(d.createdAt).toLocaleDateString()}</p>
                </button>
              );
            })
          )}
        </aside>

        {/* Detail */}
        <div className="rounded-2xl border p-6 md:p-8" style={{ background: "#FAFAF8", borderColor: "#E8E6E2" }}>
          {!selected ? (
            <div className="grid h-full min-h-56 place-items-center text-center">
              <p className="text-sm" style={{ color: "#8C887F" }}>Select a decision to view details.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="sn-label mb-2">Decision</div>
                  <h2 className="text-xl font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>{selected.title}</h2>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: severityConfig[selected.severity]?.bg ?? "#F4F3F0", color: severityConfig[selected.severity]?.color ?? "#8C887F" }}>
                    {selected.severity}
                  </span>
                </div>
              </div>

              <div>
                <div className="sn-label mb-2" style={{ color: "#5B6FA8" }}>Description</div>
                <p className="text-sm leading-relaxed" style={{ color: "#1A1F3C" }}>{selected.description}</p>
              </div>

              <div>
                <div className="sn-label mb-2" style={{ color: "#6B6660" }}>Category</div>
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "#E8E6E2", color: "#6B6660" }}>{selected.category}</span>
              </div>

              {currentStatus === "open" && (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => workspaceId && approve.mutate({ workspaceId, insightId: selected.id })}
                    disabled={approve.isPending}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:bg-[#D4D1CB]"
                    style={{ background: "#1A1F3C", color: "#F8F6F2" }}
                    onMouseEnter={(e) => { if (!approve.isPending) e.currentTarget.style.background = "#252B4A"; }}
                    onMouseLeave={(e) => { if (!approve.isPending) e.currentTarget.style.background = "#1A1F3C"; }}>
                    {approve.isPending ? "Approving…" : "Approve Decision"}
                  </button>
                  <button onClick={() => workspaceId && reject.mutate({ workspaceId, insightId: selected.id })}
                    disabled={reject.isPending}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 disabled:opacity-50"
                    style={{ borderColor: "#E8E6E2", color: "#6B6660" }}>
                    {reject.isPending ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              )}

              {currentStatus === "resolved" && (
                <div className="rounded-xl p-4" style={{ background: "#EEF6F6" }}>
                  <p className="text-sm font-medium" style={{ color: "#4A8B8C" }}>Decision approved. Automation triggered.</p>
                </div>
              )}

              {currentStatus === "acknowledged" && (
                <div className="rounded-xl p-4" style={{ background: "#F0EFF8" }}>
                  <p className="text-sm font-medium" style={{ color: "#5B6FA8" }}>Decision is currently under review.</p>
                </div>
              )}

              {(approve.error || reject.error) && (
                <p className="text-sm" style={{ color: "#B8675A" }}>{approve.error?.message || reject.error?.message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
