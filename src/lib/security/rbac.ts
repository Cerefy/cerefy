export type Role = 'admin' | 'approver' | 'analyst' | 'member' | 'auditor';

export type Action =
  | 'query:run'
  | 'approve:decision'
  | 'reject:decision'
  | 'simulate:decision'
  | 'read:audit'
  | 'read:projects'
  | 'edit:project'
  | 'delete:project'
  | 'execute:agents'
  | 'run:pipeline'
  | 'manage:workflows'
  | 'admin:tenant';

export type Resource =
  | 'ai.workspace'
  | 'decision'
  | 'audit.log'
  | 'project'
  | 'workflow'
  | 'tenant';

const ROLE_RULES: Record<Role, Partial<Record<Action, Resource[]>>> = {
  admin: {
    'query:run': ['ai.workspace'],
    'approve:decision': ['decision'],
    'reject:decision': ['decision'],
    'simulate:decision': ['decision'],
    'read:audit': ['audit.log'],
    'read:projects': ['project'],
    'edit:project': ['project'],
    'delete:project': ['project'],
    'execute:agents': ['ai.workspace'],
    'run:pipeline': ['ai.workspace'],
    'manage:workflows': ['workflow'],
    'admin:tenant': ['tenant'],
  },
  approver: {
    'query:run': ['ai.workspace'],
    'approve:decision': ['decision'],
    'reject:decision': ['decision'],
    'simulate:decision': ['decision'],
    'read:projects': ['project'],
    'execute:agents': ['ai.workspace'],
    'run:pipeline': ['ai.workspace'],
  },
  analyst: {
    'query:run': ['ai.workspace'],
    'simulate:decision': ['decision'],
    'read:projects': ['project'],
    'execute:agents': ['ai.workspace'],
    'run:pipeline': ['ai.workspace'],
  },
  member: {
    'query:run': ['ai.workspace'],
    'read:projects': ['project'],
  },
  auditor: {
    'read:audit': ['audit.log'],
    'read:projects': ['project'],
  },
};

export function can(role: Role, action: Action, resource?: Resource): boolean {
  const resources = ROLE_RULES[role]?.[action];
  if (!resources) return false;
  return !resource || resources.includes(resource);
}

export function assertPermission(role: Role, action: Action, resource?: Resource): void {
  if (!can(role, action, resource)) {
    throw new Error(`Forbidden: role '${role}' cannot perform '${action}'`);
  }
}

export function rolesFor(resource: Resource, action: Action): Role[] {
  const out: Role[] = [];
  for (const role of Object.keys(ROLE_RULES) as Role[]) {
    if (can(role, action, resource)) out.push(role);
  }
  return out;
}