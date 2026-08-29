import { useState } from "react";

type Status = "awaiting-approval" | "in-review" | "draft" | "approved" | "rejected";

const decisions = [
  {
    id: 1, title: "Pricing Strategy — Region North", status: "awaiting-approval" as Status,
    recommendation: "Increase enterprise pricing by 3–5% for Region North accounts with renewal dates in Q1 2026.",
    evidence: [
      { source: "Historical Sales", finding: "Win rates remain strong at 71% in Region North, suggesting price tolerance above current levels." },
      { source: "Customer Behavior", finding: "Feature adoption at 84% for this cohort — highest in portfolio, indicating high perceived value." },
      { source: "Competitor Pricing", finding: "Primary competitor raised prices 6% in August 2025. We remain 9% below market average." },
      { source: "Margin Impact", finding: "A 4% price increase yields $1.8M additional gross margin with estimated <1.5% churn impact." },
    ],
    date: "Dec 14, 2026",
  },
  {
    id: 2, title: "Customer Success Intervention — Q2 Cohort", status: "in-review" as Status,
    recommendation: "Deploy targeted customer success program for the 34 accounts in the Q2 2025 onboarding cohort showing below-average adoption.",
    evidence: [
      { source: "Product Analytics", finding: "Feature adoption at 61% vs. 79% portfolio average. Core workflow activation missing for 22 accounts." },
      { source: "Customer Success", finding: "NPS for this cohort: 28 vs. 54 overall. High risk of churning at Q3 renewal." },
    ],
    date: "Dec 12, 2026",
  },
  {
    id: 3, title: "APAC Market Expansion", status: "draft" as Status,
    recommendation: "Establish direct sales presence in Singapore and Sydney to capture identified pipeline opportunity.",
    evidence: [],
    date: "Dec 10, 2026",
  },
  {
    id: 4, title: "Vendor Contract Renewal — Data Infrastructure", status: "approved" as Status,
    recommendation: "Renew Snowflake contract for 3 years at negotiated rate of $420K/yr (12% reduction).",
    evidence: [],
    date: "Dec 8, 2026",
  },
];

const statusConfig: Record<Status, { label: string; bg: string; color: string }> = {
  "awaiting-approval": { label: "Awaiting Approval", bg: "#FDF4EE", color: "#C5974A" },
  "in-review": { label: "In Review", bg: "#F0EFF8", color: "#5B6FA8" },
  "draft": { label: "Draft", bg: "#F4F3F0", color: "#8C887F" },
  "approved": { label: "Approved", bg: "#EEF6F6", color: "#4A8B8C" },
  "rejected": { label: "Rejected", bg: "#FDF0EE", color: "#B8675A" },
};

export default function Decisions() {
  const [selected, setSelected] = useState(decisions[0]);
  const [statuses, setStatuses] = useState<Record<number, Status>>(
    Object.fromEntries(decisions.map((d) => [d.id, d.status]))
  );

  function act(action: "approved" | "rejected") {
    setStatuses((prev) => ({ ...prev, [selected.id]: action }));
  }

  const currentStatus = statuses[selected.id];
  const cfg = statusConfig[currentStatus];

  return (
    <div className="animate-in fade-in duration-300">
      <div className="sn-label mb-1">Decisions</div>
      <h1 className="text-xl font-medium mb-5" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>Decision Intelligence</h1>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* List */}
        <aside className="space-y-2">
          {decisions.map((d) => {
            const s = statuses[d.id];
            const c = statusConfig[s];
            return (
              <button key={d.id} onClick={() => setSelected(d)}
                className="w-full text-left rounded-2xl border p-4 transition-all duration-200"
                style={{
                  background: selected.id === d.id ? "#F0EFF8" : "#FAFAF8",
                  borderColor: selected.id === d.id ? "#D8D6ED" : "#E8E6E2",
                }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium leading-snug" style={{ color: "#1A1F3C" }}>{d.title}</p>
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: c.bg, color: c.color }}>{c.label}</span>
                </div>
                <p className="text-xs" style={{ color: "#B8B4AC" }}>{d.date}</p>
              </button>
            );
          })}
        </aside>

        {/* Detail */}
        <div className="rounded-2xl border p-6 md:p-8" style={{ background: "#FAFAF8", borderColor: "#E8E6E2" }}>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="sn-label mb-2">Decision</div>
              <h2 className="text-xl font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>{selected.title}</h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="sn-label mb-2" style={{ color: "#5B6FA8" }}>Recommendation</div>
              <p className="text-sm leading-relaxed" style={{ color: "#1A1F3C" }}>{selected.recommendation}</p>
            </div>

            {selected.evidence.length > 0 && (
              <div>
                <div className="sn-label mb-3" style={{ color: "#4A8B8C" }}>Evidence</div>
                <div className="space-y-2">
                  {selected.evidence.map((ev) => (
                    <div key={ev.source} className="rounded-xl p-4" style={{ background: "#F4F3F0" }}>
                      <div className="flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0" style={{ background: "#E8E6E2", color: "#6B6660" }}>{ev.source}</span>
                        <p className="text-sm leading-relaxed" style={{ color: "#6B6660" }}>{ev.finding}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStatus === "awaiting-approval" && (
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={() => act("approved")}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{ background: "#1A1F3C", color: "#F8F6F2" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#252B4A"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#1A1F3C"}>
                  Approve Decision
                </button>
                <button onClick={() => act("rejected")}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200"
                  style={{ borderColor: "#E8E6E2", color: "#6B6660" }}>
                  Reject
                </button>
                <button className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200"
                  style={{ borderColor: "#E8E6E2", color: "#6B6660" }}>
                  Investigate Further
                </button>
              </div>
            )}

            {currentStatus === "approved" && (
              <div className="rounded-xl p-4" style={{ background: "#EEF6F6" }}>
                <p className="text-sm font-medium" style={{ color: "#4A8B8C" }}>Decision approved. Automation triggered.</p>
              </div>
            )}

            {currentStatus === "rejected" && (
              <div className="rounded-xl p-4" style={{ background: "#FDF0EE" }}>
                <p className="text-sm font-medium" style={{ color: "#B8675A" }}>Decision rejected and archived.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
