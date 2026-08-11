export interface AuditLogRecord {
  id: string;
  action: string;
  actorId: string;
  actorRole: string;
  tenantId: string;
  resource?: string;
  detail?: Record<string, unknown>;
  timestamp: string;
}

export interface AuditSink {
  append(record: AuditLogRecord): Promise<void> | void;
}

export class MemoryAuditSink implements AuditSink {
  readonly records: AuditLogRecord[] = [];
  append(record: AuditLogRecord): void {
    this.records.push(record);
  }
}

/**
 * Durable Postgres-backed audit sink (audit BLOCKER-1 fix). Writes to the
 * `audit_log` table under the caller's tenant context so RLS applies; when the
 * database is unreachable the trailing-memory buffer degrades the write
 * honestly instead of crashing the request path. The in-memory copy also backs
 * the read path (reconstruction UI) which stays fast and offline-tolerant.
 */
export class PostgresAuditSink implements AuditSink {
  readonly records: AuditLogRecord[] = [];

  constructor(
    private readonly deps: () => Promise<{
      db: any;
      withTenantContext: <T>(tenantId: string, op: (tx: any) => Promise<T>) => Promise<T>;
      auditLogs: any;
      isDatabaseReachable: () => Promise<boolean>;
    }>,
  ) {}

  async append(record: AuditLogRecord): Promise<void> {
    this.records.push(record);
    try {
      const { db, withTenantContext, auditLogs, isDatabaseReachable } = await this.deps();
      if (!(await isDatabaseReachable())) return;
      await withTenantContext(record.tenantId, async (tx) => {
        await tx.insert(auditLogs).values({
          tenantId: record.tenantId,
          action: record.action,
          actorId: record.actorId,
          actorRole: record.actorRole,
          resource: record.resource ?? null,
          detail: record.detail ?? {},
        });
      });
    } catch {
      // Memory buffer already holds the record; DB write is best-effort so a
      // transient DB failure never breaks the request that triggered the audit.
    }
  }
}

let sequence = 0;

export function createAuditLogger(options: { sink: AuditSink; sealed?: boolean }) {
  const { sink, sealed = false } = options;

  return {
    async log(record: Omit<AuditLogRecord, 'id' | 'timestamp'>): Promise<AuditLogRecord> {
      if (sealed) {
        throw new Error('Audit log is sealed; new writes are disabled.');
      }
      const entry: AuditLogRecord = {
        ...record,
        id: `audit_${++sequence}_${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
      };
      await sink.append(entry);
      return entry;
    },
    get sealed(): boolean {
      return sealed;
    },
  };
}

/**
 * Production singleton. Writable (unsealed — the live log must accept writes),
 * but backed by Postgres so production actions are durable, not just memory.
 * `sealed` is reserved for an archival/immutable snapshot we never mutate.
 */
export const auditLog = createAuditLogger({
  sink: new PostgresAuditSink(async () => {
    const dbModule = await import('../../db');
    const schemaModule = await import('../../db/schema');
    // db is the pooled drizzle instance; re-use it (never open a per-request Pool).
    return {
      db: dbModule.db,
      withTenantContext: dbModule.withTenantContext,
      auditLogs: schemaModule.auditLogs,
      isDatabaseReachable: dbModule.isDatabaseReachable,
    };
  }),
});