import { and, desc, eq, ilike, isNull, lt, or, sql } from "drizzle-orm";
import { memoryEntries } from "../../drizzle/schema";
import { requireDb } from "../db";

// ─── Memory Types ───────────────────────────────────────────────────────────
export type MemoryType = "short_term" | "conversation" | "user" | "company" | "agent" | "long_term";
export type MemoryScope = "conversation" | "user" | "company" | "agent";

export interface MemoryEntry {
  id: number;
  workspaceId: number;
  type: MemoryType;
  scope: MemoryScope;
  scopeId?: number | null;
  key: string;
  value: string;
  metadata: Record<string, unknown>;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
  lastAccessedAt: Date;
}

type MemoryRow = typeof memoryEntries.$inferSelect;
type MemoryInsert = typeof memoryEntries.$inferInsert;

function rowToEntry(row: MemoryRow): MemoryEntry {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    type: row.type as MemoryType,
    scope: row.scope as MemoryScope,
    scopeId: row.scopeId ?? undefined,
    key: row.key,
    value: row.value,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    expiresAt: row.expiresAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    accessCount: row.accessCount ?? 0,
    lastAccessedAt: row.lastAccessedAt ?? row.createdAt,
  };
}

function isExpired(row: MemoryRow, now: Date = new Date()): boolean {
  return !!(row.expiresAt && row.expiresAt.getTime() <= now.getTime());
}

export async function storeMemory(input: {
  workspaceId: number;
  type: MemoryType;
  scope: MemoryScope;
  scopeId?: number;
  key: string;
  value: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}): Promise<MemoryEntry> {
  const db = await requireDb();
  const now = new Date();

  const payload: MemoryInsert = {
    workspaceId: input.workspaceId,
    type: input.type,
    scope: input.scope,
    scopeId: input.scopeId ?? null,
    key: input.key,
    value: input.value,
    metadata: input.metadata ?? {},
    expiresAt: input.expiresAt ?? null,
    accessCount: 0,
    lastAccessedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const inserted = await db
      .insert(memoryEntries)
      .values(payload)
      .onConflictDoUpdate({
        target: [memoryEntries.workspaceId, memoryEntries.type, memoryEntries.scope, memoryEntries.scopeId, memoryEntries.key],
        set: {
          value: input.value,
          metadata: input.metadata ?? {},
          expiresAt: input.expiresAt ?? null,
          updatedAt: now,
        },
      })
      .returning();
    return rowToEntry(inserted[0]);
  } catch (err) {
    console.error("[memory] storeMemory failed", err);
    throw err;
  }
}

export async function recallMemory(
  workspaceId: number,
  type: MemoryType,
  scope: string,
  scopeId: number | undefined,
  key: string,
): Promise<MemoryEntry | null> {
  const db = await requireDb();
  const now = new Date();
  try {
    const where = and(
      eq(memoryEntries.workspaceId, workspaceId),
      eq(memoryEntries.type, type),
      eq(memoryEntries.scope, scope),
      scopeId === undefined
        ? isNull(memoryEntries.scopeId)
        : eq(memoryEntries.scopeId, scopeId),
      eq(memoryEntries.key, key),
      or(isNull(memoryEntries.expiresAt), sql`${memoryEntries.expiresAt} > ${now}`),
    );
    const rows = await db.select().from(memoryEntries).where(where).limit(1);
    const row = rows[0];
    if (!row) return null;
    if (isExpired(row, now)) return null;

    try {
      await db
        .update(memoryEntries)
        .set({
          accessCount: sql`${memoryEntries.accessCount} + 1`,
          lastAccessedAt: now,
        })
        .where(eq(memoryEntries.id, row.id));
    } catch (accessErr) {
      console.error("[memory] recallMemory access update failed", accessErr);
    }

    return rowToEntry({
      ...row,
      accessCount: (row.accessCount ?? 0) + 1,
      lastAccessedAt: now,
    });
  } catch (err) {
    console.error("[memory] recallMemory failed", err);
    return null;
  }
}

export async function searchMemory(
  workspaceId: number,
  query: string,
  options: { type?: MemoryType; scope?: string; limit?: number } = {},
): Promise<MemoryEntry[]> {
  const db = await requireDb();
  const { type, scope, limit = 10 } = options;
  const now = new Date();
  const needle = `%${query}%`;

  try {
    const conditions = [
      eq(memoryEntries.workspaceId, workspaceId),
      or(ilike(memoryEntries.key, needle), ilike(memoryEntries.value, needle)),
      or(isNull(memoryEntries.expiresAt), sql`${memoryEntries.expiresAt} > ${now}`),
    ];
    if (type) conditions.push(eq(memoryEntries.type, type));
    if (scope) conditions.push(eq(memoryEntries.scope, scope));

    const rows = await db
      .select()
      .from(memoryEntries)
      .where(and(...conditions))
      .orderBy(desc(memoryEntries.accessCount), desc(memoryEntries.updatedAt))
      .limit(limit);

    return rows.map(rowToEntry);
  } catch (err) {
    console.error("[memory] searchMemory failed", err);
    return [];
  }
}

export async function deleteMemory(workspaceId: number, key: string): Promise<{ deleted: number }> {
  const db = await requireDb();
  try {
    const result = await db
      .delete(memoryEntries)
      .where(and(eq(memoryEntries.workspaceId, workspaceId), eq(memoryEntries.key, key)))
      .returning({ id: memoryEntries.id });
    return { deleted: result.length };
  } catch (err) {
    console.error("[memory] deleteMemory failed", err);
    return { deleted: 0 };
  }
}

// ─── Conversation Memory ────────────────────────────────────────────────────
export async function storeConversationMemory(
  workspaceId: number,
  conversationId: number,
  key: string,
  value: string,
): Promise<MemoryEntry> {
  return storeMemory({
    workspaceId,
    type: "conversation",
    scope: "conversation",
    scopeId: conversationId,
    key,
    value,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
}

export async function getConversationMemory(
  workspaceId: number,
  conversationId: number,
  key: string,
): Promise<MemoryEntry | null> {
  return recallMemory(workspaceId, "conversation", "conversation", conversationId, key);
}

// ─── User Memory ────────────────────────────────────────────────────────────
export interface UserProfile {
  name?: string;
  email?: string;
  language?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  preferences?: Record<string, unknown>;
  previousOrders?: number;
  isVip?: boolean;
}

export async function storeUserProfile(workspaceId: number, userId: number, profile: UserProfile): Promise<MemoryEntry> {
  return storeMemory({
    workspaceId,
    type: "user",
    scope: "user",
    scopeId: userId,
    key: "profile",
    value: JSON.stringify(profile),
  });
}

export async function getUserProfile(workspaceId: number, userId: number): Promise<UserProfile | null> {
  const entry = await recallMemory(workspaceId, "user", "user", userId, "profile");
  if (!entry) return null;
  try {
    return JSON.parse(entry.value) as UserProfile;
  } catch {
    return null;
  }
}

// ─── Company Memory ─────────────────────────────────────────────────────────
export interface CompanyKnowledge {
  policies?: string[];
  products?: Array<{ name: string; description: string; price: number }>;
  faqs?: Array<{ question: string; answer: string }>;
  contacts?: Array<{ department: string; email: string; phone?: string }>;
  hours?: string;
  location?: string;
}

export async function storeCompanyKnowledge(
  workspaceId: number,
  knowledge: CompanyKnowledge,
): Promise<MemoryEntry> {
  return storeMemory({
    workspaceId,
    type: "company",
    scope: "company",
    key: "knowledge",
    value: JSON.stringify(knowledge),
  });
}

export async function getCompanyKnowledge(workspaceId: number): Promise<CompanyKnowledge | null> {
  const entry = await recallMemory(workspaceId, "company", "company", undefined, "knowledge");
  if (!entry) return null;
  try {
    return JSON.parse(entry.value) as CompanyKnowledge;
  } catch {
    return null;
  }
}

// ─── Agent Memory ───────────────────────────────────────────────────────────
export interface AgentExperience {
  successfulActions: Array<{ action: string; context: string; outcome: string }>;
  failedActions: Array<{ action: string; context: string; error: string }>;
  learnedPatterns: Array<{ pattern: string; response: string; confidence: number }>;
  performanceMetrics: { successRate: number; avgLatency: number; totalRuns: number };
}

export async function storeAgentMemory(
  workspaceId: number,
  agentId: number,
  experience: AgentExperience,
): Promise<MemoryEntry> {
  return storeMemory({
    workspaceId,
    type: "agent",
    scope: "agent",
    scopeId: agentId,
    key: "experience",
    value: JSON.stringify(experience),
  });
}

export async function getAgentMemory(workspaceId: number, agentId: number): Promise<AgentExperience | null> {
  const entry = await recallMemory(workspaceId, "agent", "agent", agentId, "experience");
  if (!entry) return null;
  try {
    return JSON.parse(entry.value) as AgentExperience;
  } catch {
    return null;
  }
}

// ─── Memory Context (multi-scope) ───────────────────────────────────────────
export interface MemoryContextBundle {
  shortTerm: MemoryEntry[];
  user: MemoryEntry[];
  company: MemoryEntry[];
  agent: MemoryEntry[];
  longTerm: MemoryEntry[];
}

export async function getMemoryContext(
  workspaceId: number,
  userId: number,
  conversationId: number,
): Promise<MemoryContextBundle> {
  const db = await requireDb();
  const now = new Date();
  const notExpired = or(isNull(memoryEntries.expiresAt), sql`${memoryEntries.expiresAt} > ${now}`);

  const buildScope = async (
    type: MemoryType,
    scope: MemoryScope,
    extra: ReturnType<typeof eq>[],
  ): Promise<MemoryEntry[]> => {
    try {
      const rows = await db
        .select()
        .from(memoryEntries)
        .where(
          and(
            eq(memoryEntries.workspaceId, workspaceId),
            eq(memoryEntries.type, type),
            eq(memoryEntries.scope, scope),
            notExpired,
            ...extra,
          ),
        )
        .orderBy(desc(memoryEntries.lastAccessedAt))
        .limit(50);
      return rows.map(rowToEntry);
    } catch (err) {
      console.error(`[memory] getMemoryContext scope=${scope} failed`, err);
      return [];
    }
  };

  const [shortTerm, user, company, agent, longTerm] = await Promise.all([
    buildScope("short_term", "conversation", [eq(memoryEntries.scopeId, conversationId)]),
    buildScope("user", "user", [eq(memoryEntries.scopeId, userId)]),
    buildScope("company", "company", []),
    buildScope("agent", "agent", []),
    buildScope("long_term", "user", [eq(memoryEntries.scopeId, userId)]),
  ]);

  return { shortTerm, user, company, agent, longTerm };
}

// ─── Memory Governance ──────────────────────────────────────────────────────
export interface MemoryPolicy {
  workspaceId: number;
  dataType: string;
  retentionDays: number;
  autoDelete: boolean;
  userCanDelete: boolean;
  requireConsent: boolean;
  encryptionRequired: boolean;
}

export function checkMemoryCompliance(
  workspaceId: number,
  memory: MemoryEntry,
  policy: MemoryPolicy,
): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];
  if (policy.encryptionRequired && !memory.metadata.encrypted) issues.push("Memory not encrypted as required");
  if (policy.retentionDays > 0 && memory.createdAt.getTime() < Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000) {
    issues.push("Memory exceeds retention period");
  }
  return { compliant: issues.length === 0, issues };
}

export async function garbageCollectMemories(workspaceId: number): Promise<{ deleted: number }> {
  const db = await requireDb();
  const now = new Date();
  try {
    const result = await db
      .delete(memoryEntries)
      .where(
        and(
          eq(memoryEntries.workspaceId, workspaceId),
          lt(memoryEntries.expiresAt, now),
        ),
      )
      .returning({ id: memoryEntries.id });
    return { deleted: result.length };
  } catch (err) {
    console.error("[memory] garbageCollectMemories failed", err);
    return { deleted: 0 };
  }
}

export async function garbageCollect(workspaceId: number, olderThanDays: number): Promise<{ deleted: number }> {
  const db = await requireDb();
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  try {
    const result = await db
      .delete(memoryEntries)
      .where(
        and(
          eq(memoryEntries.workspaceId, workspaceId),
          lt(memoryEntries.lastAccessedAt, cutoff),
        ),
      )
      .returning({ id: memoryEntries.id });
    return { deleted: result.length };
  } catch (err) {
    console.error("[memory] garbageCollect failed", err);
    return { deleted: 0 };
  }
}

export interface MemoryStats {
  total: number;
  byType: Record<string, number>;
  totalSizeBytes: number;
  oldest: Date | null;
  newest: Date | null;
}

export async function getMemoryStats(workspaceId: number): Promise<MemoryStats> {
  const db = await requireDb();
  try {
    const rows = await db
      .select({
        type: memoryEntries.type,
        count: sql<number>`count(*)::int`,
        size: sql<number>`coalesce(sum(octet_length(${memoryEntries.value})), 0)::int`,
        oldest: sql<Date | null>`min(${memoryEntries.createdAt})`,
        newest: sql<Date | null>`max(${memoryEntries.createdAt})`,
      })
      .from(memoryEntries)
      .where(eq(memoryEntries.workspaceId, workspaceId))
      .groupBy(memoryEntries.type);

    const byType: Record<string, number> = {};
    let total = 0;
    let totalSizeBytes = 0;
    let oldest: Date | null = null;
    let newest: Date | null = null;
    for (const r of rows) {
      byType[r.type] = Number(r.count);
      total += Number(r.count);
      totalSizeBytes += Number(r.size);
      if (r.oldest && (!oldest || r.oldest.getTime() < oldest.getTime())) oldest = r.oldest;
      if (r.newest && (!newest || r.newest.getTime() > newest.getTime())) newest = r.newest;
    }
    return { total, byType, totalSizeBytes, oldest, newest };
  } catch (err) {
    console.error("[memory] getMemoryStats failed", err);
    return { total: 0, byType: {}, totalSizeBytes: 0, oldest: null, newest: null };
  }
}