ALTER TABLE workflow_runs
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lease_owner text,
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamp,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamp,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamp NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS workflow_runs_worker_claim_idx
  ON workflow_runs (status, next_attempt_at, lease_expires_at, created_at);

-- CREATE_DECISION is an effectful workflow step. The unique step reference lets
-- a recovered run return the original decision instead of creating a duplicate.
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS workflow_step_run_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS decisions_workflow_step_run_unique
  ON decisions (workflow_step_run_id)
  WHERE workflow_step_run_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS workflow_approvals_step_run_unique
  ON workflow_approvals (workflow_step_run_id);

-- The application normally operates under one tenant RLS context. The internal
-- recovery worker is the sole exception: it sets app.workflow_worker=true inside
-- a short database transaction to atomically find and lease one eligible run,
-- then switches back to the run's ordinary tenant context for execution.
DROP POLICY IF EXISTS tenant_isolation_workflow_runs ON workflow_runs;
CREATE POLICY tenant_isolation_workflow_runs ON workflow_runs
  USING (
    tenant_id = current_setting('app.current_tenant', true)
    OR current_setting('app.workflow_worker', true) = 'true'
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)
    OR current_setting('app.workflow_worker', true) = 'true'
  );
