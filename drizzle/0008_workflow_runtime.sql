CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'DRAFT',
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  version integer NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  definition jsonb NOT NULL,
  created_by text NOT NULL,
  published_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT workflow_versions_workflow_version_unique UNIQUE (workflow_id, version)
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  workflow_version_id uuid NOT NULL REFERENCES workflow_versions(id) ON DELETE RESTRICT,
  tenant_id text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED',
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error text,
  idempotency_key text,
  created_by text NOT NULL,
  started_at timestamp,
  completed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS workflow_runs_tenant_idempotency_unique
  ON workflow_runs (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS workflow_step_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id uuid NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  step_key text NOT NULL,
  step_type text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED',
  attempt integer NOT NULL DEFAULT 0,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error text,
  started_at timestamp,
  completed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT workflow_step_runs_run_step_unique UNIQUE (workflow_run_id, step_key)
);

CREATE TABLE IF NOT EXISTS workflow_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id uuid NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  workflow_step_run_id uuid NOT NULL REFERENCES workflow_step_runs(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  requested_role text,
  requested_user_id text,
  decision_note text,
  requested_at timestamp NOT NULL DEFAULT now(),
  resolved_by text,
  resolved_at timestamp
);

CREATE TABLE IF NOT EXISTS workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id uuid NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workflows_tenant_status_idx ON workflows (tenant_id, status);
CREATE INDEX IF NOT EXISTS workflow_versions_tenant_workflow_idx ON workflow_versions (tenant_id, workflow_id);
CREATE INDEX IF NOT EXISTS workflow_runs_tenant_status_idx ON workflow_runs (tenant_id, status, created_at);
CREATE INDEX IF NOT EXISTS workflow_step_runs_tenant_run_idx ON workflow_step_runs (tenant_id, workflow_run_id);
CREATE INDEX IF NOT EXISTS workflow_approvals_tenant_status_idx ON workflow_approvals (tenant_id, status);
CREATE INDEX IF NOT EXISTS workflow_events_tenant_run_idx ON workflow_events (tenant_id, workflow_run_id, created_at);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows FORCE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals FORCE ROW LEVEL SECURITY;
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_workflows ON workflows;
CREATE POLICY tenant_isolation_workflows ON workflows
  USING (tenant_id = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_workflow_versions ON workflow_versions;
CREATE POLICY tenant_isolation_workflow_versions ON workflow_versions
  USING (tenant_id = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_workflow_runs ON workflow_runs;
CREATE POLICY tenant_isolation_workflow_runs ON workflow_runs
  USING (tenant_id = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_workflow_step_runs ON workflow_step_runs;
CREATE POLICY tenant_isolation_workflow_step_runs ON workflow_step_runs
  USING (tenant_id = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_workflow_approvals ON workflow_approvals;
CREATE POLICY tenant_isolation_workflow_approvals ON workflow_approvals
  USING (tenant_id = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
DROP POLICY IF EXISTS tenant_isolation_workflow_events ON workflow_events;
CREATE POLICY tenant_isolation_workflow_events ON workflow_events
  USING (tenant_id = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
