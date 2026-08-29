import { and, eq, sql, desc } from "drizzle-orm";
import { requireDb, writeAuditLog } from "../db";

// ─── Memory Types ───────────────────────────────────────────────────────────
export type MemoryType = "short_term" | "conversation" | "user" | "company" | "agent" | "long_term";

export interface MemoryEntry {
  id: string;
  workspaceId: number;
  type: MemoryType;
  scope: "conversation" | "user" | "company" | "agent";
  scopeId?: number;
  key: string;
  value: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
  lastAccessedAt: Date;
}

// ─── Memory Store ───────────────────────────────────────────────────────────
const memoryStore = new Map<string, MemoryEntry>();
const MAX_MEMORIES = 50000;

function memoryKey(workspaceId: number, type: MemoryType, scope: string, scopeId: number | undefined, key: string): string {
  return `${workspaceId}:${type}:${scope}:${scopeId || "global"}:${key}`;
}

export function storeMemory(input: {
  workspaceId: number;
  type: MemoryType;
  scope: "conversation" | "user" | "company" | "agent";
  scopeId?: number;
  key: string;
  value: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}): MemoryEntry {
  const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const keyStr = memoryKey(input.workspaceId, input.type, input.scope, input.scopeId, input.key);
  const now = new Date();

  const entry: MemoryEntry = {
    id,
    workspaceId: input.workspaceId,
    type: input.type,
    scope: input.scope,
    scopeId: input.scopeId,
    key: input.key,
    value: input.value,
    metadata: input.metadata || {},
    expiresAt: input.expiresAt,
    createdAt: now,
    updatedAt: now,
    accessCount: 0,
    lastAccessedAt: now,
  };

  memoryStore.set(keyStr, entry);

  // Evict oldest if at capacity
  if (memoryStore.size > MAX_MEMORIES) {
    const oldest = Array.from(memoryStore.values()).sort((a, b) => a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime())[0];
    if (oldest) memoryStore.delete(memoryKey(oldest.workspaceId, oldest.type, oldest.scope, oldest.scopeId, oldest.key));
  }

  return entry;
}

export function recallMemory(workspaceId: number, type: MemoryType, scope: string, scopeId: number | undefined, key: string): MemoryEntry | null {
  const keyStr = memoryKey(workspaceId, type, scope, scopeId, key);
  const entry = memoryStore.get(keyStr);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < new Date()) {
    memoryStore.delete(keyStr);
    return null;
  }
  entry.accessCount++;
  entry.lastAccessedAt = new Date();
  return entry;
}

export function searchMemory(workspaceId: number, query: string, options: { type?: MemoryType; scope?: string; limit?: number } = {}): MemoryEntry[] {
  const { type, scope, limit = 10 } = options;
  const queryLower = query.toLowerCase();

  return Array.from(memoryStore.values())
    .filter(m => {
      if (m.workspaceId !== workspaceId) return false;
      if (type && m.type !== type) return false;
      if (scope && m.scope !== scope) return false;
      if (m.expiresAt && m.expiresAt < new Date()) return false;
      return m.key.toLowerCase().includes(queryLower) || m.value.toLowerCase().includes(queryLower);
    })
    .sort((a, b) => b.accessCount - a.accessCount || b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}

// ─── Conversation Memory ────────────────────────────────────────────────────
export function storeConversationMemory(workspaceId: number, conversationId: number, key: string, value: string) {
  return storeMemory({ workspaceId, type: "conversation", scope: "conversation", scopeId: conversationId, key, value, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
}

export function getConversationMemory(workspaceId: number, conversationId: number, key: string) {
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

export function storeUserProfile(workspaceId: number, userId: number, profile: UserProfile) {
  return storeMemory({ workspaceId, type: "user", scope: "user", scopeId: userId, key: "profile", value: JSON.stringify(profile) });
}

export function getUserProfile(workspaceId: number, userId: number): UserProfile | null {
  const entry = recallMemory(workspaceId, "user", "user", userId, "profile");
  if (!entry) return null;
  try { return JSON.parse(entry.value); } catch { return null; }
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

export function storeCompanyKnowledge(workspaceId: number, knowledge: CompanyKnowledge) {
  return storeMemory({ workspaceId, type: "company", scope: "company", key: "knowledge", value: JSON.stringify(knowledge) });
}

export function getCompanyKnowledge(workspaceId: number): CompanyKnowledge | null {
  const entry = recallMemory(workspaceId, "company", "company", undefined, "knowledge");
  if (!entry) return null;
  try { return JSON.parse(entry.value); } catch { return null; }
}

// ─── Agent Memory ───────────────────────────────────────────────────────────
export interface AgentExperience {
  successfulActions: Array<{ action: string; context: string; outcome: string }>;
  failedActions: Array<{ action: string; context: string; error: string }>;
  learnedPatterns: Array<{ pattern: string; response: string; confidence: number }>;
  performanceMetrics: { successRate: number; avgLatency: number; totalRuns: number };
}

export function storeAgentMemory(workspaceId: number, agentId: number, experience: AgentExperience) {
  return storeMemory({ workspaceId, type: "agent", scope: "agent", scopeId: agentId, key: "experience", value: JSON.stringify(experience) });
}

export function getAgentMemory(workspaceId: number, agentId: number): AgentExperience | null {
  const entry = recallMemory(workspaceId, "agent", "agent", agentId, "experience");
  if (!entry) return null;
  try { return JSON.parse(entry.value); } catch { return null; }
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

export function checkMemoryCompliance(workspaceId: number, memory: MemoryEntry, policy: MemoryPolicy): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];
  if (policy.encryptionRequired && !memory.metadata.encrypted) issues.push("Memory not encrypted as required");
  if (policy.retentionDays > 0 && memory.createdAt.getTime() < Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000) issues.push("Memory exceeds retention period");
  return { compliant: issues.length === 0, issues };
}

export async function garbageCollectMemories(workspaceId: number): Promise<{ deleted: number }> {
  let deleted = 0;
  for (const [key, entry] of Array.from(memoryStore.entries())) {
    if (entry.workspaceId !== workspaceId) continue;
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      memoryStore.delete(key);
      deleted++;
    }
  }
  return { deleted };
}
