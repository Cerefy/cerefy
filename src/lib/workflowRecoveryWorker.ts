import crypto from 'crypto';
import type { Server as SocketIOServer } from 'socket.io';
import { pool, withTenantContext } from '../db';
import { workflowRuns } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { logger } from './logger';
import { executeWorkflowRun } from './workflowRuntime';

const POLL_INTERVAL_MS = 5_000;
const LEASE_DURATION_SECONDS = 120;
const HEARTBEAT_INTERVAL_MS = 30_000;
const MAX_WORKFLOW_ATTEMPTS = 3;

interface ClaimedRun {
  id: string;
  tenantId: string;
  attemptCount: number;
}

/**
 * Database-backed recovery worker for the free-tier single-service pilot.
 * Work is durable in PostgreSQL; execution itself occurs only while the web
 * service is awake. The worker never claims more than one run concurrently.
 */
export class WorkflowRecoveryWorker {
  private readonly ownerId = `web-${process.pid}-${crypto.randomUUID()}`;
  private timer: NodeJS.Timeout | null = null;
  private draining = false;

  constructor(private readonly getSocketServer: () => SocketIOServer | null) {}

  start(): void {
    if (this.timer || process.env.WORKFLOW_RECOVERY_WORKER === 'false') return;
    if (!process.env.DATABASE_URL) {
      logger.info('Workflow recovery worker disabled: DATABASE_URL is not configured');
      return;
    }
    this.timer = setInterval(() => { void this.drainOnce(); }, POLL_INTERVAL_MS);
    this.timer.unref();
    void this.drainOnce();
    logger.info('Workflow recovery worker started', { ownerId: this.ownerId, pollIntervalMs: POLL_INTERVAL_MS });
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  kick(): void {
    void this.drainOnce();
  }

  private async drainOnce(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      const claimed = await this.claimNextRun();
      if (!claimed) return;

      const heartbeat = setInterval(() => { void this.heartbeat(claimed); }, HEARTBEAT_INTERVAL_MS);
      heartbeat.unref();
      try {
        await executeWorkflowRun(claimed.tenantId, claimed.id, this.getSocketServer(), { leaseOwner: this.ownerId });
      } finally {
        clearInterval(heartbeat);
      }
    } catch (error) {
      logger.error('Workflow recovery worker drain failed', { error });
    } finally {
      this.draining = false;
    }
  }

  private async heartbeat(run: ClaimedRun): Promise<void> {
    await withTenantContext(run.tenantId, async (tx) => {
      await tx.update(workflowRuns).set({
        leaseExpiresAt: new Date(Date.now() + LEASE_DURATION_SECONDS * 1_000),
        lastHeartbeatAt: new Date(),
      }).where(and(
        eq(workflowRuns.id, run.id),
        eq(workflowRuns.tenantId, run.tenantId),
        eq(workflowRuns.leaseOwner, this.ownerId),
      ));
    });
  }

  private async claimNextRun(): Promise<ClaimedRun | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.workflow_worker', 'true', true)");
      await client.query(
        `UPDATE workflow_runs
         SET status = 'FAILED',
             error = COALESCE(error, 'Workflow lease expired after the maximum retry count'),
             completed_at = NOW(),
             lease_owner = NULL,
             lease_expires_at = NULL,
             last_heartbeat_at = NULL
         WHERE status = 'RUNNING'
           AND lease_expires_at IS NOT NULL
           AND lease_expires_at <= NOW()
           AND attempt_count >= $1`,
        [MAX_WORKFLOW_ATTEMPTS],
      );
      const result = await client.query<{
        id: string;
        tenant_id: string;
        attempt_count: number;
      }>(
        `WITH candidate AS (
           SELECT id
           FROM workflow_runs
           WHERE attempt_count < $1
             AND (
               (status = 'QUEUED' AND next_attempt_at <= NOW())
               OR (status = 'RUNNING' AND lease_expires_at IS NOT NULL AND lease_expires_at <= NOW())
             )
           ORDER BY created_at ASC
           FOR UPDATE SKIP LOCKED
           LIMIT 1
         )
         UPDATE workflow_runs AS run
         SET status = 'RUNNING',
             attempt_count = run.attempt_count + 1,
             lease_owner = $2,
             lease_expires_at = NOW() + ($3 * INTERVAL '1 second'),
             last_heartbeat_at = NOW(),
             started_at = COALESCE(run.started_at, NOW()),
             error = CASE WHEN run.status = 'RUNNING' THEN 'Recovered expired workflow lease' ELSE NULL END
         FROM candidate
         WHERE run.id = candidate.id
         RETURNING run.id, run.tenant_id, run.attempt_count`,
        [MAX_WORKFLOW_ATTEMPTS, this.ownerId, LEASE_DURATION_SECONDS],
      );
      await client.query('COMMIT');
      const row = result.rows[0];
      if (!row) return null;
      logger.info('Workflow run claimed by recovery worker', { runId: row.id, tenantId: row.tenant_id, attempt: row.attempt_count });
      return { id: row.id, tenantId: row.tenant_id, attemptCount: row.attempt_count };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }
}
