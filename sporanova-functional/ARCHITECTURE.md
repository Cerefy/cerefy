# SOPRANOVA Core Architecture Specification

## Vision

SOPRANOVA is a **production-ready multi-tenant AI Agent Operating Platform** — not a single chatbot, but an infrastructure for deploying configurable AI agents across industries.

```
                    SOPRANOVA CORE PLATFORM
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      Haier Agent    Samsung Agent    Accent Agent
      (Italy)         (Gulf)          (Italy)
          │                │                │
     Configuration    Configuration    Configuration
```

Each agent is a **configuration layer** over a shared core. No code changes needed for new verticals.

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│                  CHANNEL LAYER                       │
│   Web Chat │ WhatsApp │ Voice │ Email │ API │ Slack  │
├─────────────────────────────────────────────────────┤
│              BUSINESS RULES ENGINE                   │
│   IF/THEN │ Escalation │ SLA │ Approval │ Workflows │
├─────────────────────────────────────────────────────┤
│              WORKFLOW ENGINE                         │
│   Graph Execution │ State Machine │ Branching        │
├─────────────────────────────────────────────────────┤
│              TOOL ENGINE (Plugin System)             │
│   Salesforce │ SAP │ ServiceNow │ Custom │ Calendar  │
├─────────────────────────────────────────────────────┤
│              AGENT ENGINE                            │
│   Runtime │ Instructions │ Model │ Personality        │
├─────────────────────────────────────────────────────┤
│              KNOWLEDGE ENGINE                        │
│   RAG │ Documents │ Embeddings │ Knowledge Graph     │
├─────────────────────────────────────────────────────┤
│              MEMORY ENGINE                           │
│   Short-term │ User │ Company │ Agent │ Long-term     │
├─────────────────────────────────────────────────────┤
│              MULTIMODAL ENGINE                       │
│   Text │ Image │ Audio │ Video │ Vision              │
├─────────────────────────────────────────────────────┤
│              ANALYTICS ENGINE                        │
│   Traces │ Metrics │ Insights │ Cost │ Evaluation    │
├─────────────────────────────────────────────────────┤
│              SECURITY ENGINE                         │
│   RBAC │ API Keys │ SSO │ GDPR │ Encryption          │
├─────────────────────────────────────────────────────┤
│              MULTI-TENANT ISOLATION                  │
│   Organization │ Workspace │ Data Isolation           │
└─────────────────────────────────────────────────────┘
```

---

## 1. Multi-Tenancy Model

### Hierarchy

```
Platform (SOPRANOVA)
└── Organization (Haier)
    └── Workspace (After-Sales Italy)
        ├── Agent (Haier Service AI)
        ├── Knowledge (Haier Product Docs)
        ├── Tools (Salesforce, SAP)
        ├── Workflows (Service Workflow)
        ├── Rules (Escalation Rules)
        └── Integrations (WhatsApp, Voice)
```

### Isolation Rules

| Scope | Isolation | Example |
|-------|-----------|---------|
| Organization | Hard boundary | Haier cannot see Samsung data |
| Workspace | Soft boundary | After-Sales vs Marketing within Haier |
| Agent | Config boundary | Agent A uses Tools X, Agent B uses Tools Y |

### Database Isolation

All tables include `workspaceId` as a tenant key. Every query is scoped:

```sql
-- All data queries are automatically workspace-scoped
WHERE workspaceId = :currentWorkspaceId
```

---

## 2. Agent Configuration Model

An Agent is a **first-class entity** — not code, but a configuration object.

```typescript
interface AgentConfiguration {
  // Identity
  id: number;
  workspaceId: number;
  name: string;                    // "Haier After-Sales AI"
  slug: string;                    // "haier-after-sales"
  description: string;
  
  // Intelligence
  model: string;                   // "gpt-4o" | "claude-sonnet" | "gemini-pro"
  temperature: number;             // 0.0 - 1.0
  maxTokens: number;
  systemInstructions: string;      // Full system prompt
  personality: string;             // "Professional, empathetic, technical"
  tone: "concise" | "professional" | "friendly" | "technical";
  
  // Language
  primaryLanguage: string;         // "it" | "ar" | "en"
  supportedLanguages: string[];    // ["it", "en", "ar"]
  dialects: string[];              // ["egyptian", "gulf", "levantine"]
  
  // Capabilities
  channels: ChannelConfig;         // Which channels are enabled
  tools: string[];                 // ["salesforce", "sap", "email"]
  modalities: Modalities;          // { text: true, image: true, voice: true }
  
  // Knowledge
  knowledgeBases: number[];        // References to knowledge base IDs
  
  // Behavior
  guardrails: GuardrailConfig;     // Content safety, escalation rules
  workflowId: number | null;       // Associated workflow
  rules: RuleConfig[];             // Business rules
  
  // Memory
  memoryConfig: MemoryConfig;      // Short-term, long-term, user memory settings
  
  // Limits
  rateLimits: RateLimitConfig;     // Per-channel rate limits
  maxConcurrentConversations: number;
  contextWindowTokens: number;
}
```

### Agent Lifecycle

```
Draft → Configuring → Ready → Active → Paused → Archived
  │         │            │        │        │         │
  │    Set model,    Test in    Live    Suspend   Archive
  │    prompt,       playground  traffic         agent
  │    tools
  │         │            │        │        │
  └─────────┴────────────┴────────┴────────┘
              Edit at any time
```

---

## 3. Knowledge Engine

### Knowledge Hierarchy

```
Organization
└── Knowledge Base (per agent or shared)
    ├── Source: Document Upload (PDF, DOCX, TXT)
    ├── Source: Web Crawl
    ├── Source: API Sync (Salesforce, Zendesk)
    ├── Source: FAQ Import
    ├── Source: Product Catalog
    └── Source: Video Transcript
        └── Chunks (500-1000 tokens each)
            └── Embeddings (vector representation)
```

### RAG Pipeline

```
User Query
    │
    ├── Query Understanding
    │   ├── Intent Classification
    │   ├── Entity Extraction
    │   ├── Language Detection
    │   └── Dialect Detection (Arabic)
    │
    ├── Retrieval (Hybrid)
    │   ├── BM25 Keyword Search
    │   ├── Vector Semantic Search (pgvector)
    │   └── Knowledge Graph Traversal
    │
    ├── Reranking
    │   └── Cross-encoder reranking
    │
    ├── Context Assembly
    │   ├── Top-K chunks
    │   ├── Source attribution
    │   └── Token budget management
    │
    └── Generation
        ├── LLM call with context
        ├── Grounded response
        └── Source citations
```

### Multi-Base Isolation

```
Haier Agent
├── Haier Product Knowledge (private)
├── Haier Service Manuals (private)
└── General Appliance Knowledge (shared)

Samsung Agent
├── Samsung Product Knowledge (private)
└── General Electronics Knowledge (shared)
```

---

## 4. Tool Engine (Plugin System)

### Tool Registry

```typescript
interface ToolDefinition {
  id: string;                    // "salesforce.create_case"
  name: string;                  // "Create Salesforce Case"
  description: string;
  category: string;              // "crm" | "erp" | "communication" | "custom"
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  authType: "api_key" | "oauth2" | "basic";
  
  // Agent assignment
  requiredScopes: string[];      // OAuth scopes needed
  rateLimit: number;             // Calls per minute
  
  // Implementation
  handler: "builtin" | "mcp" | "webhook";
  mcpServerId?: string;          // MCP server reference
  webhookUrl?: string;           // Custom API endpoint
}
```

### Built-in Tools

| Tool | Category | Status |
|------|----------|--------|
| `create_ticket` | Service | Mock |
| `lookup_customer` | CRM | Mock |
| `check_order` | Commerce | Mock |
| `book_meeting` | Calendar | Mock |
| `send_email` | Communication | Mock |
| `search_products` | Commerce | Mock |
| `get_invoice` | Finance | Mock |
| `create_lead` | CRM | Mock |
| `update_crm` | CRM | Mock |
| `web_search` | Knowledge | Real (API) |
| `execute_sql` | Data | Real (DB) |
| `webhook_call` | Custom | Real (HTTP) |

### MCP (Model Context Protocol) Integration

```
Tool Registry
├── Built-in tools (SOPRANOVA native)
├── MCP tools (external servers)
│   ├── Salesforce MCP Server
│   ├── HubSpot MCP Server
│   ├── Shopify MCP Server
│   └── Custom MCP Server
└── Webhook tools (custom APIs)
```

### Agent Tool Assignment

```typescript
// Haier Agent
tools: ["salesforce.create_case", "salesforce.lookup_case", "email.send", "calendar.book"]

// Samsung Agent  
tools: ["salesforce.create_case", "warranty.check", "replacement.process"]
```

---

## 5. Workflow Engine

### Workflow Definition

```typescript
interface Workflow {
  id: number;
  workspaceId: number;
  name: string;
  description: string;
  
  // Graph definition
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  // Trigger
  trigger: {
    type: "manual" | "agent_request" | "event" | "schedule";
    event?: string;              // "case.created" | "warranty.expired"
    schedule?: string;           // cron expression
  };
}

interface WorkflowNode {
  id: string;
  type: "start" | "action" | "condition" | "transform" | "end" | "escalate";
  configuration: Record<string, unknown>;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;            // "resolved === true"
}
```

### Haier After-Sales Workflow Example

```
[Start: Customer Contact]
        │
        ▼
[Action: Product Identification]
        │
        ▼
[Action: Remote Diagnosis]
        │
        ▼
[Condition: Can resolve remotely?]
        │
   ┌────┴────┐
   │ YES     │ NO
   ▼         ▼
[Action:    [Action: Create
Guide       Salesforce Case]
Customer]       │
   │            ▼
   │       [Action: Book
   │        Technician]
   │            │
   ▼            ▼
[End: Resolved] [End: Escalated]
```

### Samsung Warranty Workflow

```
[Start: Customer Contact]
        │
        ▼
[Action: Product Identification]
        │
        ▼
[Action: Warranty Check API]
        │
        ▼
[Condition: Under warranty?]
        │
   ┌────┴────┐
   │ YES     │ NO
   ▼         ▼
[Condition: [Action: Offer
Eligible    Paid Service]
for         │
Replace?]   ▼
   │     [End: Service
   │      Offered]
   ├──YES──┐
   ▼       ▼
[Action:  [Action:
Process   Create Repair
Replace-  Case]
ment]        │
   │         ▼
   ▼     [Action: Book
[End:     Technician]
Replaced]     │
              ▼
          [End: Repair
           Scheduled]
```

---

## 6. Business Rules Engine

### Rule Definition

```typescript
interface BusinessRule {
  id: number;
  workspaceId: number;
  agentId: number | null;        // null = workspace-level rule
  name: string;
  description: string;
  priority: number;              // Lower = higher priority
  
  // Condition (DSL or JSON)
  condition: RuleCondition;
  
  // Actions
  actions: RuleAction[];
  
  // Metadata
  enabled: boolean;
  createdBy: number;
}

type RuleCondition =
  | { type: "comparison"; field: string; operator: "eq" | "neq" | "gt" | "lt" | "contains" | "in"; value: unknown }
  | { type: "and"; conditions: RuleCondition[] }
  | { type: "or"; conditions: RuleCondition[] }
  | { type: "not"; condition: RuleCondition };

type RuleAction =
  | { type: "set_field"; field: string; value: unknown }
  | { type: "escalate"; reason: string; priority: "high" | "critical" }
  | { type: "route"; destination: string }
  | { type: "notify"; channel: string; template: string }
  | { type: "create_case"; system: string; template: Record<string, unknown> }
  | { type: "delay"; duration: string }
  | { type: "end"; status: string };
```

### Haier Rules Example

```json
{
  "name": "Escalate unresolved technical issues",
  "condition": {
    "type": "and",
    "conditions": [
      { "type": "comparison", "field": "issue_type", "operator": "eq", "value": "technical" },
      { "type": "comparison", "field": "remote_resolution", "operator": "eq", "value": false }
    ]
  },
  "actions": [
    { "type": "create_case", "system": "salesforce", "template": { "priority": "high" } },
    { "type": "escalate", "reason": "Remote resolution failed", "priority": "high" }
  ]
}
```

```json
{
  "name": "Inform expired warranty",
  "condition": {
    "type": "and",
    "conditions": [
      { "type": "comparison", "field": "warranty_status", "operator": "eq", "value": "expired" }
    ]
  },
  "actions": [
    { "type": "set_field", "field": "response_template", "value": "warranty_expired_message" },
    { "type": "notify", "channel": "email", "template": "warranty_offer_paid_service" }
  ]
}
```

---

## 7. Voice Channel

### Architecture

```
Customer Phone Call
        │
        ▼
Telephony Gateway (Twilio / Vonage / Custom SIP)
        │
        ▼
SOPRANOVA Voice Gateway
    ├── WebSocket Audio Stream
    │
    ├── Speech-to-Text (Whisper / Deepgram / Azure STT)
    │   ├── Streaming transcription
    │   ├── Language detection
    │   └── Dialect detection
    │
    ├── Agent Core
    │   ├── Same as text agent
    │   ├── Context from conversation history
    │   └── Tool execution
    │
    ├── Text-to-Speech (Azure TTS / ElevenLabs / PlayHT)
    │   ├── Voice selection per agent
    │   ├── SSML support
    │   └── Streaming audio response
    │
    └── Handoff
        ├── Voice → WhatsApp (send image/video)
        ├── Voice → Human agent
        └── Voice → SMS (link to web portal)
```

### Agent Voice Configuration

```typescript
interface VoiceConfig {
  enabled: boolean;
  
  // STT
  sttProvider: "whisper" | "deepgram" | "azure";
  sttLanguage: string;
  sttDialect?: string;
  
  // TTS
  ttsProvider: "azure" | "elevenlabs" | "playht";
  ttsVoice: string;              // Voice ID
  ttsSpeed: number;              // 0.5 - 2.0
  ttsPitch: number;
  
  // Behavior
  greeting: string;              // "Buongiorno, come posso aiutarla?"
  holdMessage: string;
  transferMessage: string;
  maxSilenceSeconds: number;
  
  // Business hours
  businessHours: {
    timezone: string;
    schedule: Record<string, { start: string; end: string }>;
  };
  outsideHoursMessage: string;
  
  // Limits
  maxCallDurationSeconds: number;
  maxTurns: number;
  
  // Recording
  recordCalls: boolean;
  storagePolicy: "30_days" | "90_days" | "1_year" | "never";
}
```

---

## 8. Country Layer

### Country Configuration

```typescript
interface CountryConfig {
  countryCode: string;           // "IT" | "SA" | "AE" | "EG"
  language: string;              // "it" | "ar" | "en"
  currency: string;              // "EUR" | "SAR" | "AED" | "EGP"
  timezone: string;
  
  // Service rules
  warrantyPeriod: string;        // "2 years"
  serviceRules: string;          // Reference to rules engine
  
  // Compliance
  dataResidency: string;         // "EU" | "GCC" | "LOCAL"
  regulations: string[];         // ["GDPR", "PDPL"]
  
  // Channels
  preferredChannels: string[];   // ["whatsapp", "voice"]
  phoneNumbers: string[];
  
  // Knowledge
  knowledgeBaseIds: number[];    // Country-specific knowledge
}
```

### Haier Multi-Country

```
Haier Organization
├── After-Sales Italy
│   ├── Language: Italian
│   ├── Currency: EUR
│   ├── Regulations: GDPR
│   └── Knowledge: Italian product manuals
│
├── After-Sales Saudi Arabia
│   ├── Language: Arabic (Gulf)
│   ├── Currency: SAR
│   ├── Regulations: PDPL
│   └── Knowledge: Arabic product manuals
│
└── After-Sales Egypt
    ├── Language: Arabic (Egyptian)
    ├── Currency: EGP
    ├── Regulations: PDPL
    └── Knowledge: Arabic product manuals
```

---

## 9. Memory Engine

### Memory Types

| Type | Scope | TTL | Use Case |
|------|-------|-----|----------|
| Short-term | Conversation | Session | Current conversation context |
| User Profile | Per user | Permanent | User preferences, history |
| Company Knowledge | Per organization | Permanent | Company-wide learnings |
| Agent Memory | Per agent | Configurable | Agent-specific learnings |
| Long-term | Cross-conversation | Configurable | Persistent insights |

### Memory Architecture

```
Memory Engine
├── Short-term (Redis / In-Memory)
│   └── Current conversation context
│       └── Last N messages, tool results
│
├── User Profile (PostgreSQL)
│   └── user_preferences table
│       └── Preferences, interaction history
│
├── Company Knowledge (PostgreSQL)
│   └── memory_entries table (scope: "company")
│       └── Learnings, FAQs, procedures
│
├── Agent Memory (PostgreSQL)
│   └── memory_entries table (scope: "agent")
│       └── Conversation patterns, common issues
│
└── Long-term (PostgreSQL + Vector)
    └── memory_entries table (scope: "long_term")
        └── Persistent insights, learned behaviors
```

---

## 10. Analytics & Observability

### Trace Pipeline

```
Agent Interaction
    │
    ├── Trace Created
    │   ├── traceId
    │   ├── workspaceId
    │   ├── agentId
    │   └── conversationId
    │
    ├── Spans
    │   ├── query_understanding (intent, entities, language)
    │   ├── retrieval (BM25 hits, vector hits, reranked)
    │   ├── reasoning (LLM tokens, model, latency)
    │   ├── tool_execution (tool name, input, output, duration)
    │   ├── response_generation (tokens, latency)
    │   └── total (end-to-end)
    │
    └── Metrics Extracted
        ├── Latency (p50, p95, p99)
        ├── Token usage (input, output, total)
        ├── Cost (per model, per tool)
        ├── Success rate
        └── User satisfaction (implicit)
```

### Dashboard Metrics

| Metric | Source | Refresh |
|--------|--------|---------|
| Total conversations | DB count | Real-time |
| Messages today | DB count | Real-time |
| Active agents | Agent status | Real-time |
| Avg response time | Traces | 5 min |
| Resolution rate | Agent runs | Hourly |
| Token usage | Traces | Real-time |
| Cost breakdown | Traces | Hourly |
| Top topics | Message mining | Daily |
| Error rate | Traces | Real-time |

---

## 11. Security Model

### RBAC Matrix

| Permission | Owner | Admin | Member | Viewer |
|-----------|-------|-------|--------|--------|
| workspace.manage | ✅ | ❌ | ❌ | ❌ |
| agent.create | ✅ | ✅ | ❌ | ❌ |
| agent.update | ✅ | ✅ | ❌ | ❌ |
| agent.delete | ✅ | ❌ | ❌ | ❌ |
| agent.view | ✅ | ✅ | ✅ | ✅ |
| conversation.view | ✅ | ✅ | ✅ | ✅ |
| conversation.delete | ✅ | ✅ | ❌ | ❌ |
| knowledge.manage | ✅ | ✅ | ❌ | ❌ |
| knowledge.view | ✅ | ✅ | ✅ | ✅ |
| analytics.view | ✅ | ✅ | ✅ | ❌ |
| settings.manage | ✅ | ✅ | ❌ | ❌ |
| billing.manage | ✅ | ❌ | ❌ | ❌ |
| member.manage | ✅ | ✅ | ❌ | ❌ |
| audit.view | ✅ | ✅ | ❌ | ❌ |
| api_key.manage | ✅ | ✅ | ❌ | ❌ |

### Data Protection

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt (12 rounds) |
| Session tokens | SHA-256 hash stored, random 48-byte token |
| API keys | SHA-256 hash stored, random 32-byte key |
| Sensitive data at rest | AES-256-GCM encryption |
| Data export (GDPR) | Full user data export endpoint |
| Data deletion (GDPR) | Cascading soft delete |
| Audit logging | All mutations logged |
| Rate limiting | Per-IP, per-user, per-API-key |

---

## 12. API Architecture

### Internal API (tRPC)

```
/api/trpc/
├── auth.*                    # Registration, login, session
├── workspaces.*              # Workspace CRUD, bootstrap
├── agents.*                  # Agent CRUD and execution
├── agentEnhanced.*           # Agent with full configuration
├── chat.*                    # Chat send/stream/history
├── rag.*                     # Search, documents
├── conversations.*           # Conversation management
├── intelligence.*            # AI intelligence queries
├── analytics.*               # Business analytics
├── analyticsEnhanced.*       # AI-enhanced analytics
├── observability.*           # Traces, metrics
├── memory.*                  # Memory management
├── memoryEnhanced.*          # Enhanced memory
├── playground.*              # LLM playground
├── integrations.*            # Integration management
├── security.*                # API keys, audit
├── developerApi.*            # Public API management
├── workflows.*               # Workflow CRUD
├── dataSources.*             # Data source management
├── documents.*               # Document management
├── notifications.*           # Notification management
├── dashboard.*               # Dashboard data
├── preferences.*             # User preferences
└── system.*                  # Health check
```

### Public API (Developer)

```
/api/v1/
├── POST /agents              # Create agent
├── GET  /agents              # List agents
├── POST /chat                # Send message
├── GET  /conversations       # List conversations
├── GET  /analytics           # Get analytics
└── GET  /health              # Health check
```

### Webhook API

```
POST /webhook/agent/:agentId
├── Header: X-Webhook-Secret: <secret>
├── Body: { event, data, timestamp }
└── Response: { status, result }
```

---

## 13. Database Schema (Current vs Required)

### Current (28 tables) — COMPLETED

All core tables exist and are functional.

### Required Additions

| Table | Purpose | Priority |
|-------|---------|----------|
| `agent_configurations` | Full agent config (model, prompt, tools, etc.) | HIGH |
| `knowledge_bases` | Knowledge base definitions | HIGH |
| `knowledge_sources` | Sources within a knowledge base | HIGH |
| `embeddings` | Vector embeddings (pgvector) | HIGH |
| `business_rules` | Rule definitions | HIGH |
| `workflow_edges` | Graph edges for workflows | MEDIUM |
| `country_configs` | Country-specific configuration | MEDIUM |
| `tool_definitions` | Registered tool definitions | MEDIUM |
| `tool_assignments` | Which agent can use which tool | MEDIUM |
| `voice_configs` | Voice channel configuration | LOW |
| `channel_configs` | Multi-channel configuration | LOW |

### Vector Embeddings (pgvector)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  knowledge_base_id INTEGER NOT NULL REFERENCES knowledge_bases(id),
  source_id INTEGER NOT NULL REFERENCES knowledge_sources(id),
  chunk_id INTEGER NOT NULL REFERENCES document_chunks(id),
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,  -- OpenAI ada-002 dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeddings_workspace ON embeddings(workspace_id);
CREATE INDEX idx_embeddings_knowledge_base ON embeddings(knowledge_base_id);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## 14. Phased Implementation Roadmap

### Phase 1: Core Platform Hardening ✅ (DONE)

- [x] Multi-tenant architecture (Org → Workspace → Agent)
- [x] Auth system (Registration, Login, OAuth, Password Reset)
- [x] RBAC (4 roles, 30 permissions)
- [x] tRPC API layer (60+ procedures)
- [x] Database schema (28 tables)
- [x] Worker system (job queue)
- [x] Document processing (PDF, DOCX, XLSX)
- [x] Client UI (30+ pages, 55+ components)
- [x] LLM abstraction (multi-provider)

### Phase 2: Agent Configuration System (CURRENT)

- [ ] `agent_configurations` table with full config
- [ ] Agent config editor UI
- [ ] Model selection with cost estimation
- [ ] System prompt editor with variables
- [ ] Tool assignment interface
- [ ] Personality / tone configuration
- [ ] Language / dialect settings
- [ ] Agent testing playground (per-agent)

### Phase 3: Knowledge + RAG (NEXT)

- [ ] pgvector integration
- [ ] Embedding generation pipeline
- [ ] Vector search with hybrid retrieval
- [ ] Knowledge base CRUD
- [ ] Source management (upload, web crawl, API)
- [ ] Chunk management UI
- [ ] Knowledge base isolation per agent
- [ ] Arabic-specific tokenization

### Phase 4: Tools & Integrations

- [ ] Tool registry with DB persistence
- [ ] Tool assignment per agent
- [ ] OAuth2 flow for Salesforce, HubSpot, etc.
- [ ] Real webhook_call tool
- [ ] MCP server connections
- [ ] Tool execution logging
- [ ] Tool rate limiting

### Phase 5: Workflow + Business Rules

- [ ] Workflow graph editor UI
- [ ] Condition / transform node execution
- [ ] Business rules engine
- [ ] Rule builder UI
- [ ] Rule evaluation at runtime
- [ ] Escalation workflows
- [ ] SLA tracking

### Phase 6: Multimodal + Voice

- [ ] Voice channel (STT/TTS integration)
- [ ] Image analysis (Vision API)
- [ ] Video transcription
- [ ] Voice configuration per agent
- [ ] Phone → WhatsApp handoff
- [ ] Voice recording + storage

### Phase 7: Haier Agent (First Vertical)

- [ ] Haier Organization + Workspace creation
- [ ] Haier knowledge base (product manuals, service guides)
- [ ] Haier service workflow (diagnosis → resolution → case)
- [ ] Haier business rules (warranty, escalation)
- [ ] Haier tools (Salesforce, SAP integration)
- [ ] Haier agent configuration (Italian, technical tone)
- [ ] Haier demo environment

### Phase 8: Haier Demo

- [ ] Production-like demo with real data
- [ ] Live chat demo
- [ ] Voice demo
- [ ] Analytics dashboard demo
- [ ] Integration demo (Salesforce case creation)

### Phase 9: Deployment & Scaling

- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] Auto-scaling policies
- [ ] CDN for static assets
- [ ] Database connection pooling
- [ ] Redis for caching/sessions
- [ ] Monitoring (Datadog/Grafana)
- [ ] CI/CD pipeline

---

## 15. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Runtime | Node.js + TypeScript | Shared language, fast iteration |
| API | tRPC v11 | Type-safe, no code generation |
| Database | PostgreSQL + Drizzle ORM | Relational + JSONB + pgvector |
| Cache | Redis (planned) | Sessions, rate limiting, caching |
| Search | pgvector + BM25 | Hybrid retrieval, no external dependency |
| LLM | OpenAI / Anthropic / Azure | Multi-provider flexibility |
| STT | Whisper / Deepgram | Streaming, multilingual |
| TTS | Azure TTS / ElevenLabs | Natural voices, SSML |
| Frontend | React 19 + Tailwind + Radix | Modern, accessible, composable |
| Build | Vite 7 + esbuild | Fast builds |
| Storage | AWS S3 | Document storage |
| Email | Resend | Transactional email |
| Auth | Custom + OAuth2 | Full control |

---

## 16. Configuration vs Code Principle

> **"Every new agent should require ZERO code changes."**

| What Changes | Where |
|-------------|-------|
| Agent personality | `systemInstructions` field |
| Tools available | `tools` array in agent config |
| Knowledge sources | Knowledge base associations |
| Business rules | Rules engine configuration |
| Workflow | Workflow definition |
| Channels | Channel configuration |
| Language | Language settings |
| Voice | Voice configuration |
| Branding | Widget template customization |

| What NEVER Changes | Why |
|-------------------|-----|
| Agent Engine | Core runtime |
| Memory Engine | Shared infrastructure |
| RAG Engine | Shared infrastructure |
| Security Engine | Platform-wide |
| Analytics Engine | Shared infrastructure |

---

*Last updated: 2026-08-30*
*SOPRANOVA Architecture v1.0*
