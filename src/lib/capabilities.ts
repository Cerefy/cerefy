// src/lib/capabilities.ts
// ─────────────────────────────────────────────────────────────────────────────
// Capability Flag System — the anti-fabrication mechanism from the Cerefy
// target-state architecture ("Part 1 — Target-State Frontend Architecture").
//
// SINGLE SOURCE OF TRUTH for what is real versus planned. Every feature area
// is either:
//   implemented   → full UI + real API calls
//   partial       → UI built, some sub-features gated
//   not_implemented → architecture + empty state only, CTA disabled/"Coming Soon"
//   planned       → roadmap teaser only
//
// Before ANY page is rendered, the route resolves its capability. If a feature
// is not implemented, the page composes EmptyState — never simulated data.
//
// Phase 1 audit output lives here. When a backend feature ships, move the flag
// from not_implemented → partial → implemented in the same PR.
// ─────────────────────────────────────────────────────────────────────────────

export type CapabilityStatus = 'implemented' | 'partial' | 'not_implemented' | 'planned';

export interface CapabilityEntry {
  status: CapabilityStatus;
  /** Real endpoints the UI may call for this area. Empty = none exposed yet. */
  endpoints: readonly string[];
  /** Short human note describing actual backend support (no marketing copy). */
  note: string;
}

export const CAPABILITIES = {
  auth: {
    status: 'implemented',
    endpoints: ['/api/v1/auth/register', '/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/me'],
    note: 'JWT auth + refresh + /me profile. CAVEAT: refresh issues a new token without validating the presented token, and the dev user store is in-memory plaintext — fine for dev, not for pilot.',
  },
  projects: {
    status: 'implemented',
    endpoints: ['/api/v1/projects', '/api/v1/projects/:id'],
    note: 'CRUD projects, tenant-scoped, RLS in DB.',
  },
  decisions: {
    status: 'partial',
    endpoints: ['/api/v1/decisions', '/api/v1/decisions/:id/approve', '/api/v1/decisions/:id/reject'],
    note: 'Approve/reject are backed by real Express + Drizzle endpoints; simulation reaches the real endpoint and surfaces backend-unavailable errors without fabrication. Missing backend capability: a real decision-simulation service and persisted simulation result contract.',
  },
  aiPipeline: {
    status: 'partial',
    endpoints: ['/api/v1/ai/run', '/api/v1/agents/execute', '/api/v1/ai/pipeline/run'],
    note: 'LangGraph supervisor pipeline (supervisor→memory→discovery→analyst→governance) executes for real. §11 guardrail wired: real answer text + retrieved sources propagate into runGuardrails, escalate/refuse → REVIEW_REQUIRED. Confidence derived from real evidence coverage. Provider provenance (modelId/promptVersion/tokens/cost) recorded from the executing agent chokepoint; ai_queries/ai_answers durable in prod.',
  },
  agents: {
    status: 'partial',
    endpoints: ['/api/v1/agents', '/api/v1/agents/:agentId', '/api/v1/agents/execute'],
    note: 'Roster reads real agent_registry rows and execution-history metrics. Missing backend/UI contract: the agent execute endpoint requires a task/query payload that this roster does not supply, so execution is not wired; no dedicated marketplace API exists.',
  },
  ingestion: {
    status: 'implemented',
    endpoints: ['/api/v1/ingestion/chunk'],
    note: 'Document chunking + embeddings via Gemini; tenant-scoped.',
  },
  knowledgeGraph: {
    status: 'partial',
    endpoints: ['/api/v1/graph/cypher'],
    note: 'Read-only graph queries return persisted graph_entities and graph_entity_links; the Cypher string is honored only as a label filter. Missing backend capability: no graph create, update, or delete mutation endpoints exist.',
  },
  memory: {
    status: 'partial',
    endpoints: ['/api/v1/ai/memory/query', '/api/v1/memory/documents'],
    note: 'Knowledge-memory documents and search are backed by real document rows and vector-memory/decision-history queries. Missing backend capability: no memory write/ingest management endpoint is exposed from this surface.',
  },
  analytics: {
    status: 'partial',
    endpoints: ['/api/v1/analytics/executive-kpis', '/api/v1/analytics/agent-performance', '/api/v1/analytics/projects/:projectId'],
    note: 'Executive KPIs, agent performance, and decision records are backed by real endpoints. Missing backend capability: no chart/time-series, dedicated ROI breakdown, or export endpoints exist.',
  },
  arabicIntelligence: {
    status: 'not_implemented',
    endpoints: [],
    note: 'Client-side lib exists in src/intelligence but NO HTTP routes are exposed (/api/v1/intelligence/* absent). Arabic-aware context composes but has no deployed API.',
  },
  menaMarkets: {
    status: 'not_implemented',
    endpoints: [],
    note: 'MENA market catalog is a client-side constant only; /api/v1/intelligence/markets does not exist. No deployed API.',
  },
  workflows: {
    status: 'not_implemented',
    endpoints: [],
    note: 'Backend workflow engine scaffolded in deprecated/enterprise/workflow; no production route yet. Drag/drop builder planned.',
  },
  billing: {
    status: 'not_implemented',
    endpoints: [],
    note: 'No billing backend. Invoice manually MVP. Render plan empty state.',
  },
  crm: { status: 'planned', endpoints: [], note: 'CRM module in target IA, not built.' },
  finance: { status: 'planned', endpoints: [], note: 'Finance intelligence hub planned.' },
  hr: { status: 'planned', endpoints: [], note: 'HR intelligence hub planned.' },
  automations: { status: 'planned', endpoints: [], note: 'Automations planned.' },
  integrations: { status: 'planned', endpoints: [], note: 'Connectors marketplace: catalog planned, no live connectors yet.' },
  voiceIntelligence: { status: 'planned', endpoints: [], note: 'Voice agent planned.' },
  ocr: { status: 'not_implemented', endpoints: ['/api/v1/ingestion/chunk'], note: 'OCR proper not implemented; text ingestion is real.' },
  governance: {
    status: 'partial',
    endpoints: ['/api/v1/audit'],
    note: 'GET /api/v1/audit real (requirePermission read:audit) returning tenant-filtered audit_log rows. Governance UI renders honest empty state until more governance endpoints ship.',
  },
  audit: {
    status: 'partial',
    endpoints: ['/api/v1/ai/answers/:answerId/reconstruction', '/api/v1/ai/answers/:answerId/outcome'],
    note: 'Durable audit_log table (drizzle/0005) + tenant RLS; prod actions (ai.run, project edit/delete, decision approve/reject, answer outcome) logged via PostgresAuditSink. Reconstruction/outcome endpoints real, tenant-filtered, and flag-gated (outcome_linking flag).',
  },
  orgManagement: {
    status: 'partial',
    endpoints: ['/api/v1/auth/me'],
    note: 'Org profile + members admin: DB schema scaffolding present (RLS), UI surface partial.',
  },
  models: {
    status: 'partial',
    endpoints: ['/api/v1/ai/run'],
    note: 'Agent LLM calls chokepoint through one abstraction (src/ai/llm.ts runAgentLlm via providerRegistry); retrieved content isolated with isolateRetrievedContent; provenance recorded from the executing call. Live agent code no longer imports provider SDKs directly.',
  },
  developerPortal: { status: 'planned', endpoints: [], note: 'REST API keys portal planned.' },
  monitoring: {
    status: 'partial',
    endpoints: ['/health/ready', '/health/live', '/api/slo', '/api/metrics/render'],
    note: 'Health + SLO + metrics-render endpoints real (metrics per-request OTel). Analytics dashboard endpoints are dev-fallback only.',
  },
} as const;

export type CapabilityKey = keyof typeof CAPABILITIES;

export function getCapability(key: CapabilityKey): CapabilityEntry {
  return CAPABILITIES[key];
}

export const isImplemented = (key: CapabilityKey): boolean => CAPABILITIES[key].status === 'implemented';
export const isPartial = (key: CapabilityKey): boolean => CAPABILITIES[key].status === 'partial';
export const isAvailable = (key: CapabilityKey): boolean =>
  CAPABILITIES[key].status === 'implemented' || CAPABILITIES[key].status === 'partial';

/** Route-level capability map for const-routes to gate every screen. */
export const ROUTE_CAPABILITIES: Record<string, CapabilityKey> = {
  '/': 'auth',
  '/login': 'auth',
  '/register': 'auth',
  '/workspace': 'projects',
  '/workspace/dashboard': 'projects',
  '/workspace/agents': 'agents',
  '/workspace/decisions': 'decisions',
  '/workspace/projects': 'projects',
  '/workspace/knowledge': 'ingestion',
  '/workspace/graph': 'knowledgeGraph',
  '/workspace/memory': 'memory',
  '/workspace/analytics': 'analytics',
  '/workspace/integrations': 'integrations',
  '/workspace/governance': 'governance',
  '/workspace/security': 'audit',
  '/workspace/settings': 'orgManagement',
  '/workspace/billing': 'billing',
  '/workspace/developer': 'developerPortal',
  '/workspace/observability': 'monitoring',
  '/workspace/mena/countries': 'menaMarkets',
  '/workspace/mena/markets': 'menaMarkets',
  '/workspace/mena/industries': 'menaMarkets',
  '/workspace/ai': 'aiPipeline',
} as const;