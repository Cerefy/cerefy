import { useState } from "react";

type SourceStatus = "ready" | "processing" | "error" | "uploading";

interface DataSource {
  id: number;
  name: string;
  type: string;
  status: SourceStatus;
  records: string;
  lastSync: string;
  size: string;
}

const sources: DataSource[] = [
  { id: 1, name: "Salesforce CRM", type: "CRM", status: "ready", records: "124,832", lastSync: "2m ago", size: "4.2 GB" },
  { id: 2, name: "Snowflake Production", type: "Data Warehouse", status: "ready", records: "28.4M", lastSync: "5m ago", size: "380 GB" },
  { id: 3, name: "Stripe Billing", type: "Payments", status: "ready", records: "89,241", lastSync: "1m ago", size: "1.1 GB" },
  { id: 4, name: "Google Analytics", type: "Web Analytics", status: "processing", records: "—", lastSync: "Syncing...", size: "—" },
  { id: 5, name: "HubSpot Marketing", type: "Marketing", status: "ready", records: "45,120", lastSync: "12m ago", size: "2.8 GB" },
  { id: 6, name: "Zendesk Support", type: "Customer Support", status: "error", records: "—", lastSync: "Failed 2h ago", size: "—" },
];

const statusConfig: Record<SourceStatus, { color: string; bg: string; label: string }> = {
  ready:      { color: "#4A8B8C", bg: "#EEF6F6", label: "Ready" },
  processing: { color: "#5B6FA8", bg: "#F0EFF8", label: "Processing" },
  error:      { color: "#B8675A", bg: "#FDF0EE", label: "Error" },
  uploading:  { color: "#C5974A", bg: "#FDF4EE", label: "Uploading" },
};

const docs = [
  { name: "Q3 Board Presentation.pdf", size: "8.4 MB", type: "PDF", added: "2h ago", status: "ready" },
  { name: "Enterprise Architecture Map.docx", size: "2.1 MB", type: "DOCX", added: "Yesterday", status: "ready" },
  { name: "Customer Success Playbook.pdf", size: "14.2 MB", type: "PDF", added: "3 days ago", status: "ready" },
  { name: "Q2 Financial Report.xlsx", size: "5.7 MB", type: "XLSX", added: "1 week ago", status: "ready" },
];

export default function DataPage() {
  const [tab, setTab] = useState<"sources" | "documents" | "memory">("sources");
  const [dragging, setDragging] = useState(false);

  return (
    <div className="sn-page-enter max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="sn-label mb-1">Data Management</div>
          <h1 className="text-xl font-medium" style={{ color: "#1A1F3C" }}>Enterprise Data</h1>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: "#1A1F3C", color: "#F8F6F2" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#252B4A"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; }}>
          + Connect Source
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Sources", value: "34", sub: "6 shown" },
          { label: "Total Records", value: "28.7M", sub: "across all sources" },
          { label: "Data Health", value: "96.8%", sub: "5 of 34 need attention" },
        ].map((card) => (
          <div key={card.label} className="p-5 rounded-2xl" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
            <div className="sn-label mb-2">{card.label}</div>
            <div className="text-xl font-medium" style={{ color: "#1A1F3C" }}>{card.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#8C887F" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: "#F4F3F0" }}>
        {(["sources", "documents", "memory"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
            style={{ background: tab === t ? "#FAFAF8" : "transparent", color: tab === t ? "#1A1F3C" : "#8C887F",
              boxShadow: tab === t ? "0 1px 3px rgba(26,31,60,0.08)" : "none" }}>
            {t === "memory" ? "Enterprise Memory" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "sources" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #F4F3F0" }}>
                {["Source", "Type", "Records", "Last Sync", "Size", "Status", ""].map((h) => (
                  <th key={h} className="px-6 py-3 text-left sn-label">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.map((src, i) => {
                const sc = statusConfig[src.status];
                return (
                  <tr key={src.id} style={{ borderBottom: i < sources.length - 1 ? "1px solid #F8F6F2" : "none" }}
                    className="transition-colors group"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F8F6F2"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm" style={{ color: "#1A1F3C" }}>{src.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#8C887F" }}>{src.type}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1A1F3C" }}>{src.records}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#8C887F" }}>{src.lastSync}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#8C887F" }}>{src.size}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "#F4F3F0", color: "#6B6660" }}>Sync</button>
                        <button className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "#F4F3F0", color: "#6B6660" }}>Settings</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "documents" && (
        <div className="flex flex-col gap-4">
          {/* Drop zone */}
          <div
            className="rounded-2xl p-10 text-center transition-all duration-200"
            style={{
              border: `2px dashed ${dragging ? "#6B7FBF" : "#D4D1CB"}`,
              background: dragging ? "#F0EFF8" : "#FAFAF8",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); }}
          >
            <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: "#F4F3F0" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3v10M6 7l4-4 4 4" stroke="#8C887F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 15h12" stroke="#8C887F" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "#1A1F3C" }}>Drop files to add to Enterprise Memory</p>
            <p className="text-xs" style={{ color: "#8C887F" }}>PDF, DOCX, XLSX, CSV — up to 500 MB per file</p>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
            <div className="px-6 py-3 border-b border-sn-100 sn-label">Documents</div>
            {docs.map((doc, i) => (
              <div key={doc.name} className="flex items-center gap-4 px-6 py-4 transition-colors group"
                style={{ borderBottom: i < docs.length - 1 ? "1px solid #F4F3F0" : "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#F8F6F2"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ""; }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: "#F4F3F0", color: "#8C887F" }}>{doc.type}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#1A1F3C" }}>{doc.name}</div>
                  <div className="text-xs" style={{ color: "#8C887F" }}>{doc.size} · Added {doc.added}</div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "#F4F3F0", color: "#6B6660" }}>View</button>
                  <button className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "#F4F3F0", color: "#B8675A" }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "memory" && (
        <div className="p-8 rounded-2xl text-center" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#F0EFF8" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2a7 7 0 017 7v1h1a2 2 0 010 4h-1a7 7 0 01-14 0h-1a2 2 0 010-4h1V9a7 7 0 017-7z" stroke="#5B6FA8" strokeWidth="1.3" />
              <path d="M9 14h6M10 11h4" stroke="#5B6FA8" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: "#1A1F3C" }}>Enterprise Memory Active</h3>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "#8C887F" }}>
            SOPRANOVA has indexed 247 documents, 34 data sources, and 18 months of enterprise activity into a unified intelligence layer.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[{ label: "Documents Indexed", value: "247" }, { label: "Data Sources", value: "34" }, { label: "Entities Learned", value: "12,483" }].map((s) => (
              <div key={s.label} className="p-3 rounded-xl" style={{ background: "#F4F3F0" }}>
                <div className="text-lg font-medium" style={{ color: "#1A1F3C" }}>{s.value}</div>
                <div className="sn-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
