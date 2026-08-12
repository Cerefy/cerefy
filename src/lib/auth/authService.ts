// src/lib/auth/authService.ts
// Durable, database-backed authentication. Registration/login/refresh/logout/me
// all hit Postgres under tenant context. No fabricated sessions: every token is
// either a real JWT (access) or a server-side session row (refresh) that can be
// revoked. Passwords are scrypt-hashed — never stored in plaintext.

import { eq } from 'drizzle-orm';
import { db, isDatabaseReachable, withTenantContext } from '../../db';
import { users, organizations, sessions } from '../../db/schema';
import { hashPassword, verifyPassword } from './password';
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  type AccessTokenClaims,
} from './tokens';
import crypto from 'node:crypto';

export interface PublicUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  organizationName: string;
  avatarUrl: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function generateTenantId(): string {
  return `org_${crypto.randomBytes(8).toString('hex')}`;
}

function avatarFor(firstName: string, lastName: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(`${firstName} ${lastName}`)}&background=111827&color=00ffff`;
}

function toProfile(row: typeof users.$inferSelect, orgName: string): PublicUserProfile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role,
    organizationId: row.tenantId,
    organizationName: orgName,
    avatarUrl: row.avatarUrl ?? avatarFor(row.firstName, row.lastName),
    createdAt: row.createdAt.toISOString(),
  };
}

async function orgNameFor(tenantId: string): Promise<string> {
  let name = 'Cerefy Enterprise';
  await withTenantContext(tenantId, async (tx) => {
    const [org] = await tx.select({ name: organizations.name }).from(organizations).limit(1);
    if (org) name = org.name;
  }).catch(() => {});
  return name;
}

/** Email lookup that works before a tenant context exists (uses app.auth_email RLS bypass). */
async function findUserByEmail(email: string): Promise<typeof users.$inferSelect | null> {
  return db.transaction(async (tx) => {
    await tx.execute(`SET LOCAL app.auth_email = '${email.replace(/'/g, "''")}'`);
    const [row] = await tx.select().from(users).where(eq(users.email, email)).limit(1);
    return row ?? null;
  });
}

async function insertRefreshSession(tenantId: string, userId: string): Promise<string> {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await withTenantContext(tenantId, async (tx) => {
    await tx.insert(sessions).values({
      tenantId,
      userId,
      refreshHash: hashRefreshToken(refreshToken),
      expiresAt,
    });
  });
  return refreshToken;
}

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}): Promise<{ user: PublicUserProfile; tokens: AuthTokens }> {
  if (!(await isDatabaseReachable())) {
    throw new DatabaseUnavailableError();
  }
  const email = String(input.email).toLowerCase().trim();
  const existing = await findUserByEmail(email);
  if (existing) {
    const err = new Error('Email already registered') as Error & { status?: number };
    err.status = 409;
    throw err;
  }
  const tenantId = generateTenantId();
  const orgName = input.organizationName?.trim() || `${input.firstName}'s Organization`;
  const passwordHash = await hashPassword(input.password);

  try {
    return await withTenantContext(tenantId, async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({ tenantId, name: orgName, plan: 'trial' })
        .returning();
      const [user] = await tx
        .insert(users)
        .values({
          tenantId,
          email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          role: 'admin',
          avatarUrl: avatarFor(input.firstName, input.lastName),
        })
        .returning();
      const accessToken = signAccessToken({
        sub: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        tid: tenantId,
        org: org.name,
      });
      const refreshToken = generateRefreshToken();
      await tx.insert(sessions).values({
        tenantId,
        userId: user.id,
        refreshHash: hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
      });
      return { user: toProfile(user, org.name), tokens: { accessToken, refreshToken } as AuthTokens };
    });
  } catch (err: any) {
    if (String(err?.message || '').toLowerCase().includes('duplicate key') || String(err?.code) === '23505') {
      const dup = new Error('Email already registered') as Error & { status?: number };
      dup.status = 409;
      throw dup;
    }
    throw err;
  }
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicUserProfile; tokens: AuthTokens }> {
  if (!(await isDatabaseReachable())) {
    throw new DatabaseUnavailableError();
  }
  const email = String(input.email).toLowerCase().trim();
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password') as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    const err = new Error('Invalid email or password') as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  const orgName = await orgNameFor(user.tenantId);
  const refreshToken = await insertRefreshSession(user.tenantId, user.id);
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
    tid: user.tenantId,
    org: orgName,
  });
  return { user: toProfile(user, orgName), tokens: { accessToken, refreshToken } };
}

export async function refresh(refreshToken: string): Promise<{ user: PublicUserProfile; tokens: AuthTokens }> {
  if (!(await isDatabaseReachable())) {
    throw new DatabaseUnavailableError();
  }
  const refreshHash = hashRefreshToken(refreshToken);
  const found = await db.transaction(async (tx) => {
    await tx.execute(`SET LOCAL app.auth_refresh_hash = '${refreshHash.replace(/'/g, "''")}'`);
    const [session] = await tx.select().from(sessions).where(eq(sessions.refreshHash, refreshHash)).limit(1);
    return session ?? null;
  });
  if (!found || found.revokedAt || found.expiresAt.getTime() < Date.now()) {
    const err = new Error('Invalid or expired refresh token') as Error & { status?: number };
    err.status = 401;
    throw err;
  }

  const result = await withTenantContext(found.tenantId, async (tx) => {
    const [userRow] = await tx.select().from(users).where(eq(users.id, found.userId!)).limit(1);
    if (!userRow) {
      const err = new Error('Account no longer exists') as Error & { status?: number };
      err.status = 401;
      throw err;
    }
    const [org] = await tx.select().from(organizations).where(eq(organizations.tenantId, found.tenantId)).limit(1);
    // rotate: revoke the presented token, issue one new session
    await tx
      .update(sessions)
      .set({ revokedAt: new Date(), lastUsedAt: new Date() })
      .where(eq(sessions.id, found.id));
    const refreshToken2 = generateRefreshToken();
    await tx.insert(sessions).values({
      tenantId: found.tenantId,
      userId: userRow.id,
      refreshHash: hashRefreshToken(refreshToken2),
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    });
    const accessToken = signAccessToken({
      sub: userRow.id,
      email: userRow.email,
      name: `${userRow.firstName} ${userRow.lastName}`,
      role: userRow.role,
      tid: found.tenantId,
      org: org?.name ?? found.tenantId,
    });
    return { user: toProfile(userRow, org?.name ?? found.tenantId), tokens: { accessToken, refreshToken: refreshToken2 } };
  });
  return result;
}

export async function logout(refreshToken: string): Promise<void> {
  if (!(await isDatabaseReachable())) return;
  const refreshHash = hashRefreshToken(refreshToken);
  const found = await db.transaction(async (tx) => {
    await tx.execute(`SET LOCAL app.auth_refresh_hash = '${refreshHash.replace(/'/g, "''")}'`);
    const [session] = await tx.select().from(sessions).where(eq(sessions.refreshHash, refreshHash)).limit(1);
    return session ?? null;
  });
  if (!found) return;
  await withTenantContext(found.tenantId, async (tx) => {
    await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, found.id));
  });
}

export async function meFromClaims(claims: AccessTokenClaims): Promise<PublicUserProfile | null> {
  let profile: PublicUserProfile | null = null;
  await withTenantContext(claims.tid, async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, claims.sub as any)).limit(1);
    if (!user) return;
    const [org] = await tx.select().from(organizations).where(eq(organizations.tenantId, claims.tid)).limit(1);
    profile = toProfile(user, org?.name ?? claims.org);
  }).catch(() => {});
  return profile;
}

export class DatabaseUnavailableError extends Error {
  constructor() {
    super('Database unavailable — authentication requires Postgres. Check DATABASE_URL.');
    this.name = 'DatabaseUnavailableError';
  }
}
