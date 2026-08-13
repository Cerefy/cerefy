// src/enterprise/identity/index.ts
// Identity & Access Layer — Firebase Auth / JWT / RBAC

import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  permissions: string[];
  firebaseUid?: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

// JWT Token management
export class TokenService {
  private tokenSecret: string;

  constructor() {
    this.tokenSecret = process.env.JWT_SECRET || 'development-secret-change-in-production';
  }

  generateToken(user: AuthenticatedUser): string {
    const payload: Omit<AuthTokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      permissions: user.permissions,
    };

    // In production, use a proper JWT library like jsonwebtoken
    // For now, return a simple encoded token
    return Buffer.from(JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    })).toString('base64');
  }

  verifyToken(token: string): AuthTokenPayload | null {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return null; // Token expired
      }
      return decoded;
    } catch {
      return null;
    }
  }
}

// Authentication middleware
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  const tokenService = new TokenService();
  const payload = tokenService.verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }

  (req as any).user = {
    id: payload.sub,
    email: payload.email,
    tenantId: payload.tenantId,
    role: payload.role,
    permissions: payload.permissions,
  } as AuthenticatedUser;

  next();
}

// Authorization middleware factory
export function authorize(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as AuthenticatedUser | undefined;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const hasPermission = requiredPermissions.every(p => user.permissions.includes(p));
    if (!hasPermission) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
}

export const tokenService = new TokenService();
