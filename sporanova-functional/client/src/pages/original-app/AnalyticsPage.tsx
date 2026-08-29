import { useEffect, useRef, useState } from "react";

function BarChart({ data, color = "#5B6FA8" }: { data: number[]; color?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t); }, []);
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <div className="rounded-t-sm transition-all duration-700"
            style={{
              height: mounted ? `${(v / max) * 100}%` : "4px",
              background: color,
              transitionDelay: `${i * 40}ms`,
              opacity: i === data.length - 1 ? 1 : 0.6,
            }} />
        </div>
      ))}
    </div>
  );
}

function LineSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const norm = (v: number) => ((v - min) / (max - min || 1)) * 40;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${44 - norm(v)}`).join(" ");
  return (
    <svg viewBox="0 0 100 48" className="w-full" preserveAspectRatio="none" style={{ height: 48 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const kpis = [
  { label: "Monthly Recurring Revenue", value: "$2.06M", change: "+8.4%", positive: true, data: [1.2, 1.4, 1.55, 1.62, 1.78, 1.9, 2.06] },
  { label: "Net Revenue Retention", value: "118%",  change: "+3pts", positive: true, data: [108, 110, 112, 113, 115, 116, 118] },
  { label: "Customer Acquisition Cost", value: "$4,200", change: "-12.3%", positive: true, data: [6200, 5800, 5400, 5100, 4900, 4500, 4200] },
  { label: "Avg Contract Value", value: "$38.4K", change: "+5.7%", positive: true, data: [32, 33, 34, 35, 36, 37, 38.4] },
];

const tableData = [
  { segment: "Enterprise", mrr: "$1.24M", nrr: "124%", cac: "$8,200", acv: "$62K", status: "healthy" },
  { segment: "Mid-Market", mrr: "$580K",  nrr: "115%", cac: "$3,100", acv: "$28K", status: "healthy" },
  { segment: "SMB",        mrr: "$240K",  nrr: "104%", cac: "$1,200", acv: "$8K",  status: "watch" },
];

export default function AnalyticsPage() {
  const barData = [42, 58, 51, 67, 73, 69, 82, 78, 91, 88, 94, 97];

  return (
    <div className="sn-page-enter max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="sn-label mb-1">Analytics</div>
          <h1 className="text-xl font-medium" style={{ color: "#1A1F3C" }}>Business Performance</h1>
        </div>
        <div className="flex gap-2">
          {["7D", "30D", "90D", "1Y"].map((p, i) => (
            <button key={p} className="px-3 py-1.5 text-xs rounded-lg transition-all"
              style={{ background: i === 3 ? "#1A1F3C" : "#F4F3F0", color: i === 3 ? "#F8F6F2" : "#8C887F" }}>
              {p}
            </button>
          ))}
          <button className="px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5"
            style={{ background: "#F4F3F0", color: "#6B6660" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 3h8M3.5 6h5M5 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className="p-5 rounded-2xl transition-all duration-300"
            style={{
              background: "#FAFAF8", border: "1px solid #E8E6E2",
              animation: `sn-slide-up 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(26,31,60,0.06)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}>
            <div className="sn-label mb-3">{kpi.label}</div>
            <div className="text-xl font-medium mb-1" style={{ color: "#1A1F3C" }}>{kpi.value}</div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: kpi.positive ? "#4A8B8C" : "#B8675A" }}>{kpi.change}</span>
            </div>
            <div className="mt-3">
              <LineSparkline data={kpi.data} color={kpi.positive ? "#4A8B8C" : "#B8675A"} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="sn-label mb-1">Revenue by Month</div>
              <div className="text-lg font-medium" style={{ color: "#1A1F3C" }}>$24.8M YTD</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#5B6FA8" }} />
                <span style={{ fontSize: "0.7rem", color: "#8C887F" }}>Current Year</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#D4D1CB" }} />
                <span style={{ fontSize: "0.7rem", color: "#8C887F" }}>Prior Year</span>
              </div>
            </div>
          </div>
          <BarChart data={barData} color="#5B6FA8" />
          <div className="flex justify-between mt-2">
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
              <span key={m} style={{ fontSize: "0.6rem", color: "#B8B4AC" }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Donut-ish breakdown */}
        <div className="p-6 rounded-2xl" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
          <div className="sn-label mb-4">Revenue Breakdown</div>
          <div className="flex flex-col gap-3">
            {[
              { label: "Enterprise", pct: 60, color: "#5B6FA8" },
              { label: "Mid-Market", pct: 28, color: "#4A8B8C" },
              { label: "SMB",        pct: 12, color: "#C5974A" },
            ].map((seg) => (
              <div key={seg.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
                    <span className="text-xs" style={{ color: "#6B6660" }}>{seg.label}</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#1A1F3C" }}>{seg.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E8E6E2" }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${seg.pct}%`, background: seg.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-sn-100">
            <div className="sn-label mb-3">Key Insight</div>
            <p className="text-xs leading-relaxed" style={{ color: "#6B6660" }}>
              Enterprise segment growing 3× faster than SMB. Consider reallocating sales capacity.
            </p>
          </div>
        </div>
      </div>

      {/* Segment table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
        <div className="px-6 py-4 border-b border-sn-100 flex items-center justify-between">
          <div className="sn-label">Segment Performance</div>
          <button className="text-xs font-medium transition-colors" style={{ color: "#6B7FBF" }}>Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #F4F3F0" }}>
                {["Segment", "MRR", "NRR", "CAC", "ACV", "Health"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left sn-label">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={row.segment} style={{ borderBottom: i < tableData.length - 1 ? "1px solid #F4F3F0" : "none" }}
                  className="transition-colors"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F8F6F2"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}>
                  <td className="px-6 py-3.5 text-sm font-medium" style={{ color: "#1A1F3C" }}>{row.segment}</td>
                  <td className="px-6 py-3.5 text-sm" style={{ color: "#1A1F3C" }}>{row.mrr}</td>
                  <td className="px-6 py-3.5 text-sm" style={{ color: "#4A8B8C" }}>{row.nrr}</td>
                  <td className="px-6 py-3.5 text-sm" style={{ color: "#6B6660" }}>{row.cac}</td>
                  <td className="px-6 py-3.5 text-sm" style={{ color: "#6B6660" }}>{row.acv}</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: row.status === "healthy" ? "#EEF6F6" : "#FDF4EE", color: row.status === "healthy" ? "#4A8B8C" : "#C5974A" }}>
                      {row.status === "healthy" ? "Healthy" : "Watch"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
