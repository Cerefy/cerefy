import { pgTable, text, timestamp, integer, uuid, customType, real, jsonb, boolean } from 'drizzle-orm/pg-core';

// Custom pgvector type for Drizzle
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  title: text('title').notNull(),
  code: text('code').notNull(),
  department: text('department'),
  status: text('status').default('Planning'),
  progress: integer('progress').default(0),
  budget: text('budget'),
  dueDate: text('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  title: text('title').notNull(),
  mimeType: text('mime_type').default('text/plain'),
  rawContent: text('raw_content'),
  status: text('status').default('uploaded'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const decisions = pgTable('decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  title: text('title').notNull(),
  question: text('question').notNull(),
  riskScore: integer('risk_score').default(0),
  businessImpact: text('business_impact'),
  expectedROI: text('expected_roi'),
  confidenceScore: real('confidence_score').default(0),
  status: text('status').default('OPEN'),
  aiRecommendation: text('ai_recommendation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const agentExecutions = pgTable('agent_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  projectId: text('project_id'),
  documentId: text('document_id'),
  type: text('type').notNull(),
  status: text('status').default('RUNNING').notNull(),
  currentAgent: text('current_agent').default('supervisor').notNull(),
  confidence: real('confidence').default(0).notNull(),
  input: jsonb('input').notNull(),
  output: jsonb('output'),
  eventLog: jsonb('event_log').notNull(),
  errors: jsonb('errors').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const agentRegistry = pgTable('agent_registry', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  role: text('role'),
  department: text('department'),
  description: text('description'),
  capabilities: jsonb('capabilities').notNull(),
  tools: jsonb('tools').notNull(),
  permissions: jsonb('permissions').default([]).notNull(),
  monthlyCost: text('monthly_cost'),
  status: text('status').default('ACTIVE').notNull(),
  executionHistory: jsonb('execution_history').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** Organizations — one row per tenant. `tenantId` is the public tenant key carried by JWTs. */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull().unique(),
  name: text('name').notNull(),
  plan: text('plan').default('trial').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** Users — global identity table. RLS exposes a row to its own tenant context, or to the
 *  pre-auth email lookup (`app.auth_email` session setting) so login/register can resolve
 *  an account by email before any tenant context exists. Global email uniqueness is
 *  enforced by the unique index; a duplicate surfaces as a constraint violation -> 409. */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role').default('admin').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** Organization membership — extra users inside an organization (invitees later). */
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').default('member').notNull(),
  invitedBy: uuid('invited_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** Refresh-token sessions — server-side revocation. Tenant-scoped like every row. */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  refreshHash: text('refresh_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** Knowledge graph entities — real, persisted at ingestion time (Postgres-backed). */
export const graphEntities = pgTable('graph_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  label: text('label'),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'set null' }),
  source: text('source').default('ingestion').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const graphEntityLinks = pgTable('graph_entity_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  sourceEntityId: uuid('source_entity_id').references(() => graphEntities.id, { onDelete: 'cascade' }),
  targetEntityId: uuid('target_entity_id').references(() => graphEntities.id, { onDelete: 'cascade' }),
  relation: text('relation').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiQueries = pgTable('ai_queries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  modelVersion: text('model_version'),
  promptVersion: text('prompt_version'),
  tokensInput: integer('tokens_input').default(0).notNull(),
  tokensOutput: integer('tokens_output').default(0).notNull(),
  costUsd: real('cost_usd').default(0).notNull(),
  status: text('status').default('RUNNING').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aiAnswers = pgTable('ai_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  queryId: uuid('query_id').references(() => aiQueries.id, { onDelete: 'set null' }),
  modelVersion: text('model_version').notNull(),
  promptVersion: text('prompt_version').notNull(),
  confidence: real('confidence').default(0).notNull(),
  output: jsonb('output').notNull(),
  humanReviewStatus: text('human_review_status').default('PENDING').notNull(),
  humanEdited: boolean('human_edited').default(false).notNull(),
  humanReviewNote: text('human_review_note'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  sources: jsonb('sources').default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** §7 durable audit trail — tenant-scoped, append-only-by-convention. */
export const auditLogs = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  action: text('action').notNull(),
  actorId: text('actor_id').notNull(),
  actorRole: text('actor_role').notNull(),
  resource: text('resource'),
  detail: jsonb('detail').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Arabic Intelligence: per-organization AI profile. One row per tenant —
// Country + Industry + Language + Dialect + response style used to compose
// Arabic-aware context. Tenant-scoped like every other row in this schema.
export const organizationIntelligenceProfiles = pgTable('organization_intelligence_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull().unique(),
  country: text('country'), // ISO 3166 alpha-2, e.g. 'SA'
  marketId: text('market_id'), // references MAP_MARKET_CATALOG id
  industryId: text('industry_id'), // references INDUSTRIES id
  language: text('language').default('en'), // 'ar' | 'en' | 'both'
  dialect: text('dialect').default('msa'),
  responseStyle: text('response_style').default('formal'), // 'formal' | 'concise' | 'detailed'
  terminology: jsonb('terminology').$type<string[]>().default([]), // extra org-specific Arabic terms
  policies: jsonb('policies').$type<string[]>().default([]), // naming-only policy refs, never raw instructions
  dataResidency: text('data_residency').default('MENA'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
