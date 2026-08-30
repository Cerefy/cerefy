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
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'general', -- 'general', 'product', 'service', 'faq', 'manual'
  language VARCHAR(10) DEFAULT 'en',
  configuration JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_by_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS kb_workspace_idx ON knowledge_bases(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS kb_type_idx ON knowledge_bases(workspace_id, type) WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. Vector Embeddings (pgvector)
-- ============================================================================
CREATE TABLE IF NOT EXISTS embeddings (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  knowledge_base_id INTEGER REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  source_type VARCHAR(32) NOT NULL, -- 'document_chunk' | 'data_record' | 'faq'
  source_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 / text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS embeddings_workspace_idx ON embeddings(workspace_id);
CREATE INDEX IF NOT EXISTS embeddings_kb_idx ON embeddings(knowledge_base_id);
CREATE INDEX IF NOT EXISTS embeddings_source_idx ON embeddings(source_type, source_id);
-- Note: IVFFlat index requires data; will be added once embeddings are populated

-- ============================================================================
-- 4. Agent Configurations (extensible agent config)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_configurations (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Intelligence
  model VARCHAR(100) DEFAULT 'openai/gpt-4o',
  temperature NUMERIC(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  top_p NUMERIC(3, 2) DEFAULT 1.0,
  
  -- System prompt
  system_instructions TEXT,
  personality VARCHAR(200),
  tone VARCHAR(50) DEFAULT 'professional', -- 'concise' | 'professional' | 'friendly' | 'technical'
  
  -- Language
  primary_language VARCHAR(10) DEFAULT 'en',
  supported_languages TEXT[] DEFAULT ARRAY['en'],
  dialects TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Capabilities
  enabled_channels TEXT[] DEFAULT ARRAY['chat']::TEXT[], -- 'chat', 'whatsapp', 'voice', 'email', 'api'
  enabled_modalities TEXT[] DEFAULT ARRAY['text']::TEXT[], -- 'text', 'image', 'audio', 'video'
  tool_ids TEXT[] DEFAULT ARRAY[]::TEXT[], -- list of tool names agent can use
  
  -- Knowledge
  knowledge_base_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  
  -- Behavior
  guardrails JSONB DEFAULT '{}',
  workflow_id INTEGER REFERENCES workflows(id) ON DELETE SET NULL,
  rule_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  
  -- Memory
  enable_short_term_memory BOOLEAN DEFAULT TRUE,
  enable_long_term_memory BOOLEAN DEFAULT TRUE,
  enable_user_memory BOOLEAN DEFAULT TRUE,
  memory_window INTEGER DEFAULT 10, -- last N messages to keep in context
  
  -- Limits
  max_concurrent_conversations INTEGER DEFAULT 100,
  context_window_tokens INTEGER DEFAULT 8000,
  rate_limit_per_minute INTEGER DEFAULT 60,
  
  -- Voice (if enabled)
  voice_config JSONB DEFAULT '{}',
  
  -- Country/Region
  country_code VARCHAR(2),
  region VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS agent_config_agent_idx ON agent_configurations(agent_id);
CREATE INDEX IF NOT EXISTS agent_config_workspace_idx ON agent_configurations(workspace_id);

-- ============================================================================
-- 5. Business Rules Engine
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_rules (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 100, -- lower = higher priority
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Condition (JSON DSL)
  condition JSONB NOT NULL,
  
  -- Actions
  actions JSONB NOT NULL,
  
  -- Metadata
  created_by_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS rules_workspace_idx ON business_rules(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rules_agent_idx ON business_rules(agent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rules_priority_idx ON business_rules(workspace_id, priority) WHERE deleted_at IS NULL AND enabled = TRUE;

-- ============================================================================
-- 6. Workflow Edges (graph structure for workflows)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflow_edges (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  from_node_id INTEGER NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  to_node_id INTEGER NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  condition TEXT, -- expression or null for default edge
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS workflow_edges_workflow_idx ON workflow_edges(workflow_id);
CREATE INDEX IF NOT EXISTS workflow_edges_from_idx ON workflow_edges(from_node_id);

-- ============================================================================
-- 7. Tool Definitions (registry of available tools)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tool_definitions (
  id VARCHAR(100) PRIMARY KEY, -- e.g., 'salesforce.create_case'
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'crm', 'erp', 'communication', 'knowledge', 'data', 'custom'
  version VARCHAR(20) DEFAULT '1.0.0',
  input_schema JSONB,
  output_schema JSONB,
  auth_type VARCHAR(20) DEFAULT 'none', -- 'none', 'api_key', 'oauth2', 'basic'
  required_scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  rate_limit_per_minute INTEGER DEFAULT 60,
  enabled BOOLEAN DEFAULT TRUE,
  implementation VARCHAR(50) DEFAULT 'builtin', -- 'builtin', 'mcp', 'webhook'
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 8. Agent Tool Assignments (which tools can each agent use)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_tool_assignments (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tool_id VARCHAR(100) NOT NULL REFERENCES tool_definitions(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(agent_id, tool_id)
);
CREATE INDEX IF NOT EXISTS agent_tool_agent_idx ON agent_tool_assignments(agent_id);
CREATE INDEX IF NOT EXISTS agent_tool_workspace_idx ON agent_tool_assignments(workspace_id);

-- ============================================================================
-- 9. Country Configurations (multi-country support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS country_configs (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  country_code VARCHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
  language VARCHAR(10) NOT NULL,
  currency VARCHAR(3),
  timezone VARCHAR(50),
  warranty_period VARCHAR(50),
  data_residency VARCHAR(50),
  regulations TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_channels TEXT[] DEFAULT ARRAY[]::TEXT[],
  phone_numbers TEXT[] DEFAULT ARRAY[]::TEXT[],
  knowledge_base_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  service_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(workspace_id, agent_id, country_code)
);
CREATE INDEX IF NOT EXISTS country_workspace_idx ON country_configs(workspace_id);
CREATE INDEX IF NOT EXISTS country_agent_idx ON country_configs(agent_id);

-- ============================================================================
-- 10. Channel Configurations
-- ============================================================================
CREATE TABLE IF NOT EXISTS channel_configs (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  channel_type VARCHAR(30) NOT NULL, -- 'whatsapp', 'voice', 'email', 'slack', 'teams'
  enabled BOOLEAN DEFAULT TRUE,
  configuration JSONB NOT NULL DEFAULT '{}', -- channel-specific config (phone numbers, API keys, etc.)
  business_hours JSONB DEFAULT '{}',
  greeting_message TEXT,
  outside_hours_message TEXT,
  max_concurrent INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(workspace_id, agent_id, channel_type)
);
CREATE INDEX IF NOT EXISTS channel_workspace_idx ON channel_configs(workspace_id);
CREATE INDEX IF NOT EXISTS channel_agent_idx ON channel_configs(agent_id);

-- ============================================================================
-- 11. Seed: Default tool definitions
-- ============================================================================
INSERT INTO tool_definitions (id, name, description, category, auth_type, implementation) VALUES
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
