-- SOPRANOVA Architecture v1.0: Configuration & Knowledge Engine
-- Adds: pgvector embeddings, agent configurations, business rules, knowledge bases, tool definitions

-- ============================================================================
-- 1. Enable pgvector extension for semantic search
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2. Knowledge Bases (per-tenant knowledge isolation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id SERIAL PRIMARY KEY,
  "workspaceId" INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'general',
  language VARCHAR(10) DEFAULT 'en',
  configuration JSONB DEFAULT '{}',
  "isPublic" BOOLEAN DEFAULT FALSE,
  "createdById" INTEGER REFERENCES users(id),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "deletedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS kb_workspace_idx ON "knowledge_bases"("workspaceId") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS kb_type_idx ON "knowledge_bases"("workspaceId", type) WHERE "deletedAt" IS NULL;

-- ============================================================================
-- 3. Vector Embeddings (pgvector)
-- ============================================================================
CREATE TABLE IF NOT EXISTS embeddings (
  id SERIAL PRIMARY KEY,
  "workspaceId" INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  "knowledgeBaseId" INTEGER REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  "sourceType" VARCHAR(32) NOT NULL,
  "sourceId" INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_embeddings_composite ON "embeddings"("workspaceId", "sourceType", "sourceId");
CREATE INDEX IF NOT EXISTS embeddings_workspace_idx ON "embeddings"("workspaceId");
CREATE INDEX IF NOT EXISTS embeddings_kb_idx ON "embeddings"("knowledgeBaseId");
CREATE INDEX IF NOT EXISTS embeddings_source_idx ON "embeddings"("sourceType", "sourceId");

-- ============================================================================
-- 4. Agent Configurations (extensible agent config)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_configurations (
  id SERIAL PRIMARY KEY,
  "agentId" INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
  "workspaceId" INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  model VARCHAR(100) DEFAULT 'openai/gpt-4o',
  temperature NUMERIC(3, 2) DEFAULT 0.7,
  "maxTokens" INTEGER DEFAULT 4096,
  "topP" NUMERIC(3, 2) DEFAULT 1.0,
  "systemInstructions" TEXT,
  personality VARCHAR(200),
  tone VARCHAR(50) DEFAULT 'professional',
  "primaryLanguage" VARCHAR(10) DEFAULT 'en',
  "supportedLanguages" TEXT[] DEFAULT ARRAY['en'],
  dialects TEXT[] DEFAULT ARRAY[]::TEXT[],
  "enabledChannels" TEXT[] DEFAULT ARRAY['chat']::TEXT[],
  "enabledModalities" TEXT[] DEFAULT ARRAY['text']::TEXT[],
  "toolIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "knowledgeBaseIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  guardrails JSONB DEFAULT '{}',
  "workflowId" INTEGER REFERENCES workflows(id) ON DELETE SET NULL,
  "ruleIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  "enableShortTermMemory" BOOLEAN DEFAULT TRUE,
  "enableLongTermMemory" BOOLEAN DEFAULT TRUE,
  "enableUserMemory" BOOLEAN DEFAULT TRUE,
  "memoryWindow" INTEGER DEFAULT 10,
  "maxConcurrentConversations" INTEGER DEFAULT 100,
  "contextWindowTokens" INTEGER DEFAULT 8000,
  "rateLimitPerMinute" INTEGER DEFAULT 60,
  "voiceConfig" JSONB DEFAULT '{}',
  "countryCode" VARCHAR(2),
  region VARCHAR(50),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS agent_config_agent_idx ON "agent_configurations"("agentId");
CREATE INDEX IF NOT EXISTS agent_config_workspace_idx ON "agent_configurations"("workspaceId");

-- ============================================================================
-- 5. Business Rules Engine
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_rules (
  id SERIAL PRIMARY KEY,
  "workspaceId" INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  "agentId" INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 100,
  enabled BOOLEAN DEFAULT TRUE,
  condition JSONB NOT NULL,
  actions JSONB NOT NULL,
  "createdById" INTEGER REFERENCES users(id),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "deletedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS rules_workspace_idx ON "business_rules"("workspaceId") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS rules_agent_idx ON "business_rules"("agentId") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS rules_priority_idx ON "business_rules"("workspaceId", priority) WHERE "deletedAt" IS NULL AND enabled = TRUE;

-- ============================================================================
-- 6. Workflow Edges (graph structure for workflows)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflow_edges (
  id SERIAL PRIMARY KEY,
  "workflowId" INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  "fromNodeId" INTEGER NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  "toNodeId" INTEGER NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  condition TEXT,
  priority INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS workflow_edges_workflow_idx ON "workflow_edges"("workflowId");
CREATE INDEX IF NOT EXISTS workflow_edges_from_idx ON "workflow_edges"("fromNodeId");

-- ============================================================================
-- 7. Tool Definitions (registry of available tools)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tool_definitions (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  version VARCHAR(20) DEFAULT '1.0.0',
  "inputSchema" JSONB,
  "outputSchema" JSONB,
  "authType" VARCHAR(20) DEFAULT 'none',
  "requiredScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "rateLimitPerMinute" INTEGER DEFAULT 60,
  enabled BOOLEAN DEFAULT TRUE,
  implementation VARCHAR(50) DEFAULT 'builtin',
  configuration JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 8. Agent Tool Assignments (which tools can each agent use)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_tool_assignments (
  id SERIAL PRIMARY KEY,
  "agentId" INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  "workspaceId" INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  "toolId" VARCHAR(100) NOT NULL REFERENCES tool_definitions(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  configuration JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("agentId", "toolId")
);
CREATE INDEX IF NOT EXISTS agent_tool_agent_idx ON "agent_tool_assignments"("agentId");
CREATE INDEX IF NOT EXISTS agent_tool_workspace_idx ON "agent_tool_assignments"("workspaceId");

-- ============================================================================
-- 9. Country Configurations (multi-country support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS country_configs (
  id SERIAL PRIMARY KEY,
  "workspaceId" INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  "agentId" INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  "countryCode" VARCHAR(2) NOT NULL,
  language VARCHAR(10) NOT NULL,
  currency VARCHAR(3),
  timezone VARCHAR(50),
  "warrantyPeriod" VARCHAR(50),
  "dataResidency" VARCHAR(50),
  regulations TEXT[] DEFAULT ARRAY[]::TEXT[],
  "preferredChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "phoneNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "knowledgeBaseIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  "serviceRules" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("workspaceId", "agentId", "countryCode")
);
CREATE INDEX IF NOT EXISTS country_workspace_idx ON "country_configs"("workspaceId");
CREATE INDEX IF NOT EXISTS country_agent_idx ON "country_configs"("agentId");

-- ============================================================================
-- 10. Channel Configurations
-- ============================================================================
CREATE TABLE IF NOT EXISTS channel_configs (
  id SERIAL PRIMARY KEY,
  "workspaceId" INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  "agentId" INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  "channelType" VARCHAR(30) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  configuration JSONB NOT NULL DEFAULT '{}',
  "businessHours" JSONB DEFAULT '{}',
  "greetingMessage" TEXT,
  "outsideHoursMessage" TEXT,
  "maxConcurrent" INTEGER DEFAULT 10,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("workspaceId", "agentId", "channelType")
);
CREATE INDEX IF NOT EXISTS channel_workspace_idx ON "channel_configs"("workspaceId");
CREATE INDEX IF NOT EXISTS channel_agent_idx ON "channel_configs"("agentId");

-- ============================================================================
-- 11. Seed: Default tool definitions
-- ============================================================================
INSERT INTO tool_definitions (id, name, description, category, "authType", implementation) VALUES
  ('create_ticket', 'Create Service Ticket', 'Create a new support ticket', 'service', 'api_key', 'builtin'),
  ('lookup_customer', 'Lookup Customer', 'Retrieve customer information by email or ID', 'crm', 'api_key', 'builtin'),
  ('check_order', 'Check Order Status', 'Get the current status of an order', 'commerce', 'api_key', 'builtin'),
  ('book_meeting', 'Book Meeting', 'Schedule a meeting on the calendar', 'communication', 'oauth2', 'builtin'),
  ('send_email', 'Send Email', 'Send an email to a recipient', 'communication', 'oauth2', 'builtin'),
  ('search_products', 'Search Products', 'Search the product catalog', 'commerce', 'api_key', 'builtin'),
  ('get_invoice', 'Get Invoice', 'Retrieve an invoice by ID', 'finance', 'api_key', 'builtin'),
  ('create_lead', 'Create Lead', 'Create a new sales lead in CRM', 'crm', 'api_key', 'builtin'),
  ('update_crm', 'Update CRM Record', 'Update a record in the CRM system', 'crm', 'api_key', 'builtin'),
  ('web_search', 'Web Search', 'Perform a web search for current information', 'knowledge', 'none', 'builtin'),
  ('execute_sql', 'Execute SQL Query', 'Run a read-only SQL query', 'data', 'none', 'builtin'),
  ('webhook_call', 'Call Webhook', 'Make an HTTP call to a custom webhook', 'custom', 'none', 'builtin'),
  ('escalate_to_human', 'Escalate to Human', 'Hand off the conversation to a human agent', 'service', 'none', 'builtin'),
  ('check_warranty', 'Check Warranty Status', 'Look up warranty status for a product', 'service', 'api_key', 'builtin'),
  ('create_salesforce_case', 'Create Salesforce Case', 'Create a new case in Salesforce Service Cloud', 'crm', 'oauth2', 'builtin'),
  ('lookup_salesforce_case', 'Lookup Salesforce Case', 'Retrieve a Salesforce case by ID', 'crm', 'oauth2', 'builtin'),
  ('book_technician', 'Book Technician Visit', 'Schedule a technician visit for field service', 'service', 'api_key', 'builtin'),
  ('send_whatsapp', 'Send WhatsApp Message', 'Send a WhatsApp message to a user', 'communication', 'oauth2', 'builtin')
ON CONFLICT (id) DO NOTHING;
