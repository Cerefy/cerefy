import { useWorkspace } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Activity, Clock, Coins, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

export default function Traces() {
  const { workspaceId } = useWorkspace();
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const traces = trpc.observability.traces.useQuery(
    { workspaceId: workspaceId ?? 0, limit: 50 },
    { enabled: Boolean(workspaceId) }
  );

  const selectedTrace = trpc.observability.trace.useQuery(
    { workspaceId: workspaceId ?? 0, traceId: selectedTraceId || "" },
    { enabled: Boolean(workspaceId && selectedTraceId) }
  );

  const filteredTraces = (traces.data || []).filter(t =>
    !searchQuery || t.id.includes(searchQuery) || JSON.stringify(t.metadata).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusIcon = (status: string) => {
    if (status === "ok") return <CheckCircle size={14} className="text-[#4A8B8C]" />;
    if (status === "error") return <XCircle size={14} className="text-[#B8675A]" />;
    return <AlertCircle size={14} className="text-[#C5974A]" />;
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sn-label mb-1">Observability</p>
          <h1 className="text-xl font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>Traces & Monitoring</h1>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
        {/* Trace List */}
        <section className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8]">
          <div className="border-b border-[#E8E6E2] p-4">
            <div className="flex items-center gap-2">
              <Search size={14} className="text-[#8C887F]" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search traces…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#B8B4AC]" />
            </div>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {traces.isLoading ? (
              <p className="p-5 text-sm text-[#8C887F]">Loading traces…</p>
            ) : filteredTraces.length === 0 ? (
              <div className="grid min-h-48 place-items-center text-center">
                <div>
                  <Activity className="mx-auto mb-3 text-[#B8B4AC]" size={24} />
                  <p className="text-sm font-medium">No traces yet</p>
                  <p className="mt-1 text-xs text-[#8C887F]">Traces appear here when agents process requests.</p>
                </div>
              </div>
            ) : (
              filteredTraces.map(trace => (
                <div
                  key={trace.id}
                  onClick={() => setSelectedTraceId(selectedTraceId === trace.id ? null : trace.id)}
                  className={`cursor-pointer border-b border-[#F4F3F0] p-4 transition hover:bg-[#F4F3F0] ${selectedTraceId === trace.id ? "bg-[#F0EFF8]" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    {statusIcon(trace.status)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{trace.id}</p>
                      <div className="mt-1 flex gap-3 text-[11px] text-[#8C887F]">
                        <span className="flex items-center gap-1"><Clock size={10} />{trace.totalDurationMs || "—"}ms</span>
                        <span>{trace.spans?.length || 0} spans</span>
                        <span>{new Date(trace.startTime).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    {selectedTraceId === trace.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Trace Detail */}
        <aside className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-5">
          {selectedTrace.data ? (
            <div>
              <div className="flex items-center gap-2">
                {statusIcon(selectedTrace.data.status)}
                <h2 className="text-sm font-medium">Trace Details</h2>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="sn-label">Trace ID</p>
                  <p className="mt-1 break-all text-xs font-mono text-[#6B6660]">{selectedTrace.data.id}</p>
                </div>
                <div>
                  <p className="sn-label">Duration</p>
                  <p className="mt-1 text-sm">{selectedTrace.data.totalDurationMs || "—"}ms</p>
                </div>
                <div>
                  <p className="sn-label">Status</p>
                  <p className="mt-1 text-sm capitalize">{selectedTrace.data.status}</p>
                </div>
                <div>
                  <p className="sn-label">Spans ({selectedTrace.data.spans?.length || 0})</p>
                  <div className="mt-2 space-y-2">
                    {selectedTrace.data.spans?.map(span => (
                      <div key={span.id} className="rounded-xl bg-[#F4F3F0] p-3">
                        <div className="flex items-center gap-2">
                          {statusIcon(span.status)}
                          <span className="text-xs font-medium">{span.name}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#8C887F]">{span.durationMs || "—"}ms</p>
                        {span.attributes && Object.keys(span.attributes).length > 0 && (
                          <pre className="mt-2 overflow-x-auto text-[10px] text-[#6B6660]">{JSON.stringify(span.attributes, null, 2)}</pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {selectedTrace.data.metadata && Object.keys(selectedTrace.data.metadata).length > 0 && (
                  <div>
                    <p className="sn-label">Metadata</p>
                    <pre className="mt-1 overflow-x-auto rounded-xl bg-[#F4F3F0] p-3 text-[11px] text-[#6B6660]">{JSON.stringify(selectedTrace.data.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid min-h-56 place-items-center text-center">
              <div>
                <Activity className="mx-auto mb-3 text-[#B8B4AC]" size={24} />
                <p className="text-sm font-medium">Select a trace</p>
                <p className="mt-1 text-xs text-[#8C887F]">Click a trace to view its spans and details.</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
