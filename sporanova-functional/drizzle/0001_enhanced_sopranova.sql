-- SOPRANOVA Enhanced Tables Migration
-- Phase 9: Memory System
CREATE TABLE IF NOT EXISTS memory_entries (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL,
  scope VARCHAR(32) NOT NULL,
  scope_id INTEGER,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS memory_workspace_type_idx ON memory_entries(workspace_id, type);
CREATE INDEX IF NOT EXISTS memory_workspace_scope_idx ON memory_entries(workspace_id, scope, scope_id);

-- Phase 7: Observability Traces
CREATE TABLE IF NOT EXISTS traces (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  agent_id INTEGER REFERENCES agents(id),
  conversation_id INTEGER,
  status VARCHAR(16) DEFAULT 'ok',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  total_duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS traces_workspace_idx ON traces(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trace_spans (
  id VARCHAR(128) PRIMARY KEY,
  trace_id VARCHAR(128) NOT NULL REFERENCES traces(id) ON DELETE CASCADE,
  parent_span_id VARCHAR(128),
  name VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_ms INTEGER,
  status VARCHAR(16) DEFAULT 'ok',
  attributes JSONB DEFAULT '{}',
  events JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS trace_spans_trace_idx ON trace_spans(trace_id);

-- Phase 6: Evaluation Runs
CREATE TABLE IF NOT EXISTS eval_runs (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  test_cases JSONB NOT NULL,
  results JSONB NOT NULL,
  summary JSONB NOT NULL,
  started_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS eval_runs_workspace_idx ON eval_runs(workspace_id, created_at DESC);

-- Phase 4: Enhanced Integrations
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255);
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS sync_config JSONB DEFAULT '{}';

-- Phase 3: Agent Tools Configuration
ALTER TABLE agents ADD COLUMN IF NOT EXISTS tool_config JSONB DEFAULT '{}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS model VARCHAR(128);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS temperature REAL DEFAULT 0.7;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 2000;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS welcome_message TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS fallback_message TEXT;

-- Phase 5: API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(160) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  key_hash VARCHAR(128) NOT NULL UNIQUE,
  scopes JSONB DEFAULT '["*"]',
  rate_limit INTEGER DEFAULT 100,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS api_keys_workspace_idx ON api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys(key_hash);

-- Phase 10: Widget Templates
CREATE TABLE IF NOT EXISTS widget_templates (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  type VARCHAR(32) NOT NULL,
  template JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
