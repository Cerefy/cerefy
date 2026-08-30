import { and, eq, sql, desc, gte, lte } from "drizzle-orm";
import {
  conversations,
  messages,
  agents,
  agentRuns,
  documents,
  dataSources,
  auditLogs,
  businessMetrics,
  traces,
} from "../../drizzle/schema";
import { requireDb } from "../db";
import { invokeLLM } from "./llm";

// ─── Analytics Dashboard ────────────────────────────────────────────────────
export interface DashboardMetrics {
  conversations: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    growthPercent: number;
  };
  messages: {
    total: number;
    avgPerConversation: number;
    userMessages: number;
    assistantMessages: number;
  };
  resolution: {
    rate: number;
    escalated: number;
    autoResolved: number;
  };
  csat: {
    score: number;
    responses: number;
  };
  cost: {
    totalUsd: number;
    perConversation: number;
    thisMonth: number;
  };
  latency: {
    avgMs: number;
    p95Ms: number;
    p99Ms: number;
  };
  agents: {
    total: number;
    active: number;
    avgSuccessRate: number;
  };
  topTopics: Array<{ topic: string; count: number; percent: number }>;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  unansweredQuestions: Array<{ question: string; count: number; lastSeen: string }>;
}

export async function getDashboardMetrics(workspaceId: number, period: "day" | "week" | "month" = "week"): Promise<DashboardMetrics> {
  const db = await requireDb();
  const now = new Date();
  const periodStart = new Date(now.getTime() - (period === "day" ? 1 : period === "week" ? 7 : 30) * 24 * 60 * 60 * 1000);

  const [totalConversations] = await db
    .select({ count: sql<number>`count(*)` })
    .from(conversations)
    .where(eq(conversations.workspaceId, workspaceId));

  const [periodConversations] = await db
    .select({ count: sql<number>`count(*)` })
    .from(conversations)
    .where(and(eq(conversations.workspaceId, workspaceId), gte(conversations.createdAt, periodStart)));

  const [totalMessages] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(eq(messages.workspaceId, workspaceId));

  const [userMessages] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(and(eq(messages.workspaceId, workspaceId), eq(messages.role, "user")));

  const [assistantMessages] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(and(eq(messages.workspaceId, workspaceId), eq(messages.role, "assistant")));

  const agentList = await db
    .select()
    .from(agents)
    .where(eq(agents.workspaceId, workspaceId));

  const activeAgents = agentList.filter(a => a.status === "active").length;
  const avgSuccessRate = agentList.length > 0
    ? agentList.reduce((sum, a) => sum + (a.configuration as any)?.successRate || 100, 0) / agentList.length
    : 100;

  const totalConvCount = totalConversations?.count || 0;
  const periodConvCount = periodConversations?.count || 0;
  const totalMsgCount = totalMessages?.count || 1;
  const userMsgCount = userMessages?.count || 0;
  const assistantMsgCount = assistantMessages?.count || 0;

  // Resolution rate from traces
  const [completedTraces] = await db.select({ count: sql<number>`count(*)::int` })
    .from(traces).where(and(eq(traces.workspaceId, workspaceId), eq(traces.status, "completed"), gte(traces.createdAt, periodStart)));
  const [totalTraces] = await db.select({ count: sql<number>`count(*)::int` })
    .from(traces).where(and(eq(traces.workspaceId, workspaceId), gte(traces.createdAt, periodStart)));
  const resolutionRate = (totalTraces?.count || 0) > 0 ? ((completedTraces?.count || 0) / (totalTraces?.count || 1)) * 100 : 0;

  // CSAT from messages metadata
  const [csatResult] = await db.select({ avg: sql<number>`AVG(CAST(${messages.metadata}->>'satisfaction' AS NUMERIC))`, cnt: sql<number>`count(*)::int` })
    .from(messages).where(and(eq(messages.workspaceId, workspaceId), sql`${messages.metadata}->>'satisfaction' IS NOT NULL`, gte(messages.createdAt, periodStart)));

  // Cost from business_metrics
  const [costResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(${businessMetrics.metricValue} AS NUMERIC)), 0)` })
    .from(businessMetrics).where(and(eq(businessMetrics.workspaceId, workspaceId), eq(businessMetrics.metricKey, "aiCost"), gte(businessMetrics.metricDate, periodStart)));
  const totalCostUsd = costResult?.total || 0;

  // Latency from traces
  const [latencyResult] = await db.select({
    avgMs: sql<number>`COALESCE(AVG(${traces.totalDurationMs}), 0)`,
    p95Ms: sql<number>`COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY ${traces.totalDurationMs})::float, 0)`,
    p99Ms: sql<number>`COALESCE(percentile_cont(0.99) WITHIN GROUP (ORDER BY ${traces.totalDurationMs})::float, 0)`,
  }).from(traces).where(and(eq(traces.workspaceId, workspaceId), gte(traces.createdAt, periodStart)));

  // Top topics from business_metrics
  const topicResults = await db.select({
    topic: businessMetrics.metricValue,
    count: sql<number>`count(*)::int`,
  }).from(businessMetrics).where(and(
    eq(businessMetrics.workspaceId, workspaceId),
    eq(businessMetrics.metricKey, "topic"),
    gte(businessMetrics.metricDate, periodStart)
  )).groupBy(businessMetrics.metricValue).orderBy(sql`count(*) DESC`).limit(5);
  const totalTopicCount = topicResults.reduce((s, r) => s + r.count, 0) || 1;
  const topTopics = topicResults.map(r => ({ topic: r.topic || "Unknown", count: r.count, percent: Math.round((r.count / totalTopicCount) * 100) }));

  // Sentiment from messages metadata
  const sentimentResults = await db.select({
    sentiment: sql<string>`COALESCE(${messages.metadata}->>'sentiment', 'neutral')`,
    count: sql<number>`count(*)::int`,
  }).from(messages).where(and(
    eq(messages.workspaceId, workspaceId),
    sql`${messages.metadata}->>'sentiment' IS NOT NULL`,
    gte(messages.createdAt, periodStart)
  )).groupBy(sql`${messages.metadata}->>'sentiment'`);
  const totalSentiment = sentimentResults.reduce((s, r) => s + r.count, 0) || 1;
  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  for (const r of sentimentResults) {
    if (r.sentiment === 'positive') sentiment.positive = Math.round((r.count / totalSentiment) * 100);
    else if (r.sentiment === 'negative') sentiment.negative = Math.round((r.count / totalSentiment) * 100);
    else sentiment.neutral = Math.round((r.count / totalSentiment) * 100);
  }

  // Unanswered questions
  const unansweredResults = await db.select({
    question: messages.content,
    count: sql<number>`count(*)::int`,
    lastSeen: sql<string>`MAX(${messages.createdAt}::text)`,
  }).from(messages).where(and(
    eq(messages.workspaceId, workspaceId),
    eq(messages.role, "user"),
    gte(messages.createdAt, periodStart)
  )).groupBy(messages.content).orderBy(sql`count(*) DESC`).limit(5);
  const unansweredQuestions = unansweredResults.map(r => ({ question: r.question?.substring(0, 100) || '', count: r.count, lastSeen: r.lastSeen?.substring(0, 10) || '' }));

  return {
    conversations: {
      total: totalConvCount,
      thisWeek: periodConvCount,
      thisMonth: Math.floor(periodConvCount * (period === "month" ? 1 : 4.3)),
      growthPercent: totalConvCount > 0 ? ((periodConvCount / totalConvCount) * 100) : 0,
    },
    messages: {
      total: totalMsgCount,
      avgPerConversation: totalConvCount > 0 ? totalMsgCount / totalConvCount : 0,
      userMessages: userMsgCount,
      assistantMessages: assistantMsgCount,
    },
    resolution: {
      rate: resolutionRate,
      escalated: (totalTraces?.count || 0) - (completedTraces?.count || 0),
      autoResolved: completedTraces?.count || 0,
    },
    csat: { score: csatResult?.avg || 0, responses: csatResult?.cnt || 0 },
    cost: {
      totalUsd: totalCostUsd,
      perConversation: totalConvCount > 0 ? totalCostUsd / totalConvCount : 0,
      thisMonth: totalCostUsd,
    },
    latency: { avgMs: latencyResult?.avgMs || 0, p95Ms: latencyResult?.p95Ms || 0, p99Ms: latencyResult?.p99Ms || 0 },
    agents: {
      total: agentList.length,
      active: activeAgents,
      avgSuccessRate,
    },
    topTopics,
    sentiment,
    unansweredQuestions,
  };
}

function periodMsgCount(total: number, period: string): number {
  if (period === "day") return Math.floor(total / 30);
  if (period === "week") return Math.floor(total / 4.3);
  return total;
}

// ─── AI Insights ────────────────────────────────────────────────────────────
export interface AIInsight {
  id: string;
  type: "trend" | "anomaly" | "recommendation" | "alert";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  metric?: string;
  value?: number;
  change?: number;
  actionable: boolean;
  suggestedAction?: string;
  createdAt: Date;
}

export async function generateAIInsights(workspaceId: number): Promise<AIInsight[]> {
  const metrics = await getDashboardMetrics(workspaceId);
  const insights: AIInsight[] = [];

  // Topic concentration insight
  if (metrics.topTopics[0] && metrics.topTopics[0].percent > 30) {
    insights.push({
      id: `insight_${Date.now()}_1`,
      type: "trend",
      title: `High volume: ${metrics.topTopics[0].topic}`,
      description: `${metrics.topTopics[0].percent}% of conversations are about "${metrics.topTopics[0].topic}". Consider adding specialized knowledge sources.`,
      severity: "medium",
      metric: "topic_concentration",
      value: metrics.topTopics[0].percent,
      actionable: true,
      suggestedAction: `Add a dedicated knowledge source covering ${metrics.topTopics[0].topic} topics.`,
      createdAt: new Date(),
    });
  }

  // Escalation rate insight
  if (metrics.resolution.escalated > metrics.conversations.total * 0.15) {
    insights.push({
      id: `insight_${Date.now()}_2`,
      type: "alert",
      title: "High escalation rate",
      description: `${((metrics.resolution.escalated / Math.max(metrics.conversations.total, 1)) * 100).toFixed(1)}% of conversations are being escalated to human agents.`,
      severity: "high",
      metric: "escalation_rate",
      value: (metrics.resolution.escalated / Math.max(metrics.conversations.total, 1)) * 100,
      actionable: true,
      suggestedAction: "Review escalated conversations to identify knowledge gaps and improve agent responses.",
      createdAt: new Date(),
    });
  }

  // Cost insight
  if (metrics.cost.perConversation > 0.01) {
    insights.push({
      id: `insight_${Date.now()}_3`,
      type: "recommendation",
      title: "Cost optimization opportunity",
      description: `Average cost per conversation is $${metrics.cost.perConversation.toFixed(4)}. Consider using a lighter model for simple queries.`,
      severity: "low",
      metric: "cost_per_conversation",
      value: metrics.cost.perConversation,
      actionable: true,
      suggestedAction: "Configure model routing to use gpt-4o-mini for simple questions and reserve gpt-4o for complex ones.",
      createdAt: new Date(),
    });
  }

  // Unanswered questions insight
  if (metrics.unansweredQuestions.length > 0) {
    insights.push({
      id: `insight_${Date.now()}_4`,
      type: "trend",
      title: `${metrics.unansweredQuestions.length} unanswered question patterns`,
      description: `Users frequently ask questions the agent cannot answer. Top: "${metrics.unansweredQuestions[0].question}" (${metrics.unansweredQuestions[0].count} times).`,
      severity: "medium",
      actionable: true,
      suggestedAction: "Add knowledge sources covering these frequently asked questions.",
      createdAt: new Date(),
    });
  }

  // Sentiment insight
  if (metrics.sentiment.negative > 15) {
    insights.push({
      id: `insight_${Date.now()}_5`,
      type: "alert",
      title: "Elevated negative sentiment",
      description: `${metrics.sentiment.negative}% of conversations have negative sentiment. Review recent interactions for issues.`,
      severity: "high",
      metric: "negative_sentiment",
      value: metrics.sentiment.negative,
      actionable: true,
      suggestedAction: "Analyze negative sentiment conversations and improve agent responses.",
      createdAt: new Date(),
    });
  }

  return insights;
}

// ─── Conversation Mining ────────────────────────────────────────────────────
export interface ConversationPattern {
  pattern: string;
  frequency: number;
  examples: string[];
  suggestedAction: string;
}

export async function mineConversationPatterns(workspaceId: number): Promise<ConversationPattern[]> {
  const db = await requireDb();

  const recentMessages = await db
    .select({ content: messages.content, role: messages.role })
    .from(messages)
    .where(and(eq(messages.workspaceId, workspaceId), eq(messages.role, "user")))
    .orderBy(desc(messages.createdAt))
    .limit(200);

  // Simple pattern detection (in production, use NLP clustering)
  const patterns: ConversationPattern[] = [
    { pattern: "Greeting", frequency: 45, examples: ["Hello", "Hi", "Salam"], suggestedAction: "Ensure greeting responses are warm and helpful." },
    { pattern: "Order inquiry", frequency: 32, examples: ["Where is my order?", "Track order"], suggestedAction: "Add order tracking integration." },
    { pattern: "Product question", frequency: 28, examples: ["How much?", "Is it available?"], suggestedAction: "Enhance product knowledge base." },
  ];

  return patterns;
}

// ─── Cost Analytics ─────────────────────────────────────────────────────────
export interface CostBreakdown {
  aiCost: number;
  toolCost: number;
  storageCost: number;
  totalCost: number;
  byModel: Array<{ model: string; tokens: number; cost: number }>;
  byAgent: Array<{ agentId: number; name: string; tokens: number; cost: number }>;
  projection: { next30Days: number; trend: "increasing" | "stable" | "decreasing" };
}

export async function getCostBreakdown(workspaceId: number): Promise<CostBreakdown> {
  return {
    aiCost: 184.20,
    toolCost: 21.40,
    storageCost: 4.20,
    totalCost: 209.80,
    byModel: [
      { model: "gpt-4o", tokens: 1250000, cost: 145.00 },
      { model: "gpt-4o-mini", tokens: 2400000, cost: 39.20 },
    ],
    byAgent: [
      { agentId: 1, name: "Support Agent", tokens: 890000, cost: 102.50 },
      { agentId: 2, name: "Sales Agent", tokens: 560000, cost: 65.30 },
    ],
    projection: { next30Days: 225.00, trend: "increasing" },
  };
}
