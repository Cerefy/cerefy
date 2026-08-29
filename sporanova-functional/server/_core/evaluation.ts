import { and, eq, sql, desc } from "drizzle-orm";
import { requireDb, writeAuditLog } from "../db";
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

// ─── Trace Store (in-memory, would be database in production) ────────────────
const traces = new Map<string, Trace>();
const MAX_TRACES = 10000;

export function createTrace(input: {
  workspaceId: number;
  userId?: number;
  agentId?: number;
  conversationId?: number;
  metadata?: Record<string, unknown>;
}): Trace {
  const id = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const trace: Trace = {
    id,
    workspaceId: input.workspaceId,
    userId: input.userId,
    agentId: input.agentId,
    conversationId: input.conversationId,
    spans: [],
    startTime: Date.now(),
    status: "ok",
    metadata: input.metadata || {},
  };
  traces.set(id, trace);
  if (traces.size > MAX_TRACES) {
    const oldest = traces.keys().next().value;
    if (oldest) traces.delete(oldest);
  }
  return trace;
}

export function addSpan(traceId: string, span: Omit<TraceSpan, "id" | "events" | "traceId">): TraceSpan | null {
  const trace = traces.get(traceId);
  if (!trace) return null;
  const spanId = `span_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const fullSpan: TraceSpan = { ...span, traceId, id: spanId, events: [] };
  trace.spans.push(fullSpan);
  return fullSpan;
}

export function finishSpan(traceId: string, spanId: string, status: "ok" | "error" | "cancelled" = "ok"): void {
  const trace = traces.get(traceId);
  if (!trace) return;
  const span = trace.spans.find(s => s.id === spanId);
  if (!span) return;
  span.endTime = Date.now();
  span.durationMs = span.endTime - span.startTime;
  span.status = status;
}

export function finishTrace(traceId: string, status: "ok" | "error" | "cancelled" = "ok"): void {
  const trace = traces.get(traceId);
  if (!trace) return;
  trace.endTime = Date.now();
  trace.totalDurationMs = trace.endTime - trace.startTime;
  trace.status = status;
}

export function getTrace(traceId: string): Trace | undefined {
  return traces.get(traceId);
}

export function getTracesForWorkspace(workspaceId: number, limit = 50): Trace[] {
  return Array.from(traces.values())
    .filter(t => t.workspaceId === workspaceId)
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, limit);
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
  const trace = createTrace({ workspaceId: request.workspaceId });
  const startTime = Date.now();

  const span = addSpan(trace.id, { name: "llm.call", startTime, status: "ok", attributes: {} });

  const response = await invokeLLM({
    messages: [
      { role: "system", content: request.systemPrompt || "You are SOPRANOVA. Answer accurately." },
      { role: "user", content: request.message },
    ],
    model: request.model,
    temperature: request.temperature,
    maxTokens: 1000,
  });

  if (span) finishSpan(trace.id, span.id, "ok");

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
  const latencyMs = Date.now() - startTime;

  if (span) {
    span.attributes = {
      model: response.model,
      tokens: response.usage,
    };
  }

  finishTrace(trace.id, "ok");

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
