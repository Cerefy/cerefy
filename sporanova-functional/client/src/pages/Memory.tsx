import { useWorkspace } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Brain, Search, Clock, User, Building, Bot, RefreshCw, Filter } from "lucide-react";
import { useState } from "react";

const TYPE_ICONS: Record<string, typeof Brain> = { short_term: Clock, long_term: Brain, user: User, company: Building, agent: Bot };
const TYPE_COLORS: Record<string, string> = { short_term: "#C5974A", long_term: "#5B6FA8", user: "#4A8B8C", company: "#6B7FBF", agent: "#B8675A" };
const TYPE_LABELS: Record<string, string> = { short_term: "Short-term", long_term: "Long-term", user: "User", company: "Company", agent: "Agent" };

export default function Memory() {
  const { workspaceId } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchFocused, setSearchFocused] = useState(false);

  const memories = trpc.memoryEnhanced.search.useQuery(
    { workspaceId: workspaceId ?? 0, query: searchQuery || "recent", type: typeFilter === "all" ? undefined : typeFilter as any },
    { enabled: Boolean(workspaceId) }
  );

  const data = memories.data ?? [];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sn-label mb-1">Memory</p>
          <h1 className="text-xl font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>Agent Memory</h1>
          <p className="mt-1 text-sm text-[#8C887F]">Short-term, long-term, user, company, and agent memory across all conversations.</p>
        </div>
        <button onClick={() => memories.refetch()} className="inline-flex items-center gap-2 rounded-xl bg-[#FAFAF8] px-3 py-2 text-xs font-medium text-[#6B6660] ring-1 ring-[#E8E6E2] transition hover:bg-[#F4F3F0]">
          <RefreshCw size={14} className={memories.isFetching ? "animate-spin" : ""} />Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {(["short_term", "long_term", "user", "company", "agent"] as const).map(type => {
          const Icon = TYPE_ICONS[type];
          const count = data.filter(m => m.type === type).length;
          return (
            <button key={type} onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
              className={`rounded-2xl border p-4 text-left transition ${typeFilter === type ? "border-[#5B6FA8] bg-[#F0EFF8]" : "border-[#E8E6E2] bg-[#FAFAF8] hover:bg-[#F4F3F0]"}`}>
              <Icon size={16} style={{ color: TYPE_COLORS[type] }} />
              <p className="mt-2 text-xs font-medium" style={{ color: "#8C887F" }}>{TYPE_LABELS[type]}</p>
              <p className="mt-1 text-xl font-medium">{memories.isLoading ? "…" : count}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
        style={{ background: "#F4F3F0", border: `1px solid ${searchFocused ? "#6B7FBF" : "transparent"}`, boxShadow: searchFocused ? "0 0 0 2px rgba(107,127,191,0.2)" : "none" }}>
        <Search size={14} style={{ color: "#B8B4AC", flexShrink: 0 }} />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
          placeholder="Search memories by content, key, or tags…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#B8B4AC]" style={{ color: "#1A1F3C" }} />
        {searchQuery && <button onClick={() => setSearchQuery("")} className="text-xs text-[#B8675A] hover:text-[#9C4F44]">Clear</button>}
      </div>

      {/* Memory list */}
      <div className="space-y-2">
        {data.map((memory) => {
          const Icon = TYPE_ICONS[memory.type] || Brain;
          const color = TYPE_COLORS[memory.type] || "#6B7FBF";
          return (
            <div key={memory.id} className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-4 transition hover:bg-[#F4F3F0]">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: "#1A1F3C" }}>{memory.key}</p>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${color}15`, color }}>{TYPE_LABELS[memory.type]}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "#8C887F" }}>{typeof memory.value === "string" ? memory.value.slice(0, 200) : JSON.stringify(memory.value).slice(0, 200)}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px]" style={{ color: "#B8B4AC" }}>
                    <span>Accessed {memory.accessCount}×</span>
                    <span>{memory.expiresAt ? `Expires ${new Date(memory.expiresAt).toLocaleDateString()}` : "No expiry"}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {data.length === 0 && !memories.isLoading && (
          <div className="grid min-h-48 place-items-center text-center">
            <div>
              <Brain size={22} className="mx-auto mb-3 text-[#B8B4AC]" />
              <p className="text-sm font-medium">No memories found</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[#8C887F]">
                {searchQuery ? "Try a different search query." : "Memories will appear here as agents converse with users."}
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-[#B8B4AC]">{data.length} memories · {data.filter(m => m.expiresAt && new Date(m.expiresAt) < new Date()).length} expired</p>
    </div>
  );
}
