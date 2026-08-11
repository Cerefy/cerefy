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
  capabilities: jsonb('capabilities').notNull(),
  tools: jsonb('tools').notNull(),
  status: text('status').default('ACTIVE').notNull(),
  executionHistory: jsonb('execution_history').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
