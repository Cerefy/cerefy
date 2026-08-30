import { and, asc, eq, isNull } from "drizzle-orm";
import {
  notifications,
  users,
  workflowEdges,
  workflowNodes,
  workflowRuns,
  workflows,
  type workflows as workflowsTable,
  type workflowNodes as workflowNodesTable,
  type workflowEdges as workflowEdgesTable,
  type workflowRuns as workflowRunsTable,
} from "../../drizzle/schema";
import { requireDb, writeAuditLog } from "../db";
import { executeTool, type ToolContext, type ToolResult } from "./toolSystem";

export type NodeType =
  | "start"
  | "end"
  | "action"
  | "condition"
  | "transform"
  | "escalate"
  | "delay"
  | "parallel"
  | "wait";

export interface WorkflowNode {
  id: number;
  workflowId: number;
  nodeKey: string;
  nodeType: NodeType;
  label: string;
  configuration: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: number;
  workflowId: number;
  fromNodeId: number;
  toNodeId: number;
  condition?: string | null;
  priority: number;
}

export type Workflow = typeof workflowsTable.$inferSelect;

export interface NodeExecutionResult {
  success: boolean;
  output: Record<string, unknown>;
  nextNodeKey?: string;
  errorMessage?: string;
}

export interface WorkflowRunResult {
  runId: number;
  status: "running" | "completed" | "failed";
  output: Record<string, unknown>;
  errorMessage?: string;
}

const MAX_GRAPH_STEPS = 200;

const SUPPORTED_NODE_TYPES: ReadonlySet<NodeType> = new Set<NodeType>([
  "start",
  "end",
  "action",
  "condition",
  "transform",
  "escalate",
  "delay",
  "parallel",
  "wait",
]);

const DB_NODE_TYPE_MAP: Record<string, NodeType> = {
  trigger: "start",
  intelligence: "transform",
  condition: "condition",
  action: "action",
  start: "start",
  end: "end",
  transform: "transform",
  escalate: "escalate",
  delay: "delay",
  parallel: "parallel",
  wait: "wait",
};

function normalizeNodeType(value: string): NodeType {
  return DB_NODE_TYPE_MAP[value] ?? "action";
}

function asNode(row: typeof workflowNodesTable.$inferSelect): WorkflowNode {
  return {
    id: row.id,
    workflowId: row.workflowId,
    nodeKey: row.nodeKey,
    nodeType: normalizeNodeType(row.nodeType),
    label: row.label,
    configuration: (row.configuration ?? {}) as Record<string, unknown>,
  };
}

function asEdge(row: typeof workflowEdgesTable.$inferSelect): WorkflowEdge {
  return {
    id: row.id,
    workflowId: row.workflowId,
    fromNodeId: row.fromNodeId,
    toNodeId: row.toNodeId,
    condition: row.condition ?? undefined,
    priority: row.priority ?? 0,
  };
}

function parseDuration(duration: string | undefined): number {
  if (!duration) return 0;
  const match = String(duration).trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const factor = unit === "s" ? 1000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return value * factor;
}

function resolveTemplate(value: unknown, context: Record<string, unknown>): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed.startsWith("{{") && trimmed.endsWith("}}")) {
    const path = trimmed.slice(2, -2).trim();
    return getByPath(context, path);
  }
  return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const resolved = getByPath(context, path);
    return resolved === undefined || resolved === null ? "" : String(resolved);
  });
}

function getByPath(source: Record<string, unknown>, path: string): unknown {
  if (!path) return undefined;
  const segments = path.split(".");
  let current: unknown = source;
  for (const segment of segments) {
    if (current === undefined || current === null) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  return null;
}

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true" || lowered === "1" || lowered === "yes") return true;
    if (lowered === "false" || lowered === "0" || lowered === "no") return false;
  }
  if (typeof value === "number") return value !== 0;
  return Boolean(value);
}

function compareValues(left: unknown, operator: string, right: unknown): boolean {
  switch (operator) {
    case "eq":
    case "==":
    case "===":
      return left === right || String(left) === String(right);
    case "neq":
    case "!=":
    case "!==":
      return left !== right && String(left) !== String(right);
    case "gt":
    case ">": {
      const a = toNumber(left);
      const b = toNumber(right);
      if (a !== null && b !== null) return a > b;
      return String(left ?? "") > String(right ?? "");
    }
    case "gte":
    case ">=": {
      const a = toNumber(left);
      const b = toNumber(right);
      if (a !== null && b !== null) return a >= b;
      return String(left ?? "") >= String(right ?? "");
    }
    case "lt":
    case "<": {
      const a = toNumber(left);
      const b = toNumber(right);
      if (a !== null && b !== null) return a < b;
      return String(left ?? "") < String(right ?? "");
    }
    case "lte":
    case "<=": {
      const a = toNumber(left);
      const b = toNumber(right);
      if (a !== null && b !== null) return a <= b;
      return String(left ?? "") <= String(right ?? "");
    }
    case "contains": {
      if (Array.isArray(left)) return left.map(item => String(item)).includes(String(right));
      if (left === null || left === undefined) return false;
      return String(left).includes(String(right));
    }
    case "starts_with": {
      if (left === null || left === undefined) return false;
      return String(left).startsWith(String(right));
    }
    case "ends_with": {
      if (left === null || left === undefined) return false;
      return String(left).endsWith(String(right));
    }
    case "in": {
      const candidates = Array.isArray(right) ? right : [right];
      return candidates.some(item => String(item) === String(left));
    }
    case "not_in": {
      const candidates = Array.isArray(right) ? right : [right];
      return !candidates.some(item => String(item) === String(left));
    }
    case "exists":
      return left !== undefined && left !== null;
    case "is_null":
    case "is_empty":
      return left === undefined || left === null || left === "";
    case "truthy":
      return toBool(left);
    case "falsy":
      return !toBool(left);
    default:
      return false;
  }
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function tokenizeExpression(expression: string): string[] {
  const tokens: string[] = [];
  let buffer = "";
  let quote: string | null = null;
  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i];
    if (quote) {
      buffer += char;
      if (char === quote) {
        tokens.push(buffer);
        buffer = "";
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      if (buffer) {
        tokens.push(buffer);
        buffer = "";
      }
      quote = char;
      buffer = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (buffer) {
        tokens.push(buffer);
        buffer = "";
      }
      continue;
    }
    if (char === "(" || char === ")") {
      if (buffer) {
        tokens.push(buffer);
        buffer = "";
      }
      tokens.push(char);
      continue;
    }
    buffer += char;
  }
  if (buffer) tokens.push(buffer);
  return tokens;
}

function parseLiteral(token: string): unknown {
  const trimmed = token.trim();
  if (!trimmed) return "";
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && /^-?\d+(\.\d+)?$/.test(trimmed)) return asNumber;
  return trimmed;
}

export function evaluateEdgeCondition(condition: string | undefined | null, context: Record<string, unknown>): boolean {
  if (!condition || !condition.trim()) return true;
  const expression = condition.trim();
  const tokens = tokenizeExpression(expression);
  if (!tokens.length) return true;

  if (tokens.length === 1) {
    const resolved = resolveTemplate(tokens[0], context);
    return toBool(resolved);
  }

  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    if (tokens[i] === "==" || tokens[i] === "===" || tokens[i] === "=") {
      const left = resolveTemplate(tokens[i - 1], context);
      const right = parseLiteral(tokens[i + 1] ?? "");
      return compareValues(left, "eq", right);
    }
    if (tokens[i] === "!=" || tokens[i] === "!==") {
      const left = resolveTemplate(tokens[i - 1], context);
      const right = parseLiteral(tokens[i + 1] ?? "");
      return compareValues(left, "neq", right);
    }
    if (tokens[i] === "contains") {
      const left = resolveTemplate(tokens[i - 1], context);
      const right = parseLiteral(tokens[i + 1] ?? "");
      return compareValues(left, "contains", right);
    }
  }

  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = tokens[i];
    if (token === ">" || token === ">=" || token === "<" || token === "<=") {
      const left = resolveTemplate(tokens[i - 1], context);
      const right = parseLiteral(tokens[i + 1] ?? "");
      return compareValues(left, token, right);
    }
  }

  if (tokens.length >= 3) {
    const operator = tokens[1].toLowerCase();
    const left = resolveTemplate(tokens[0], context);
    const right = parseLiteral(tokens.slice(2).join(" "));
    if (operator in {
      eq: 0,
      neq: 0,
      gt: 0,
      gte: 0,
      lt: 0,
      lte: 0,
      contains: 0,
      starts_with: 0,
      ends_with: 0,
      exists: 0,
      truthy: 0,
      falsy: 0,
    }) {
      return compareValues(left, operator, right);
    }
  }

  return Boolean(resolveTemplate(expression, context));
}

function isConditionTrue(value: string | undefined | null): boolean {
  if (!value) return true;
  return evaluateEdgeCondition(value, {});
}

function findNodeById(nodes: WorkflowNode[], id: number): WorkflowNode | undefined {
  return nodes.find(node => node.id === id);
}

function pickStartNode(nodes: WorkflowNode[]): WorkflowNode | undefined {
  return (
    nodes.find(node => node.nodeType === "start") ??
    nodes.find(node => node.nodeKey.toLowerCase().includes("start"))
  );
}

export function findNextNode(
  currentNodeId: number,
  edges: WorkflowEdge[],
  context: Record<string, unknown>
): WorkflowEdge | null {
  const candidates = edges
    .filter(edge => edge.fromNodeId === currentNodeId)
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  for (const edge of candidates) {
    if (isConditionTrue(edge.condition ?? null) && evaluateEdgeCondition(edge.condition ?? null, context)) {
      return edge;
    }
  }
  return candidates[0] ?? null;
}

function substituteParams(params: Record<string, unknown>, context: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = substituteParams(value as Record<string, unknown>, context);
    } else {
      result[key] = resolveTemplate(value, context);
    }
  }
  return result;
}

async function applyTransform(
  node: WorkflowNode,
  context: Record<string, unknown>
): Promise<{ success: boolean; output: Record<string, unknown>; errorMessage?: string }> {
  const config = node.configuration ?? {};
  const field = typeof config.field === "string" ? config.field : null;
  const operation = typeof config.operation === "string" ? config.operation : "set";
  if (!field) {
    return { success: false, output: {}, errorMessage: "Transform node is missing a 'field' configuration." };
  }
  const resolvedValue = resolveTemplate(config.value, context);
  if (operation === "set") {
    context[field] = resolvedValue;
  } else if (operation === "append") {
    const current = context[field];
    if (Array.isArray(current)) current.push(resolvedValue);
    else if (current === undefined || current === null) context[field] = [resolvedValue];
    else context[field] = [current, resolvedValue];
  } else if (operation === "increment") {
    const current = toNumber(context[field]) ?? 0;
    const increment = toNumber(resolvedValue) ?? 1;
    context[field] = current + increment;
  } else {
    return { success: false, output: {}, errorMessage: `Unsupported transform operation: ${operation}` };
  }
  return { success: true, output: { [field]: context[field] } };
}

async function applyCondition(
  node: WorkflowNode,
  context: Record<string, unknown>
): Promise<{ success: boolean; output: Record<string, unknown>; errorMessage?: string; branch?: boolean }> {
  const config = node.configuration ?? {};
  const field = typeof config.field === "string" ? config.field : null;
  const operator = typeof config.operator === "string" ? config.operator : "eq";
  if (!field) {
    return { success: false, output: {}, errorMessage: "Condition node is missing a 'field' configuration." };
  }
  const left = getByPath(context, field);
  const right = resolveTemplate(config.value, context);
  const result = compareValues(left, operator, right);
  context.lastConditionResult = result;
  return { success: true, output: { field, operator, result, branch: result }, branch: result };
}

async function applyEscalate(
  node: WorkflowNode,
  context: Record<string, unknown>,
  workspaceId: number,
  triggeredBy: number
): Promise<{ success: boolean; output: Record<string, unknown>; errorMessage?: string }> {
  const config = node.configuration ?? {};
  const reason = String(config.reason ?? "Workflow requested human escalation.");
  const priority = String(config.priority ?? "medium");
  const channel = String(config.channel ?? "inbox");
  const recipientUserId = Number(config.recipientUserId ?? triggeredBy);

  try {
    const db = await requireDb();
    await db.insert(notifications).values({
      workspaceId,
      recipientUserId,
      type: "workflow_escalation",
      title: `Escalation: ${String(config.title ?? node.label).slice(0, 255)}`,
      content: reason.slice(0, 4000),
      relatedEntityType: "workflow",
      relatedEntityId: String(node.workflowId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record escalation";
    return { success: false, output: {}, errorMessage: message };
  }

  context.escalation = { reason, priority, channel, recipientUserId, at: new Date().toISOString() };
  return { success: true, output: { escalation: context.escalation } };
}

async function applyDelay(node: WorkflowNode): Promise<{ success: boolean; output: Record<string, unknown>; errorMessage?: string }> {
  const config = node.configuration ?? {};
  const milliseconds = parseDuration(typeof config.duration === "string" ? config.duration : "0s");
  if (milliseconds > 0) {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
  }
  return { success: true, output: { duration: config.duration, waitedMs: milliseconds } };
}

async function applyAction(
  node: WorkflowNode,
  context: Record<string, unknown>,
  workspaceId: number,
  triggeredBy: number
): Promise<{ success: boolean; output: Record<string, unknown>; errorMessage?: string }> {
  const config = node.configuration ?? {};
  const actionType = String(config.actionType ?? "");

  if (actionType === "create_notification") {
    const recipientUserId = Number(config.recipientUserId ?? triggeredBy);
    const title = String(config.title ?? node.label).slice(0, 255);
    const content = String(config.content ?? "");
    try {
      const db = await requireDb();
      await db.insert(notifications).values({
        workspaceId,
        recipientUserId,
        type: String(config.type ?? "workflow"),
        title,
        content,
        relatedEntityType: "workflow",
        relatedEntityId: String(node.workflowId),
      });
      context.lastNotification = { recipientUserId, title, content };
      return { success: true, output: { notification: { recipientUserId, title } } };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create notification";
      return { success: false, output: {}, errorMessage: message };
    }
  }

  if (!actionType) {
    return { success: false, output: {}, errorMessage: "Action node is missing 'actionType'." };
  }

  const toolContext: ToolContext = {
    workspaceId,
    userId: triggeredBy,
  };
  const args = substituteParams((config.params as Record<string, unknown> | undefined) ?? {}, context);
  const result: ToolResult = await executeTool(actionType, args, toolContext);
  if (result.success && result.data !== undefined) {
    context.lastActionResult = result.data;
    if (result.data && typeof result.data === "object" && !Array.isArray(result.data)) {
      Object.assign(context, result.data as Record<string, unknown>);
    }
  } else {
    context.lastActionError = result.error;
  }
  return {
    success: result.success,
    output: (result.data && typeof result.data === "object" && !Array.isArray(result.data)
      ? (result.data as Record<string, unknown>)
      : { result: result.data ?? null }),
    errorMessage: result.success ? undefined : result.error ?? "Tool execution failed",
  };
}

export async function executeNode(
  node: WorkflowNode,
  context: Record<string, unknown>,
  workspaceId: number,
  triggeredBy: number
): Promise<NodeExecutionResult> {
  try {
    switch (node.nodeType) {
      case "start":
        return { success: true, output: { startedAt: new Date().toISOString() } };
      case "end":
        return { success: true, output: { completedAt: new Date().toISOString() } };
      case "action":
        return await applyAction(node, context, workspaceId, triggeredBy);
      case "condition":
        return (await applyCondition(node, context)) as NodeExecutionResult;
      case "transform":
        return await applyTransform(node, context);
      case "escalate":
        return await applyEscalate(node, context, workspaceId, triggeredBy);
      case "delay":
        return await applyDelay(node);
      case "parallel":
        return { success: true, output: { branches: (node.configuration?.branches as string[] | undefined) ?? [] } };
      case "wait":
        return {
          success: true,
          output: {
            event: node.configuration?.event ?? null,
            timeoutSeconds: Number(node.configuration?.timeoutSeconds ?? 0),
            status: "waiting",
          },
        };
      default:
        return { success: false, output: {}, errorMessage: `Unsupported node type: ${node.nodeType}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Node execution failed";
    return { success: false, output: {}, errorMessage: message };
  }
}

export async function loadWorkflow(workflowId: number): Promise<{
  workflow: Workflow;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}> {
  const db = await requireDb();
  const workflow = (
    await db.select().from(workflows).where(and(eq(workflows.id, workflowId), isNull(workflows.deletedAt))).limit(1)
  )[0];
  if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

  const nodeRows = await db
    .select()
    .from(workflowNodes)
    .where(eq(workflowNodes.workflowId, workflowId))
    .orderBy(asc(workflowNodes.sortOrder));

  const edgeRows = await db
    .select()
    .from(workflowEdges)
    .where(eq(workflowEdges.workflowId, workflowId))
    .orderBy(asc(workflowEdges.priority));

  return {
    workflow,
    nodes: nodeRows.map(asNode),
    edges: edgeRows.map(asEdge),
  };
}

export interface ValidationReport {
  valid: boolean;
  nodeCount: number;
  edgeCount: number;
  hasStart: boolean;
  hasEnd: boolean;
  orphanNodes: string[];
  unsupportedNodes: string[];
  errors: string[];
}

export function validateWorkflowDefinition(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationReport {
  const errors: string[] = [];
  const hasStart = nodes.some(node => node.nodeType === "start");
  const hasEnd = nodes.some(node => node.nodeType === "end");
  const unsupportedNodes = nodes
    .filter(node => !SUPPORTED_NODE_TYPES.has(node.nodeType))
    .map(node => node.nodeKey);

  if (!hasStart) errors.push("Workflow must contain a 'start' node.");
  if (!hasEnd) errors.push("Workflow must contain at least one 'end' node.");

  const reachable = new Set<number>();
  const startNode = nodes.find(node => node.nodeType === "start");
  if (startNode) {
    const stack: number[] = [startNode.id];
    while (stack.length) {
      const current = stack.pop()!;
      if (reachable.has(current)) continue;
      reachable.add(current);
      for (const edge of edges) {
        if (edge.fromNodeId === current) stack.push(edge.toNodeId);
      }
    }
  }
  const orphanNodes = nodes.filter(node => !reachable.has(node.id) && node.nodeType !== "end").map(node => node.nodeKey);
  if (orphanNodes.length) errors.push(`Orphan nodes detected: ${orphanNodes.join(", ")}`);

  return {
    valid: errors.length === 0,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    hasStart,
    hasEnd,
    orphanNodes,
    unsupportedNodes,
    errors,
  };
}

export async function executeWorkflow(
  workflowId: number,
  initialContext: Record<string, unknown>,
  triggerType: "manual" | "agent_request" | "event" | "schedule",
  triggeredBy: number,
  workspaceId: number,
  options: { runId?: number } = {}
): Promise<WorkflowRunResult> {
  const db = await requireDb();
  let runRow: typeof workflowRunsTable.$inferSelect | undefined;

  if (options.runId) {
    runRow = (await db.select().from(workflowRuns).where(eq(workflowRuns.id, options.runId)).limit(1))[0];
  }

  if (!runRow) {
    const dbTriggerType = (["manual", "event", "schedule"] as const).includes(triggerType as "manual" | "event" | "schedule")
      ? (triggerType as "manual" | "event" | "schedule")
      : "manual";
    const [inserted] = await db
      .insert(workflowRuns)
      .values({
        workspaceId,
        workflowId,
        status: "running",
        triggerType: dbTriggerType,
        output: {},
        startedAt: new Date(),
        createdById: triggeredBy,
      })
      .returning({ id: workflowRuns.id });
    runRow = (await db.select().from(workflowRuns).where(eq(workflowRuns.id, inserted.id)).limit(1))[0];
  } else {
    await db
      .update(workflowRuns)
      .set({ status: "running", startedAt: new Date(), errorMessage: null })
      .where(eq(workflowRuns.id, runRow.id));
  }

  if (!runRow) {
    throw new Error("Failed to create or load workflow run record.");
  }
  const runId = runRow.id;
  const context: Record<string, unknown> = { ...initialContext, _runId: runId, _workflowId: workflowId };

  let status: "running" | "completed" | "failed" = "running";
  let errorMessage: string | undefined;
  const stepLog: Array<{ nodeKey: string; nodeType: NodeType; status: string; output?: unknown; error?: string }> = [];

  try {
    const { nodes, edges } = await loadWorkflow(workflowId);
    const validation = validateWorkflowDefinition(nodes, edges);
    if (!validation.valid) {
      throw new Error(`Invalid workflow definition: ${validation.errors.join("; ")}`);
    }

    const startNode = pickStartNode(nodes);
    if (!startNode) throw new Error("Workflow is missing a start node.");

    let current: WorkflowNode | undefined = startNode;
    let steps = 0;
    while (current) {
      if (steps >= MAX_GRAPH_STEPS) {
        throw new Error(`Workflow exceeded maximum of ${MAX_GRAPH_STEPS} steps.`);
      }
      steps += 1;

      const result = await executeNode(current, context, workspaceId, triggeredBy);
      stepLog.push({
        nodeKey: current.nodeKey,
        nodeType: current.nodeType,
        status: result.success ? "completed" : "failed",
        output: Object.keys(result.output ?? {}).length ? result.output : undefined,
        error: result.errorMessage,
      });

      if (!result.success) {
        status = "failed";
        errorMessage = result.errorMessage ?? `Node ${current.nodeKey} failed`;
        break;
      }

      if (current.nodeType === "end") {
        status = "completed";
        break;
      }

      const explicitNext = result.nextNodeKey
        ? nodes.find(node => node.nodeKey === result.nextNodeKey)
        : undefined;
      const edge = findNextNode(current.id, edges, context);
      const next = explicitNext ?? (edge ? findNodeById(nodes, edge.toNodeId) : undefined);
      if (!next) {
        if (current.nodeType === "condition") {
          status = "completed";
          break;
        }
        status = "failed";
        errorMessage = `Node ${current.nodeKey} has no outgoing edges.`;
        break;
      }
      current = next;
    }

    if (status === "running") status = "completed";

    const output = {
      finalContext: { ...context },
      steps: stepLog,
      completedAt: new Date().toISOString(),
    };

    await db
      .update(workflowRuns)
      .set({
        status,
        output,
        errorMessage: errorMessage ?? null,
        completedAt: new Date(),
      })
      .where(eq(workflowRuns.id, runId));

    await writeAuditLog({
      workspaceId,
      actorUserId: triggeredBy,
      action: status === "completed" ? "workflow.run_completed" : "workflow.run_failed",
      resourceType: "workflowRun",
      resourceId: runId,
      metadata: { workflowId, steps: stepLog.length, status },
    });

    return { runId, status, output, errorMessage };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 2000) : "Workflow execution failed";
    status = "failed";
    errorMessage = message;
    const output = {
      finalContext: { ...context },
      steps: stepLog,
      completedAt: new Date().toISOString(),
    };
    await db
      .update(workflowRuns)
      .set({
        status: "failed",
        output,
        errorMessage: message,
        completedAt: new Date(),
      })
      .where(eq(workflowRuns.id, runId));
    await writeAuditLog({
      workspaceId,
      actorUserId: triggeredBy,
      action: "workflow.run_failed",
      resourceType: "workflowRun",
      resourceId: runId,
      metadata: { workflowId, error: message },
    });
    return { runId, status: "failed", output, errorMessage: message };
  }
}

export interface NotificationRecipient {
  id: number;
  email: string | null;
}

export async function lookupNotificationRecipient(userId: number): Promise<NotificationRecipient | null> {
  const db = await requireDb();
  const row = (await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!row) return null;
  return { id: row.id, email: row.email ?? null };
}
