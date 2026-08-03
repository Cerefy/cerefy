import { pgTable, text, timestamp, integer, uuid, customType, real, jsonb } from 'drizzle-orm/pg-core';

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
