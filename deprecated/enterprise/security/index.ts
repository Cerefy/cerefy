// src/enterprise/security/index.ts
// Multi-tenant Security Layer — RBAC, Audit, Tenant Isolation

export enum Permission {
  // Agent permissions
  AGENT_READ = 'agent:read',
  AGENT_CREATE = 'agent:create',
  AGENT_UPDATE = 'agent:update',
  AGENT_DELETE = 'agent:delete',
  AGENT_EXECUTE = 'agent:execute',

  // Document permissions
  DOCUMENT_READ = 'document:read',
  DOCUMENT_CREATE = 'document:create',
  DOCUMENT_UPDATE = 'document:update',
  DOCUMENT_DELETE = 'document:delete',

  // Workflow permissions
  WORKFLOW_READ = 'workflow:read',
  WORKFLOW_CREATE = 'workflow:create',
  WORKFLOW_UPDATE = 'workflow:update',
  WORKFLOW_DELETE = 'workflow:delete',
  WORKFLOW_EXECUTE = 'workflow:execute',

  // Analytics permissions
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',

  // Admin permissions
  TENANT_MANAGE = 'tenant:manage',
  USER_MANAGE = 'user:manage',
  SETTINGS_MANAGE = 'settings:manage',
  AUDIT_READ = 'audit:read',
}

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.AGENT_READ, Permission.AGENT_CREATE, Permission.AGENT_UPDATE, Permission.AGENT_DELETE, Permission.AGENT_EXECUTE,
    Permission.DOCUMENT_READ, Permission.DOCUMENT_CREATE, Permission.DOCUMENT_UPDATE, Permission.DOCUMENT_DELETE,
    Permission.WORKFLOW_READ, Permission.WORKFLOW_CREATE, Permission.WORKFLOW_UPDATE, Permission.WORKFLOW_DELETE, Permission.WORKFLOW_EXECUTE,
    Permission.ANALYTICS_READ, Permission.ANALYTICS_EXPORT,
    Permission.USER_MANAGE, Permission.SETTINGS_MANAGE, Permission.AUDIT_READ,
  ],
  [Role.MANAGER]: [
    Permission.AGENT_READ, Permission.AGENT_EXECUTE,
    Permission.DOCUMENT_READ, Permission.DOCUMENT_CREATE, Permission.DOCUMENT_UPDATE,
    Permission.WORKFLOW_READ, Permission.WORKFLOW_EXECUTE,
    Permission.ANALYTICS_READ,
  ],
  [Role.MEMBER]: [
    Permission.AGENT_READ, Permission.AGENT_EXECUTE,
    Permission.DOCUMENT_READ, Permission.DOCUMENT_CREATE,
    Permission.WORKFLOW_READ,
  ],
  [Role.VIEWER]: [
    Permission.AGENT_READ,
    Permission.DOCUMENT_READ,
    Permission.WORKFLOW_READ,
  ],
};

export class SecurityService {
  hasPermission(userRole: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
  }

  getPermissionsForRole(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  canAccessTenant(userId: string, tenantId: string, userTenants: string[]): boolean {
    return userTenants.includes(tenantId);
  }
}

export class AuditService {
  private logs: Array<{
    tenantId: string;
    userId: string;
    action: string;
    resource?: string;
    details?: Record<string, unknown>;
    timestamp: Date;
  }> = [];

  log(params: {
    tenantId: string;
    userId: string;
    action: string;
    resource?: string;
    details?: Record<string, unknown>;
  }): void {
    this.logs.push({
      ...params,
      timestamp: new Date(),
    });
  }

  getLogs(tenantId: string, limit = 100): typeof this.logs {
    return this.logs
      .filter(log => log.tenantId === tenantId)
      .slice(-limit);
  }
}

export const securityService = new SecurityService();
export const auditService = new AuditService();
