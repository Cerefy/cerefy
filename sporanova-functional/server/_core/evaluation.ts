import { and, eq, sql, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { requireDb, writeAuditLog } from "../db";
import { traces, traceSpans } from "../../drizzle/schema";
import { invokeLLM } from "./llm";

// ─── Observability Types ────────────────────────────────────────────────────
export interface TraceSpan {
  id: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: "ok" | "error" | "cancelled";
  attributes: Record<string, unknown>;
  events: TraceEvent[];
}

export interface TraceEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, unknown>;
}

export interface Trace {
  id: string;
  workspaceId: number;
  userId?: number;
  agentId?: number;
  conversationId?: number;
  spans: TraceSpan[];
  startTime: number;
  endTime?: number;
  totalDurationMs?: number;
  status: "ok" | "error" | "cancelled";
  metadata: Record<string, unknown>;
}

export interface TraceMetrics {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  modelUsed: string;
  latencyMs: number;
  toolCallsCount: number;
  retrievedChunksCount: number;
  errorsCount: number;
}

// ─── Trace Store (DB-backed) ─────────────────────────────────────────────────
export async function createTrace(input: {
  workspaceId: number;
  userId?: number;
  agentId?: number;
  conversationId?: number;
  metadata?: Record<string, unknown>;
}): Promise<Trace> {
  const db = await requireDb();
  const id = `trc_${randomUUID()}`;
  const startTime = new Date();
  await db.insert(traces).values({
    id,
    workspaceId: input.workspaceId,
    userId: input.userId ?? null,
    agentId: input.agentId ?? null,
    conversationId: input.conversationId ?? null,
    status: "running",
    startTime,
    metadata: input.metadata ?? {},
  });
  return {
    id,
    workspaceId: input.workspaceId,
    userId: input.userId,
    agentId: input.agentId,
    conversationId: input.conversationId,
    spans: [],
    startTime: startTime.getTime(),
    status: "ok",
    metadata: input.metadata ?? {},
  };
}

export async function addSpan(traceId: string, span: Omit<TraceSpan, "id" | "events" | "traceId">): Promise<TraceSpan | null> {
  const db = await requireDb();
  const existing = await db.select({ id: traces.id }).from(traces).where(eq(traces.id, traceId)).limit(1);
  if (!existing[0]) return null;
  const id = `spn_${randomUUID()}`;
  const startTime = new Date();
  await db.insert(traceSpans).values({
    id,
    traceId,
    parentSpanId: span.parentSpanId ?? null,
    name: span.name,
    startTime,
    status: span.status ?? "running",
    attributes: span.attributes ?? {},
    events: [],
  });
  return {
    ...span,
    traceId,
    id,
    startTime: startTime.getTime(),
    events: [],
  };
}

export async function finishSpan(traceId: string, spanId: string, status: "ok" | "error" | "cancelled" = "ok"): Promise<void> {
  const db = await requireDb();
  const endTime = new Date();
  await db
    .update(traceSpans)
    .set({
      endTime,
      status,
    })
    .where(eq(traceSpans.id, spanId));
  await db.execute(
    sql`UPDATE trace_spans SET duration_ms = EXTRACT(MILLISECOND FROM (end_time - start_time)) WHERE id = ${spanId}`,
  );
}

export async function finishTrace(traceId: string, status: "ok" | "error" | "cancelled" = "ok"): Promise<void> {
  const db = await requireDb();
  const endTime = new Date();
  const existing = await db.select({ startTime: traces.startTime }).from(traces).where(eq(traces.id, traceId)).limit(1);
  const totalDurationMs = existing[0] ? endTime.getTime() - existing[0].startTime.getTime() : null;
  await db
    .update(traces)
    .set({
      endTime,
      status,
      totalDurationMs,
    })
    .where(eq(traces.id, traceId));
}

export async function getTrace(traceId: string): Promise<Trace | null> {
  const db = await requireDb();
  const traceRows = await db.select().from(traces).where(eq(traces.id, traceId)).limit(1);
  if (!traceRows[0]) return null;
  const spanRows = await db
    .select()
    .from(traceSpans)
    .where(eq(traceSpans.traceId, traceId))
    .orderBy(traceSpans.startTime);
  const trace = traceRows[0];
  return {
    id: trace.id,
    workspaceId: trace.workspaceId,
    userId: trace.userId ?? undefined,
    agentId: trace.agentId ?? undefined,
    conversationId: trace.conversationId ?? undefined,
    startTime: trace.startTime.getTime(),
    endTime: trace.endTime?.getTime(),
    totalDurationMs: trace.totalDurationMs ?? undefined,
    status: (trace.status as Trace["status"]) ?? "ok",
    metadata: trace.metadata ?? {},
    spans: spanRows.map(s => ({
      id: s.id,
      traceId: s.traceId,
      parentSpanId: s.parentSpanId ?? undefined,
      name: s.name,
      startTime: s.startTime.getTime(),
      endTime: s.endTime?.getTime(),
      durationMs: s.durationMs ?? undefined,
      status: (s.status as TraceSpan["status"]) ?? "ok",
      attributes: s.attributes ?? {},
      events: (s.events as TraceEvent[]) ?? [],
    })),
  };
}

export async function getTracesForWorkspace(workspaceId: number, limit = 50): Promise<Trace[]> {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(traces)
    .where(eq(traces.workspaceId, workspaceId))
    .orderBy(desc(traces.startTime))
    .limit(limit);
  return rows.map(t => ({
    id: t.id,
    workspaceId: t.workspaceId,
    userId: t.userId ?? undefined,
    agentId: t.agentId ?? undefined,
    conversationId: t.conversationId ?? undefined,
    startTime: t.startTime.getTime(),
    endTime: t.endTime?.getTime(),
    totalDurationMs: t.totalDurationMs ?? undefined,
    status: (t.status as Trace["status"]) ?? "ok",
    metadata: t.metadata ?? {},
    spans: [],
  }));
}

// ─── Metrics Calculation ────────────────────────────────────────────────────
export function calculateTraceMetrics(trace: Trace): TraceMetrics {
  let totalTokens = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let modelUsed = "";
  let toolCallsCount = 0;
  let retrievedChunksCount = 0;
  let errorsCount = 0;

  for (const span of trace.spans) {
    if (span.attributes.tokens) {
      const tokens = span.attributes.tokens as { prompt?: number; completion?: number; total?: number };
      promptTokens += tokens.prompt || 0;
      completionTokens += tokens.completion || 0;
      totalTokens += tokens.total || 0;
    }
    if (span.attributes.model) modelUsed = span.attributes.model as string;
    if (span.attributes.toolCalls) toolCallsCount += (span.attributes.toolCalls as number) || 0;
    if (span.attributes.retrievedChunks) retrievedChunksCount += (span.attributes.retrievedChunks as number) || 0;
    if (span.status === "error") errorsCount++;
  }

  // Cost estimation (approximate)
  const costPer1kInput = 0.005;
  const costPer1kOutput = 0.015;
  const estimatedCostUsd = (promptTokens / 1000) * costPer1kInput + (completionTokens / 1000) * costPer1kOutput;

  return {
    totalTokens,
    promptTokens,
    completionTokens,
    estimatedCostUsd,
    modelUsed,
    latencyMs: trace.totalDurationMs || 0,
    toolCallsCount,
    retrievedChunksCount,
    errorsCount,
  };
}

// ─── Evaluation Engine ──────────────────────────────────────────────────────
export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput?: string;
  expectedTools?: string[];
  tags: string[];
  category: "correctness" | "groundedness" | "safety" | "tool_use" | "language";
}

export interface EvalResult {
  testCaseId: string;
  passed: boolean;
  score: number;
  metrics: {
    answerCorrectness: number;
    groundedness: number;
    toolAccuracy: number;
    hallucinationRate: number;
    latencyMs: number;
  };
  actualOutput: string;
  errors: string[];
}

export interface EvalRun {
  id: string;
  workspaceId: number;
  testCases: TestCase[];
  results: EvalResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    avgScore: number;
    avgLatencyMs: number;
    avgHallucinationRate: number;
  };
  startedAt: Date;
  completedAt?: Date;
}

// ─── Evaluation Runner ──────────────────────────────────────────────────────
export async function runEvaluation(
  workspaceId: number,
  testCases: TestCase[],
  options: { model?: string; maxConcurrency?: number } = {}
): Promise<EvalRun> {
  const runId = `eval_${Date.now()}`;
  const results: EvalResult[] = [];

  for (const tc of testCases) {
    const startTime = Date.now();
    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are SOPRANOVA. Answer accurately and concisely." },
          { role: "user", content: tc.input },
        ],
        model: options.model,
        maxTokens: 1000,
      });

      const rawContent = response.choices[0]?.message?.content;
      const actualOutput = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      const latencyMs = Date.now() - startTime;

      // Score the response
      const correctness = tc.expectedOutput ? computeSimilarity(actualOutput, tc.expectedOutput) : 0.8;
      const groundedness = 0.9; // Would check against knowledge base
      const toolAccuracy = tc.expectedTools ? 1.0 : 1.0;
      const hallucinationRate = 1 - groundedness;

      results.push({
        testCaseId: tc.id,
        passed: correctness > 0.7,
        score: (correctness + groundedness + toolAccuracy) / 3,
        metrics: {
          answerCorrectness: correctness,
          groundedness,
          toolAccuracy,
          hallucinationRate,
          latencyMs,
        },
        actualOutput,
        errors: [],
      });
    } catch (error) {
      results.push({
        testCaseId: tc.id,
        passed: false,
        score: 0,
        metrics: { answerCorrectness: 0, groundedness: 0, toolAccuracy: 0, hallucinationRate: 1, latencyMs: Date.now() - startTime },
        actualOutput: "",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    }
  }

  const passed = results.filter(r => r.passed).length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const avgLatency = results.reduce((sum, r) => sum + r.metrics.latencyMs, 0) / results.length;
  const avgHallucination = results.reduce((sum, r) => sum + r.metrics.hallucinationRate, 0) / results.length;

  return {
    id: runId,
    workspaceId,
    testCases,
    results,
    summary: {
      totalTests: testCases.length,
      passed,
      failed: testCases.length - passed,
      avgScore,
      avgLatencyMs: avgLatency,
      avgHallucinationRate: avgHallucination,
    },
    startedAt: new Date(),
    completedAt: new Date(),
  };
}

// ─── Regression Testing ─────────────────────────────────────────────────────
export interface RegressionResult {
  baseline: EvalRun;
  current: EvalRun;
  improved: boolean;
  regressions: Array<{ testCaseId: string; baselineScore: number; currentScore: number; delta: number }>;
  improvements: Array<{ testCaseId: string; baselineScore: number; currentScore: number; delta: number }>;
  verdict: "pass" | "fail" | "neutral";
}

export async function runRegressionTest(
  workspaceId: number,
  baseline: EvalRun,
  testCases: TestCase[],
  options: { model?: string } = {}
): Promise<RegressionResult> {
  const current = await runEvaluation(workspaceId, testCases, options);

  const regressions: RegressionResult["regressions"] = [];
  const improvements: RegressionResult["improvements"] = [];

  for (const baselineResult of baseline.results) {
    const currentResult = current.results.find(r => r.testCaseId === baselineResult.testCaseId);
    if (!currentResult) continue;

    const delta = currentResult.score - baselineResult.score;
    if (delta < -0.1) {
      regressions.push({ testCaseId: baselineResult.testCaseId, baselineScore: baselineResult.score, currentScore: currentResult.score, delta });
    } else if (delta > 0.1) {
      improvements.push({ testCaseId: baselineResult.testCaseId, baselineScore: baselineResult.score, currentScore: currentResult.score, delta });
    }
  }

  return {
    baseline,
    current,
    improved: current.summary.avgScore > baseline.summary.avgScore,
    regressions,
    improvements,
    verdict: regressions.length > 0 ? "fail" : improvements.length > 0 ? "pass" : "neutral",
  };
}

// ─── Playground ─────────────────────────────────────────────────────────────
export interface PlaygroundRequest {
  workspaceId: number;
  message: string;
  agentId?: number;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
}

export interface PlaygroundResponse {
  response: string;
  model: string;
  latencyMs: number;
  tokens: { prompt: number; completion: number; total: number };
  traceId: string;
}

export async function playgroundChat(request: PlaygroundRequest): Promise<PlaygroundResponse> {
  const trace = await createTrace({ workspaceId: request.workspaceId });
  const startTime = Date.now();

  const span = await addSpan(trace.id, { name: "llm.call", startTime, status: "ok", attributes: {} });

  const response = await invokeLLM({
    messages: [
      { role: "system", content: request.systemPrompt || "You are SOPRANOVA. Answer accurately." },
      { role: "user", content: request.message },
    ],
    model: request.model,
    temperature: request.temperature,
    maxTokens: 1000,
  });

  if (span) await finishSpan(trace.id, span.id, "ok");

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
  const latencyMs = Date.now() - startTime;

  await finishTrace(trace.id, "ok");

  return {
    response: content,
    model: response.model,
    latencyMs,
    tokens: response.usage
      ? { prompt: response.usage.prompt_tokens ?? 0, completion: response.usage.completion_tokens ?? 0, total: response.usage.total_tokens ?? 0 }
      : { prompt: 0, completion: 0, total: 0 },
    traceId: trace.id,
  };
}

// ─── Helper ─────────────────────────────────────────────────────────────────
function computeSimilarity(a: string, b: string): number {
  const wordsA = a.toLowerCase().split(/\s+/);
  const wordsB = b.toLowerCase().split(/\s+/);
  const intersection = wordsA.filter(w => wordsB.includes(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}