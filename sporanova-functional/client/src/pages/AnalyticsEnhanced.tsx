import { useWorkspace } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, AlertTriangle, Lightbulb, Coins, Clock, MessageSquare, Bot, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function AnalyticsEnhanced() {
  const { workspaceId } = useWorkspace();
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");

  const dashboard = trpc.analyticsEnhanced.dashboard.useQuery(
    { workspaceId: workspaceId ?? 0, period },
    { enabled: Boolean(workspaceId) }
  );
  const insights = trpc.analyticsEnhanced.insights.useQuery(
    { workspaceId: workspaceId ?? 0 },
    { enabled: Boolean(workspaceId) }
  );
  const costs = trpc.analyticsEnhanced.costs.useQuery(
    { workspaceId: workspaceId ?? 0 },
    { enabled: Boolean(workspaceId) }
  );

  const data = dashboard.data;

  const kpiCards = data ? [
    { label: "Total Conversations", value: data.conversations.total.toLocaleString(), sub: `${data.conversations.thisWeek} this ${period}`, icon: MessageSquare, color: "#6B7FBF" },
    { label: "Resolution Rate", value: `${data.resolution.rate}%`, sub: `${data.resolution.autoResolved} auto-resolved`, icon: TrendingUp, color: "#4A8B8C" },
    { label: "Avg Latency", value: `${data.latency.avgMs}ms`, sub: `p95: ${data.latency.p95Ms}ms`, icon: Clock, color: "#C5974A" },
    { label: "Active Agents", value: `${data.agents.active}`, sub: `${data.agents.total} total`, icon: Bot, color: "#5B6FA8" },
    { label: "Cost/Conversation", value: `$${data.cost.perConversation.toFixed(4)}`, sub: `$${data.cost.thisMonth.toFixed(2)} this month`, icon: Coins, color: "#B8675A" },
    { label: "CSAT Score", value: `${data.csat.score}/5`, sub: `${data.csat.responses} responses`, icon: TrendingUp, color: "#4A8B8C" },
  ] : [];

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sn-label mb-1">Analytics & Intelligence</p>
          <h1 className="text-xl font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>AI-Powered Insights</h1>
        </div>
        <div className="flex gap-2">
          <div className="inline-flex rounded-xl bg-[#E8E6E2] p-1">
            {(["day", "week", "month"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${period === p ? "bg-[#FAFAF8] text-[#1A1F3C] shadow-sm" : "text-[#8C887F]"}`}>{p}</button>
            ))}
          </div>
          <button onClick={() => dashboard.refetch()} className="inline-flex items-center gap-2 rounded-xl bg-[#FAFAF8] px-3 py-2 text-xs font-medium text-[#6B6660] ring-1 ring-[#E8E6E2] hover:bg-[#F4F3F0]">
            <RefreshCw size={14} className={dashboard.isFetching ? "animate-spin" : ""} />Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map(card => (
          <div key={card.label} className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-4">
            <card.icon size={16} style={{ color: card.color }} />
            <p className="sn-label mt-3">{card.label}</p>
            <p className="mt-1 text-xl font-medium">{dashboard.isLoading ? "…" : card.value}</p>
            <p className="mt-1 text-[11px] text-[#8C887F]">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* AI Insights */}
        <section className="lg:col-span-2 rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-[#C5974A]" />
            <p className="sn-label">AI Insights</p>
          </div>
          <div className="mt-4 space-y-3">
            {insights.isLoading ? (
              <p className="text-sm text-[#8C887F]">Generating insights…</p>
            ) : insights.data?.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#8C887F]">No insights available yet. More data needed.</p>
            ) : (
              insights.data?.map(insight => (
                <div key={insight.id} className={`rounded-xl border-l-[3px] p-4 ${insight.severity === "high" ? "border-[#B8675A] bg-[#FDF0EE]" : insight.severity === "medium" ? "border-[#C5974A] bg-[#FDF4EE]" : "border-[#4A8B8C] bg-[#EEF6F6]"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#6B6660]">{insight.description}</p>
                      {insight.suggestedAction && (
                        <p className="mt-2 text-xs font-medium text-[#6B7FBF]">💡 {insight.suggestedAction}</p>
                      )}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${insight.severity === "high" ? "bg-[#B8675A]/10 text-[#B8675A]" : insight.severity === "medium" ? "bg-[#C5974A]/10 text-[#C5974A]" : "bg-[#4A8B8C]/10 text-[#4A8B8C]"}`}>
                      {insight.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Sentiment & Topics */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-5">
            <p className="sn-label mb-3">Sentiment Distribution</p>
            {data && (
              <div className="space-y-2">
                {[
                  { label: "Positive", value: data.sentiment.positive, color: "#4A8B8C" },
                  { label: "Neutral", value: data.sentiment.neutral, color: "#C5974A" },
                  { label: "Negative", value: data.sentiment.negative, color: "#B8675A" },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs">
                      <span>{s.label}</span>
                      <span className="font-medium">{s.value}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-[#F4F3F0]">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-5">
            <p className="sn-label mb-3">Cost Breakdown</p>
            {costs.data && (
              <div className="space-y-2">
                {[
                  { label: "AI Cost", value: costs.data.aiCost },
                  { label: "Tools", value: costs.data.toolCost },
                  { label: "Storage", value: costs.data.storageCost },
                ].map(c => (
                  <div key={c.label} className="flex justify-between rounded-xl bg-[#F4F3F0] px-3 py-2 text-xs">
                    <span>{c.label}</span>
                    <span className="font-medium">${c.value.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between rounded-xl bg-[#1A1F3C] px-3 py-2 text-xs text-[#F8F6F2]">
                  <span className="font-medium">Total</span>
                  <span className="font-medium">${costs.data.totalCost.toFixed(2)}</span>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* Top Topics */}
      {data && (
        <section className="mt-5 rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6">
          <p className="sn-label mb-4">Top Conversation Topics</p>
          <div className="space-y-2">
            {data.topTopics.map(topic => (
              <div key={topic.topic} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-xs">{topic.topic}</span>
                <div className="flex-1 h-6 rounded-lg bg-[#F4F3F0]">
                  <div className="h-6 rounded-lg bg-[#5B6FA8]/70 transition-all" style={{ width: `${topic.percent}%` }} />
                </div>
                <span className="w-12 text-right text-xs font-medium">{topic.count}</span>
                <span className="w-10 text-right text-[11px] text-[#8C887F]">{topic.percent}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Unanswered Questions */}
      {data && data.unansweredQuestions.length > 0 && (
        <section className="mt-5 rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#C5974A]" />
            <p className="sn-label">Unanswered Questions</p>
          </div>
          <p className="mt-2 text-xs text-[#8C887F]">These questions are frequently asked but the agent cannot answer them. Add knowledge sources to improve coverage.</p>
          <div className="mt-4 space-y-2">
            {data.unansweredQuestions.map((q, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-[#FDF4EE] px-4 py-3">
                <span className="text-sm">{q.question}</span>
                <span className="text-xs text-[#C5974A]">{q.count}× asked</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
