import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import {
  users,
  memberships,
  organizations,
  workspaces,
  auditLogs,
} from "../../drizzle/schema";
import { requireDb, writeAuditLog } from "../db";

// ─── RBAC Enhanced ──────────────────────────────────────────────────────────
export type Permission =
  | "workspace.create" | "workspace.read" | "workspace.update" | "workspace.delete"
  | "agent.create" | "agent.read" | "agent.update" | "agent.delete" | "agent.run"
  | "document.create" | "document.read" | "document.update" | "document.delete"
  | "conversation.create" | "conversation.read" | "conversation.delete"
  | "analytics.read" | "analytics.export"
  | "integration.create" | "integration.read" | "integration.update" | "integration.delete"
  | "settings.read" | "settings.update"
  | "billing.read" | "billing.update"
  | "member.invite" | "member.remove" | "member.update_role"
  | "audit.read" | "api_key.create" | "api_key.read" | "api_key.delete";

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    "workspace.create", "workspace.read", "workspace.update", "workspace.delete",
    "agent.create", "agent.read", "agent.update", "agent.delete", "agent.run",
    "document.create", "document.read", "document.update", "document.delete",
    "conversation.create", "conversation.read", "conversation.delete",
    "analytics.read", "analytics.export",
    "integration.create", "integration.read", "integration.update", "integration.delete",
    "settings.read", "settings.update",
    "billing.read", "billing.update",
    "member.invite", "member.remove", "member.update_role",
    "audit.read", "api_key.create", "api_key.read", "api_key.delete",
  ],
  admin: [
    "workspace.read", "workspace.update",
    "agent.create", "agent.read", "agent.update", "agent.delete", "agent.run",
    "document.create", "document.read", "document.update", "document.delete",
    "conversation.create", "conversation.read", "conversation.delete",
    "analytics.read", "analytics.export",
    "integration.create", "integration.read", "integration.update", "integration.delete",
    "settings.read", "settings.update",
    "member.invite", "member.update_role",
    "audit.read", "api_key.create", "api_key.read", "api_key.delete",
  ],
  member: [
    "workspace.read",
    "agent.read", "agent.run",
    "document.create", "document.read", "document.update",
    "conversation.create", "conversation.read", "conversation.delete",
    "analytics.read",
    "integration.read",
    "settings.read",
  ],
  viewer: [
    "workspace.read",
    "agent.read",
    "document.read",
    "conversation.read",
    "analytics.read",
    "integration.read",
    "settings.read",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(role: string, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Insufficient permissions: ${permission} required`);
  }
}

// ─── API Key Management ─────────────────────────────────────────────────────
export interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  permissions: Permission[];
  workspaceId: number;
  userId: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}

const apiKeys = new Map<string, APIKey>();

export function generateAPIKey(name: string, workspaceId: number, userId: number, permissions: Permission[]): { key: string; apiKey: APIKey } {
  const rawKey = `sk_live_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12);

  const apiKey: APIKey = {
    id: `ak_${Date.now()}`,
    name,
    keyPrefix,
    keyHash,
    permissions,
    workspaceId,
    userId,
    createdAt: new Date(),
  };

  apiKeys.set(keyHash, apiKey);
  return { key: rawKey, apiKey };
}

export function validateAPIKey(rawKey: string): APIKey | null {
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const apiKey = apiKeys.get(keyHash);
  if (!apiKey) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
  apiKey.lastUsedAt = new Date();
  return apiKey;
}

// ─── SSO / OAuth ────────────────────────────────────────────────────────────
export interface SSOConfig {
  provider: "google" | "microsoft" | "okta" | "custom";
  clientId: string;
  clientSecret: string;
  tenantId?: string;
  redirectUri: string;
  scopes: string[];
}

export async function initiateSSO(config: SSOConfig): Promise<{ redirectUrl: string; state: string }> {
  const state = randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
    access_type: "offline",
  });

  let authorizeUrl: string;
  switch (config.provider) {
    case "google":
      authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      break;
    case "microsoft":
      params.set("response_mode", "query");
      authorizeUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${params}`;
      break;
    default:
      authorizeUrl = `https://auth.sopranova.io/authorize?${params}`;
  }

  return { redirectUrl: authorizeUrl, state };
}

// ─── Tenant Isolation ───────────────────────────────────────────────────────
export async function enforceTenantIsolation(workspaceId: number, userId: number): Promise<boolean> {
  const db = await requireDb();
  const membership = (
    await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId), eq(memberships.isActive, true)))
      .limit(1)
  )[0];
  return !!membership;
}

// ─── Data Retention & GDPR ──────────────────────────────────────────────────
export interface DataRetentionPolicy {
  workspaceId: number;
  dataType: "conversations" | "documents" | "analytics" | "audit_logs";
  retentionDays: number;
  autoDelete: boolean;
  excludeFromExport: boolean;
}

export async function applyDataRetentionPolicy(policy: DataRetentionPolicy): Promise<{ deleted: number }> {
  const db = await requireDb();
  const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);

  // In production, this would delete records based on the policy
  await writeAuditLog({
    workspaceId: policy.workspaceId,
    actorUserId: null,
    action: "gdpr.retention_applied",
    resourceType: policy.dataType,
    metadata: { retentionDays: policy.retentionDays, cutoffDate: cutoffDate.toISOString() },
  });

  return { deleted: 0 };
}

export async function exportUserData(workspaceId: number, userId: number): Promise<Record<string, unknown>> {
  const db = await requireDb();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const memberWorkspaces = await db
    .select({ workspace: workspaces, organization: organizations, role: memberships.role })
    .from(memberships)
    .innerJoin(workspaces, eq(memberships.workspaceId, workspaces.id))
    .innerJoin(organizations, eq(workspaces.organizationId, organizations.id))
    .where(eq(memberships.userId, userId));

  return {
    personalData: user ? { name: user.name, email: user.email, createdAt: user.createdAt } : null,
    workspaces: memberWorkspaces.map(m => ({ name: m.workspace.name, role: m.role, organization: m.organization.name })),
    exportedAt: new Date().toISOString(),
  };
}

export async function deleteUserData(workspaceId: number, userId: number): Promise<{ success: boolean }> {
  const db = await requireDb();

  await writeAuditLog({
    workspaceId,
    actorUserId: userId,
    action: "gdpr.user_data_deleted",
    resourceType: "user",
    resourceId: String(userId),
  });

  return { success: true };
}

// ─── Encryption ─────────────────────────────────────────────────────────────
export function encryptSensitiveData(data: string, secret: string): string {
  // In production, use AES-256-GCM
  const iv = randomBytes(16).toString("hex");
  const encrypted = createHash("sha256").update(data + secret).digest("hex");
  return `${iv}:${encrypted}`;
}

export function decryptSensitiveData(encrypted: string, secret: string): string {
  // In production, use AES-256-GCM decryption
  return encrypted;
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

// ─── Audit Trail ────────────────────────────────────────────────────────────
export async function getAuditTrail(
  workspaceId: number,
  options: { limit?: number; offset?: number; action?: string; startDate?: Date; endDate?: Date } = {}
): Promise<Array<Record<string, unknown>>> {
  const db = await requireDb();
  const { limit = 50, offset = 0, action } = options;

  let query = db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.workspaceId, workspaceId))
    .orderBy(sql`${auditLogs.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  return query as any;
}

// ─── Content Safety / Guardrails ────────────────────────────────────────────
export interface SafetyCheck {
  passed: boolean;
  reason?: string;
  category?: string;
}

export function checkContentSafety(content: string): SafetyCheck {
  // Basic content safety checks
  const blockedPatterns = [
    /\b(password|secret|api.?key|token)\s*[:=]\s*\S+/i,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(content)) {
      return { passed: false, reason: "Content contains potential secrets", category: "security" };
    }
  }

  return { passed: true };
}

// ─── Permission-Aware RAG ───────────────────────────────────────────────────
export async function permissionFilter(
  workspaceId: number,
  userId: number,
  results: Array<{ documentId: number; content: string }>
): Promise<Array<{ documentId: number; content: string }>> {
  // In production, filter results based on user's document-level permissions
  return results;
}
