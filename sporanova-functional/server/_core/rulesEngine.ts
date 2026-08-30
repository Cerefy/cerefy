import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  businessRules,
  conversations,
  dataRecords,
  dataSources,
  memberships,
  notifications,
  users,
} from "../../drizzle/schema";
import { requireDb, writeAuditLog, listWorkspaceMembers } from "../db";
import { sendEmail } from "../email";

// ─── DSL Types ──────────────────────────────────────────────────────────────

export type ComparisonOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "in"
  | "exists";

export type Condition =
  | { type: "comparison"; field: string; operator: ComparisonOperator; value?: unknown }
  | { type: "and"; conditions: Condition[] }
  | { type: "or"; conditions: Condition[] }
  | { type: "not"; condition: Condition };

export type Action =
  | { type: "set_field"; field: string; value: unknown }
  | { type: "escalate"; reason: string; priority: "low" | "medium" | "high" | "critical" }
  | { type: "notify"; channel: "email" | "in_app" | "webhook"; template: string; recipients?: string[] }
  | { type: "create_case"; system: string; template: Record<string, unknown> }
  | { type: "route"; destination: string; agentId?: number }
  | { type: "delay"; duration: string }
  | { type: "end_conversation"; status: "resolved" | "abandoned" | "escalated" }
  | { type: "log"; message: string; level: "info" | "warn" | "error" };

export interface Rule {
  id: number;
  workspaceId: number;
  agentId: number | null;
  name: string;
  description: string | null;
  priority: number;
  enabled: boolean;
  condition: Condition;
  actions: Action[];
  createdById: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionResult {
  action: Action;
  success: boolean;
  data?: unknown;
  error?: string;
}

// ─── Context Helpers ────────────────────────────────────────────────────────

function getFieldValue(obj: Record<string, unknown>, path: string): unknown {
  if (!obj || !path) return undefined;
  const segments = path.split(".");
  let current: unknown = obj;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  return null;
}

function arraysEqualCI(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].map(x => String(x).toLowerCase()).sort();
  const sortedB = [...b].map(x => String(x).toLowerCase()).sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

// ─── Condition Evaluation ───────────────────────────────────────────────────

function evaluateComparison(
  field: string,
  operator: ComparisonOperator,
  value: unknown,
  context: Record<string, unknown>,
): boolean {
  const actual = getFieldValue(context, field);

  switch (operator) {
    case "exists":
      return actual !== undefined && actual !== null;
    case "eq":
      if (actual === value) return true;
      if (Array.isArray(actual) && Array.isArray(value)) return arraysEqualCI(actual, value);
      if (typeof actual === "string" && typeof value === "string") {
        return actual.toLowerCase() === value.toLowerCase();
      }
      return false;
    case "neq":
      if (actual === value) return false;
      if (Array.isArray(actual) && Array.isArray(value)) return !arraysEqualCI(actual, value);
      if (typeof actual === "string" && typeof value === "string") {
        return actual.toLowerCase() !== value.toLowerCase();
      }
      return true;
    case "gt": {
      const a = coerceNumber(actual);
      const b = coerceNumber(value);
      return a !== null && b !== null ? a > b : false;
    }
    case "gte": {
      const a = coerceNumber(actual);
      const b = coerceNumber(value);
      return a !== null && b !== null ? a >= b : false;
    }
    case "lt": {
      const a = coerceNumber(actual);
      const b = coerceNumber(value);
      return a !== null && b !== null ? a < b : false;
    }
    case "lte": {
      const a = coerceNumber(actual);
      const b = coerceNumber(value);
      return a !== null && b !== null ? a <= b : false;
    }
    case "contains":
      if (typeof actual === "string" && typeof value === "string") {
        return actual.toLowerCase().includes(value.toLowerCase());
      }
      if (Array.isArray(actual)) {
        return actual.some(item => {
          if (typeof item === "string" && typeof value === "string") {
            return item.toLowerCase() === value.toLowerCase();
          }
          return item === value;
        });
      }
      return false;
    case "in":
      if (!Array.isArray(value)) return false;
      return value.some(item => {
        if (typeof item === "string" && typeof actual === "string") {
          return item.toLowerCase() === actual.toLowerCase();
        }
        return item === actual;
      });
    default:
      return false;
  }
}

export function evaluateCondition(condition: Condition, context: Record<string, unknown>): boolean {
  if (!condition || typeof condition !== "object") return false;

  switch (condition.type) {
    case "comparison":
      return evaluateComparison(condition.field, condition.operator, condition.value, context);
    case "and":
      return Array.isArray(condition.conditions) && condition.conditions.every(c => evaluateCondition(c, context));
    case "or":
      return Array.isArray(condition.conditions) && condition.conditions.some(c => evaluateCondition(c, context));
    case "not":
      return condition.condition ? !evaluateCondition(condition.condition, context) : true;
    default:
      return false;
  }
}

// ─── Persistence Helpers ────────────────────────────────────────────────────

async function listWorkspaceAdminUserIds(workspaceId: number): Promise<number[]> {
  const db = await requireDb();
  const rows = await db
    .select({ userId: memberships.userId, role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.isActive, true)));
  return rows.filter(r => r.role === "admin" || r.role === "owner").map(r => r.userId);
}

async function ensureSystemDataSource(workspaceId: number, name: string, type: string, createdById: number | null): Promise<number> {
  const db = await requireDb();
  const existing = await db
    .select({ id: dataSources.id })
    .from(dataSources)
    .where(and(eq(dataSources.workspaceId, workspaceId), eq(dataSources.name, name), isNull(dataSources.deletedAt)))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const ownerId = createdById ?? (await listWorkspaceMembers(workspaceId))[0]?.userId ?? null;
  if (!ownerId) throw new Error("Cannot create system data source: no workspace members found.");
  const [created] = await db
    .insert(dataSources)
    .values({
      workspaceId,
      name,
      type,
      status: "connected",
      configuration: { system: true },
      createdById: ownerId,
    })
    .returning({ id: dataSources.id });
  return created.id;
}

function interpolate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr) => {
    const value = getFieldValue(context, expr.trim());
    if (value === undefined || value === null) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  });
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ─── Action Executors ───────────────────────────────────────────────────────

async function executeSetField(
  action: Extract<Action, { type: "set_field" }>,
  context: Record<string, unknown>,
): Promise<ActionResult> {
  if (!action.field) {
    return { action, success: false, error: "set_field requires a non-empty field name" };
  }
  const segments = action.field.split(".");
  const last = segments.pop();
  if (!last) {
    return { action, success: false, error: "set_field requires a valid field path" };
  }
  let cursor: Record<string, unknown> = context;
  for (const segment of segments) {
    const next = cursor[segment];
    if (next === undefined || next === null || typeof next !== "object") {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  cursor[last] = deepClone(action.value);
  return { action, success: true, data: { field: action.field, value: action.value } };
}

async function executeEscalate(
  action: Extract<Action, { type: "escalate" }>,
  context: Record<string, unknown>,
  workspaceId: number,
): Promise<ActionResult> {
  const reason = interpolate(action.reason, context).trim() || "Escalation requested";
  const adminIds = await listWorkspaceAdminUserIds(workspaceId);
  if (adminIds.length === 0) {
    return { action, success: false, error: "No workspace admins/owners to notify" };
  }
  const db = await requireDb();
  const conversationId = getFieldValue(context, "conversationId");
  const inserted = await db
    .insert(notifications)
    .values(
      adminIds.map(uid => ({
        workspaceId,
        recipientUserId: uid,
        type: "escalation",
        title: `Escalation (${action.priority}): ${reason.slice(0, 120)}`,
        content: reason,
        relatedEntityType: "conversation",
        relatedEntityId: conversationId ? String(conversationId) : null,
      })),
    )
    .returning({ id: notifications.id, recipientUserId: notifications.recipientUserId });
  console.info(
    `[rulesEngine] escalate priority=${action.priority} notifications=${inserted.length} admins=${adminIds.length}`,
  );
  return {
    action,
    success: true,
    data: {
      notificationIds: inserted.map(n => n.id),
      notifiedUserIds: inserted.map(n => n.recipientUserId),
      priority: action.priority,
      reason,
      escalatedAt: new Date().toISOString(),
    },
  };
}

async function executeNotify(
  action: Extract<Action, { type: "notify" }>,
  context: Record<string, unknown>,
  workspaceId: number,
): Promise<ActionResult> {
  const db = await requireDb();
  const title = interpolate(action.template, context).trim() || "Notification";
  const body = interpolate(`{{message}}`, { ...context, message: action.template }).trim();

  if (action.channel === "in_app") {
    const recipients = await resolveNotificationRecipients(workspaceId, action.recipients);
    if (recipients.length === 0) {
      return { action, success: false, error: "No recipients resolved for in_app notification" };
    }
    const conversationId = getFieldValue(context, "conversationId");
    const inserted = await db
      .insert(notifications)
      .values(
        recipients.map(uid => ({
          workspaceId,
          recipientUserId: uid,
          type: "rule_notification",
          title: title.slice(0, 255),
          content: body || title,
          relatedEntityType: "business_rule",
          relatedEntityId: getFieldValue(context, "ruleId") ? String(getFieldValue(context, "ruleId")) : null,
          ...(conversationId ? { relatedEntityType: "conversation", relatedEntityId: String(conversationId) } : {}),
        })),
      )
      .returning({ id: notifications.id, recipientUserId: notifications.recipientUserId });
    console.info(`[rulesEngine] notify in_app recipients=${inserted.length}`);
    return { action, success: true, data: { channel: "in_app", notificationIds: inserted.map(n => n.id) } };
  }

  if (action.channel === "email") {
    const recipients = await resolveNotificationRecipients(workspaceId, action.recipients);
    if (recipients.length === 0) {
      return { action, success: false, error: "No recipients resolved for email notification" };
    }
    const userRecords = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(inArray(users.id, recipients));
    const deliveries: Array<{ userId: number; status: string }> = [];
    for (const user of userRecords) {
      if (!user.email) continue;
      try {
        const result = await sendEmail({
          to: user.email,
          subject: title.slice(0, 255),
          text: body || title,
        });
        deliveries.push({ userId: user.id, status: result.delivered ? "delivered" : "queued" });
      } catch (error) {
        deliveries.push({ userId: user.id, status: error instanceof Error ? `error: ${error.message}` : "error" });
      }
    }
    console.info(`[rulesEngine] notify email attempts=${deliveries.length}`);
    return { action, success: true, data: { channel: "email", deliveries } };
  }

  if (action.channel === "webhook") {
    const url = action.recipients?.[0];
    if (!url) return { action, success: false, error: "Webhook notifications require recipients[0] as the URL" };
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, title, body, context }),
        signal: AbortSignal.timeout(15000),
      });
      const text = await response.text();
      console.info(`[rulesEngine] notify webhook ${url} -> ${response.status}`);
      return {
        action,
        success: response.ok,
        data: { channel: "webhook", status: response.status, body: text.slice(0, 4000) },
        ...(response.ok ? {} : { error: `Webhook responded ${response.status}` }),
      };
    } catch (error) {
      return { action, success: false, error: error instanceof Error ? error.message : "Webhook failed" };
    }
  }

  return { action, success: false, error: `Unsupported notification channel: ${String(action.channel)}` };
}

async function resolveNotificationRecipients(
  workspaceId: number,
  recipients: string[] | undefined,
): Promise<number[]> {
  if (!recipients || recipients.length === 0) {
    return listWorkspaceAdminUserIds(workspaceId);
  }
  const db = await requireDb();
  const isNumeric = recipients.every(r => /^\d+$/.test(r));
  if (isNumeric) {
    const ids = recipients.map(r => Number(r));
    const valid = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(and(eq(memberships.workspaceId, workspaceId), inArray(memberships.userId, ids), eq(memberships.isActive, true)));
    return valid.map(r => r.userId);
  }
  const lower = recipients.map(r => r.toLowerCase());
  const matched = await db
    .select({ id: users.id })
    .from(users)
    .where(or(...lower.map(email => eq(users.email, email))));
  if (matched.length === 0) return [];
  const ids = matched.map(r => r.id);
  const valid = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.workspaceId, workspaceId), inArray(memberships.userId, ids), eq(memberships.isActive, true)));
  return valid.map(r => r.userId);
}

async function executeCreateCase(
  action: Extract<Action, { type: "create_case" }>,
  context: Record<string, unknown>,
  workspaceId: number,
  createdById: number | null,
): Promise<ActionResult> {
  const sourceName = `${action.system}-cases`;
  const sourceType = `${action.system}_case`;
  const dataSourceId = await ensureSystemDataSource(workspaceId, sourceName, sourceType, createdById);
  const externalId = `${action.system}-${nanoid(10)}`;
  const payload = {
    ...deepClone(action.template),
    system: action.system,
    status: "open",
    createdByRule: true,
    context: deepClone(context),
  };
  const db = await requireDb();
  const inserted = await db
    .insert(dataRecords)
    .values({
      workspaceId,
      dataSourceId,
      externalId,
      payload,
      searchableText: JSON.stringify(payload).slice(0, 8000),
    })
    .returning({ id: dataRecords.id, externalId: dataRecords.externalId });
  console.info(`[rulesEngine] create_case system=${action.system} recordId=${inserted[0]?.id}`);
  return { action, success: true, data: { recordId: inserted[0]?.id, externalId: inserted[0]?.externalId, system: action.system } };
}

async function executeRoute(
  action: Extract<Action, { type: "route" }>,
  context: Record<string, unknown>,
): Promise<ActionResult> {
  if (!action.destination) return { action, success: false, error: "route action requires a destination" };
  context.routedTo = action.destination;
  if (action.agentId !== undefined) context.routedAgentId = action.agentId;
  console.info(`[rulesEngine] route destination=${action.destination} agentId=${action.agentId ?? "n/a"}`);
  return { action, success: true, data: { destination: action.destination, agentId: action.agentId ?? null } };
}

async function executeDelay(
  action: Extract<Action, { type: "delay" }>,
): Promise<ActionResult> {
  const ms = parseDurationToMs(action.duration);
  if (ms === null) {
    return { action, success: false, error: `Cannot parse duration: ${action.duration}` };
  }
  const seconds = Math.min(ms / 1000, 60);
  await new Promise(resolve => setTimeout(resolve, Math.min(ms, 1000)));
  console.info(`[rulesEngine] delay recorded duration=${action.duration} ms=${ms} (capped at ${seconds}s for safety)`);
  return { action, success: true, data: { duration: action.duration, ms, appliedMs: Math.min(ms, 1000) } };
}

function parseDurationToMs(duration: string): number | null {
  if (!duration) return null;
  const match = duration.trim().match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)?$/i);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = (match[2] || "ms").toLowerCase();
  if (!Number.isFinite(value)) return null;
  switch (unit) {
    case "ms": return value;
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

async function executeEndConversation(
  action: Extract<Action, { type: "end_conversation" }>,
  context: Record<string, unknown>,
  workspaceId: number,
): Promise<ActionResult> {
  const conversationId = getFieldValue(context, "conversationId");
  if (typeof conversationId !== "number" && typeof conversationId !== "string") {
    return { action, success: false, error: "end_conversation requires a numeric conversationId in context" };
  }
  const numericId = Number(conversationId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return { action, success: false, error: "end_conversation requires a positive integer conversationId" };
  }
  const db = await requireDb();
  const existing = await db
    .select({ id: conversations.id, title: conversations.title })
    .from(conversations)
    .where(and(eq(conversations.id, numericId), eq(conversations.workspaceId, workspaceId)))
    .limit(1);
  if (!existing[0]) {
    return { action, success: false, error: `Conversation ${numericId} not found in workspace ${workspaceId}` };
  }
  const newTitle = `[${action.status}] ${existing[0].title}`.slice(0, 255);
  await db
    .update(conversations)
    .set({ title: newTitle, deletedAt: action.status === "abandoned" ? new Date() : null, updatedAt: new Date() })
    .where(eq(conversations.id, numericId));
  console.info(`[rulesEngine] end_conversation id=${numericId} status=${action.status}`);
  return { action, success: true, data: { conversationId: numericId, status: action.status, title: newTitle } };
}

function executeLog(action: Extract<Action, { type: "log" }>): ActionResult {
  const message = action.message;
  switch (action.level) {
    case "warn":
      console.warn(`[rulesEngine] ${message}`);
      break;
    case "error":
      console.error(`[rulesEngine] ${message}`);
      break;
    default:
      console.info(`[rulesEngine] ${message}`);
      break;
  }
  return { action, success: true, data: { level: action.level } };
}

// ─── Public Action Executor ─────────────────────────────────────────────────

export async function executeActions(
  actions: Action[],
  context: Record<string, unknown>,
  workspaceId: number,
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];
  const createdById = (typeof context.userId === "number" ? context.userId : null) as number | null;
  for (const action of actions) {
    try {
      let result: ActionResult;
      switch (action.type) {
        case "set_field":
          result = await executeSetField(action, context);
          break;
        case "escalate":
          result = await executeEscalate(action, context, workspaceId);
          break;
        case "notify":
          result = await executeNotify(action, context, workspaceId);
          break;
        case "create_case":
          result = await executeCreateCase(action, context, workspaceId, createdById);
          break;
        case "route":
          result = await executeRoute(action, context);
          break;
        case "delay":
          result = await executeDelay(action);
          break;
        case "end_conversation":
          result = await executeEndConversation(action, context, workspaceId);
          break;
        case "log":
          result = executeLog(action);
          break;
        default:
          result = { action, success: false, error: `Unsupported action type: ${String((action as { type: string }).type)}` };
          break;
      }
      results.push(result);
    } catch (error) {
      results.push({
        action,
        success: false,
        error: error instanceof Error ? error.message : "Action execution threw an unknown error",
      });
    }
  }
  return results;
}

// ─── Rule Loading ───────────────────────────────────────────────────────────

function coerceCondition(raw: unknown): Condition | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Condition;
  if (candidate.type === "comparison" && typeof candidate.field === "string") return candidate;
  if (candidate.type === "and" || candidate.type === "or") {
    const sub = Array.isArray(candidate.conditions) ? candidate.conditions : [];
    return { type: candidate.type, conditions: sub } as Condition;
  }
  if (candidate.type === "not") {
    return { type: "not", condition: (candidate.condition ?? { type: "comparison", field: "_", operator: "exists" }) as Condition } as Condition;
  }
  return null;
}

function coerceActions(raw: unknown): Action[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((a): a is Action => !!a && typeof a === "object" && typeof (a as { type?: unknown }).type === "string");
}

export async function loadRules(workspaceId: number, agentId?: number): Promise<Rule[]> {
  const db = await requireDb();
  const filters = [eq(businessRules.workspaceId, workspaceId), isNull(businessRules.deletedAt)];
  if (typeof agentId === "number") {
    filters.push(or(eq(businessRules.agentId, agentId), isNull(businessRules.agentId))!);
  }
  const rows = await db
    .select()
    .from(businessRules)
    .where(and(...filters))
    .orderBy(asc(businessRules.priority), asc(businessRules.id));

  return rows
    .map(row => {
      const condition = coerceCondition(row.condition);
      if (!condition) return null;
      return {
        id: row.id,
        workspaceId: row.workspaceId,
        agentId: row.agentId ?? null,
        name: row.name,
        description: row.description ?? null,
        priority: row.priority,
        enabled: row.enabled,
        condition,
        actions: coerceActions(row.actions),
        createdById: row.createdById ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      } satisfies Rule;
    })
    .filter((rule): rule is Rule => rule !== null);
}

// ─── Bulk Evaluation ───────────────────────────────────────────────────────

export async function evaluateRules(
  workspaceId: number,
  context: Record<string, unknown>,
  agentId?: number,
): Promise<{ matchedRules: Rule[]; actionsToExecute: Action[] }> {
  const rules = await loadRules(workspaceId, agentId);
  const enabledRules = rules.filter(r => r.enabled);
  const matchedRules: Rule[] = [];
  const actionsToExecute: Action[] = [];

  for (const rule of enabledRules) {
    if (evaluateCondition(rule.condition, context)) {
      matchedRules.push(rule);
      context.matchedRuleIds = Array.from(
        new Set([...(Array.isArray(context.matchedRuleIds) ? (context.matchedRuleIds as unknown[]) : []), rule.id]),
      );
      actionsToExecute.push(...rule.actions);
    }
  }

  if (actionsToExecute.length > 0) {
    await executeActions(actionsToExecute, context, workspaceId);
  }

  return { matchedRules, actionsToExecute };
}

// ─── Audit Helper (re-exported for routers) ─────────────────────────────────

export async function writeRulesAuditLog(input: {
  workspaceId: number;
  actorUserId: number | null;
  action: string;
  resourceId: number;
  metadata?: Record<string, unknown>;
}) {
  await writeAuditLog({
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: input.action,
    resourceType: "business_rule",
    resourceId: input.resourceId,
    metadata: input.metadata,
  });
}