// src/lib/auth/tokens.ts
// Minimal HS256 JWT implementation over Node's crypto — no external dependency.
// Access tokens are stateless and short-lived; refresh tokens are opaque and
// stored (hashed) server-side in the `sessions` table for revocation.

import crypto from 'node:crypto';

export interface AccessTokenClaims {
  /** user id (uuid) */
  sub: string;
  email: string;
  name: string;
  role: string;
  /** tenant/organization key */
  tid: string;
  org: string;
  iat: number;
  exp: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(data: string, secret: string): string {
  return b64url(crypto.createHmac('sha256', secret).update(data).digest());
}

function secretFor(env: string | undefined): string {
  const secret = env || '';
  if (secret.length < 16) {
    // Never silently downgrade in production.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be at least 16 characters in production');
    }
    return secret || 'cerefy-insecure-dev-secret';
  }
  return secret;
}

export function signAccessToken(claims: Omit<AccessTokenClaims, 'iat' | 'exp'>, ttlSeconds = 900): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenClaims = { ...claims, iat: now, exp: now + ttlSeconds };
  const secret = secretFor(process.env.JWT_SECRET);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const signature = sign(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}

export function verifyAccessToken(token: string): AccessTokenClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  try {
    const secret = secretFor(process.env.JWT_SECRET);
    const expected = sign(`${header}.${body}`, secret);
    const actual = Buffer.from(signature);
    const sig = Buffer.from(expected);
    if (actual.length !== sig.length || !crypto.timingSafeEqual(actual, sig)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AccessTokenClaims;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  return `refresh_${crypto.randomBytes(32).toString('hex')}`;
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
