-- SOPRANOVA Enhanced Tables Migration
-- Phase 9: Memory System
CREATE TABLE IF NOT EXISTS memory_entries (
  id SERIAL PRIMARY KEY,
  "workspaceId" INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL,
  scope VARCHAR(32) NOT NULL,
  "scopeId" INTEGER,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  "expiresAt" TIMESTAMP,
  "accessCount" INTEGER DEFAULT 0,
  "lastAccessedAt" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_memory_entries_composite ON "memory_entries"("workspaceId", type, scope, "scopeId", key);
CREATE INDEX IF NOT EXISTS memory_workspace_type_idx ON "memory_entries"("workspaceId", type);
CREATE INDEX IF NOT EXISTS memory_workspace_scope_idx ON "memory_entries"("workspaceId", scope, "scopeId");

-- Phase 7: Observability Traces
CREATE TABLE IF NOT EXISTS traces (
  id VARCHAR(128) PRIMARY KEY,
  "workspaceId" INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  "userId" INTEGER REFERENCES users(id),
  "agentId" INTEGER REFERENCES agents(id),
  "conversationId" INTEGER,
  status VARCHAR(16) DEFAULT 'ok',
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP,
  "totalDurationMs" INTEGER,
  metadata JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS traces_workspace_idx ON "traces"("workspaceId", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS trace_spans (
  id VARCHAR(128) PRIMARY KEY,
  "traceId" VARCHAR(128) NOT NULL REFERENCES traces(id) ON DELETE CASCADE,
  "parentSpanId" VARCHAR(128),
  name VARCHAR(255) NOT NULL,
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP,
  "durationMs" INTEGER,
  status VARCHAR(16) DEFAULT 'ok',
  attributes JSONB DEFAULT '{}',
  events JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS trace_spans_trace_idx ON "trace_spans"("traceId");

-- Phase 6: Evaluation Runs
CREATE TABLE IF NOT EXISTS eval_runs (
  id VARCHAR(128) PRIMARY KEY,
  "workspaceId" INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  "testCases" JSONB NOT NULL,
  results JSONB NOT NULL,
  summary JSONB NOT NULL,
  "startedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS eval_runs_workspace_idx ON "eval_runs"("workspaceId", "createdAt" DESC);

-- Phase 4: Enhanced Integrations
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS "webhookSecret" VARCHAR(255);
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS "syncConfig" JSONB DEFAULT '{}';

-- Phase 3: Agent Tools Configuration
ALTER TABLE agents ADD COLUMN IF NOT EXISTS "toolConfig" JSONB DEFAULT '{}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS model VARCHAR(128);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS temperature REAL DEFAULT 0.7;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS "maxTokens" INTEGER DEFAULT 2000;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS "systemPrompt" TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS "welcomeMessage" TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS "fallbackMessage" TEXT;

-- Phase 5: API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(128) PRIMARY KEY,
  "workspaceId" INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(160) NOT NULL,
  "keyPrefix" VARCHAR(16) NOT NULL,
  "keyHash" VARCHAR(128) NOT NULL UNIQUE,
  scopes JSONB DEFAULT '["*"]',
  "rateLimit" INTEGER DEFAULT 100,
  "expiresAt" TIMESTAMP,
  "lastUsedAt" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS api_keys_workspace_idx ON "api_keys"("workspaceId");
CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON "api_keys"("keyHash");

-- Phase 10: Widget Templates
CREATE TABLE IF NOT EXISTS widget_templates (
  id SERIAL PRIMARY KEY,
  "workspaceId" INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  type VARCHAR(32) NOT NULL,
  template JSONB NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
