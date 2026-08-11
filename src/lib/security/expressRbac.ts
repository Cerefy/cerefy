import type { Request, Response, NextFunction } from 'express';
import { can, type Action, type Resource, type Role } from './rbac';

export interface AuthenticatedUser {
  id: string;
  role?: string;
  [key: string]: unknown;
}

export function roleOf(user: unknown): Role {
  const u = user as AuthenticatedUser | undefined;
  if (!u) return 'member';
  return (u.role as Role) ?? 'member';
}

export function requirePermission(action: Action, resource?: Resource) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: unknown }).user;
    if (!user) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }
    const role = roleOf(user);
    if (!can(role, action, resource)) {
      res.status(403).json({
        status: 'error',
        message: `Forbidden: role '${role}' cannot perform '${action}'`,
      });
      return;
    }
    next();
  };
}