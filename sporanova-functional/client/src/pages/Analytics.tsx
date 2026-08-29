import { useWorkspace } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { BarChart3, Download } from "lucide-react";
import { useState } from "react";

const display = (value: number, kind: "currency" | "percent") => {
  if (kind === "percent") return `${value.toFixed(1)}%`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
};

export default function Analytics() {
  const { workspaceId } = useWorkspace();
  const [range, setRange] = useState<"7D" | "30D" | "90D" | "1Y">("1Y");
  const overview = trpc.analytics.overview.useQuery({ workspaceId: workspaceId ?? 0, range }, { enabled: Boolean(workspaceId) });
  const segments = trpc.analytics.segments.useQuery({ workspaceId: workspaceId ?? 0, range, page: 1, pageSize: 25 }, { enabled: Boolean(workspaceId) });
  const segmentItems = (segments.data?.items ?? []) as Array<{ segment: string; mrr?: number; nrr?: number; cac?: number; acv?: number }>;
  const cards = [
    { label: "Monthly Recurring Revenue", data: overview.data?.kpis.mrr, kind: "currency" as const },
    { label: "Net Revenue Retention", data: overview.data?.kpis.nrr, kind: "percent" as const },
    { label: "Customer Acquisition Cost", data: overview.data?.kpis.cac, kind: "currency" as const },
    { label: "Average Contract Value", data: overview.data?.kpis.acv, kind: "currency" as const },
  ];
  const series = overview.data?.series ?? [];
  const maxSeriesValue = Math.max(...series.map(item => item.value), 1);

  return <div className="animate-in fade-in duration-300">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="sn-label mb-1">Analytics</p><h1 className="text-xl font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>Business Performance</h1></div><div className="inline-flex rounded-xl bg-[#E8E6E2] p-1">{(["7D", "30D", "90D", "1Y"] as const).map(value => <button key={value} onClick={() => setRange(value)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${range === value ? "bg-[#FAFAF8] text-[#1A1F3C] shadow-sm" : "text-[#8C887F]"}`}>{value}</button>)}</div></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(card => <div key={card.label} className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-5"><p className="sn-label">{card.label}</p><p className="mt-3 text-xl font-medium">{card.data ? display(card.data.value, card.kind) : "—"}</p><p className={`mt-1 text-xs ${card.data?.changePercent && card.data.changePercent >= 0 ? "text-[#4A8B8C]" : "text-[#8C887F]"}`}>{card.data?.changePercent === null || card.data?.changePercent === undefined ? "No prior-period comparison" : `${card.data.changePercent >= 0 ? "+" : ""}${card.data.changePercent.toFixed(1)}% vs prior period`}</p></div>)}</div>
    <div className="mt-5 grid gap-4 lg:grid-cols-3"><section className="lg:col-span-2 rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6"><p className="sn-label">Revenue by period</p><h2 className="mt-1 text-lg font-medium">{range} aggregation</h2>{series.length ? <div className="mt-8 flex h-44 items-end gap-2">{series.map((item, index) => <div key={`${item.date}-${index}`} title={`${new Date(item.date).toLocaleDateString()}: ${item.value}`} className="flex-1 rounded-t bg-[#5B6FA8]" style={{ height: `${Math.max(4, (item.value / maxSeriesValue) * 100)}%`, opacity: index === series.length - 1 ? 1 : 0.65 }} />)}</div> : <div className="grid min-h-44 place-items-center text-center"><div><BarChart3 className="mx-auto mb-3 text-[#B8B4AC]" /><p className="text-sm font-medium">No metric series yet</p><p className="mt-1 text-xs text-[#8C887F]">Analytics will populate when workspace metrics are ingested.</p></div></div>}</section><section className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6"><p className="sn-label">Important note</p><p className="mt-4 text-sm leading-relaxed text-[#6B6660]">All values are calculated on the server from records assigned to your active workspace. No browser-side aggregate or sample dataset is used.</p></section></div>
    <section className="mt-5 overflow-hidden rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8]"><div className="flex items-center justify-between border-b border-[#E8E6E2] p-4"><p className="sn-label">Segment Performance</p><button className="inline-flex items-center gap-1 text-xs font-medium text-[#8C887F]" title="Export becomes available when metric rows exist"><Download size={13} />Export CSV</button></div><table className="w-full text-left"><thead><tr>{["Segment", "MRR", "NRR", "CAC", "ACV"].map(label => <th key={label} className="px-4 py-3 sn-label">{label}</th>)}</tr></thead><tbody>{segmentItems.length ? segmentItems.map(item => <tr key={item.segment} className="border-t border-[#F4F3F0]"><td className="px-4 py-3 text-sm font-medium">{item.segment}</td><td className="px-4 py-3 text-sm">{display(item.mrr ?? 0, "currency")}</td><td className="px-4 py-3 text-sm">{display(item.nrr ?? 0, "percent")}</td><td className="px-4 py-3 text-sm">{display(item.cac ?? 0, "currency")}</td><td className="px-4 py-3 text-sm">{display(item.acv ?? 0, "currency")}</td></tr>) : <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-[#8C887F]">No segment metrics exist for this period.</td></tr>}</tbody></table></section>
  </div>;
}
