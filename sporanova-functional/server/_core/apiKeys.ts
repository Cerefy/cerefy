import { eq, and, gt } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { requireDb } from "../db";
import { apiKeys } from "../../drizzle/schema";

export function generateKeyString(): string {
  return `sk_live_${randomBytes(32).toString("hex")}`;
}

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function createAPIKey(
  workspaceId: number,
  userId: number,
  name: string,
  scopes: string[],
  expiresInDays?: number,
  rateLimit?: number
): Promise<{ id: string; key: string; name: string; scopes: string[]; expiresAt: Date }> {
  const db = await requireDb();
  const key = generateKeyString();
  const keyHash = hashKey(key);
  const keyPrefix = key.substring(0, 12);
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000)
    : new Date("2099-12-31T23:59:59Z");
  const id = `ak_${Date.now()}_${randomBytes(4).toString("hex")}`;

  await db.insert(apiKeys).values({
    id,
    workspaceId,
    userId,
    name,
    keyPrefix,
    keyHash,
    scopes,
    rateLimit: rateLimit ?? 100,
    expiresAt,
    isActive: true,
  });

  return { id, key, name, scopes, expiresAt };
}

export async function validateAPIKey(rawKey: string): Promise<{
  id: string;
  workspaceId: number;
  userId: number;
  scopes: string[];
  rateLimit: number;
} | null> {
  const db = await requireDb();
  const keyHash = hashKey(rawKey);
  const [row] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.isActive, true),
        gt(apiKeys.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!row) return null;

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id));

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    scopes: (row.scopes as string[]) || ["*"],
    rateLimit: row.rateLimit,
  };
}

export async function listAPIKeys(workspaceId: number) {
  const db = await requireDb();
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      rateLimit: apiKeys.rateLimit,
      expiresAt: apiKeys.expiresAt,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, workspaceId));
}

export async function revokeAPIKey(keyId: string, workspaceId: number): Promise<boolean> {
  const db = await requireDb();
  const [updated] = await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.workspaceId, workspaceId)))
    .returning({ id: apiKeys.id });
  return !!updated;
}

export async function getApiKeyById(keyId: string): Promise<{
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  workspaceId: number;
  userId: number;
  rateLimit: number;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
} | null> {
  const db = await requireDb();
  const [row] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.id, keyId))
    .limit(1);

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.keyPrefix,
    scopes: (row.scopes as string[]) || ["*"],
    workspaceId: row.workspaceId,
    userId: row.userId,
    rateLimit: row.rateLimit,
    expiresAt: row.expiresAt,
    lastUsedAt: row.lastUsedAt,
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}
