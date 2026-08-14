import { defineContract } from './validate';

/**
 * Strict request contracts for the externally exposed, state-changing API paths.
 * These are deliberately allow-lists: accepting an undocumented field is a
 * compatibility and security risk, not a convenience.
 */
export const apiContracts = {
  outcome: defineContract({
    fields: {
      achieved: { type: 'boolean', required: true },
      note: { type: 'string', max: 4_000 },
    },
  }),
  register: defineContract({
    fields: {
      email: { type: 'string', required: true, min: 3, max: 320 },
      password: { type: 'string', required: true, min: 12, max: 1_024 },
      firstName: { type: 'string', required: true, min: 1, max: 100 },
      lastName: { type: 'string', required: true, min: 1, max: 100 },
      organizationName: { type: 'string', max: 200 },
    },
  }),
  login: defineContract({
    fields: {
      email: { type: 'string', required: true, min: 3, max: 320 },
      password: { type: 'string', required: true, min: 1, max: 1_024 },
    },
  }),
  refresh: defineContract({
    fields: { refreshToken: { type: 'string', required: true, min: 1, max: 8_192 } },
  }),
  logout: defineContract({
    fields: { refreshToken: { type: 'string', max: 8_192 } },
  }),
  createProject: defineContract({
    fields: {
      title: { type: 'string', required: true, min: 1, max: 240 },
      code: { type: 'string', max: 64 },
      department: { type: 'string', max: 160 },
      status: { type: 'string', max: 80 },
      progress: { type: 'number', min: 0, max: 100 },
      budget: { type: 'number', min: 0 },
      dueDate: { type: 'string', max: 40 },
    },
  }),
  updateProject: defineContract({
    fields: {
      title: { type: 'string', min: 1, max: 240 },
      code: { type: 'string', max: 64 },
      department: { type: 'string', max: 160 },
      status: { type: 'string', max: 80 },
      progress: { type: 'number', min: 0, max: 100 },
      budget: { type: 'number', min: 0 },
      dueDate: { type: 'string', max: 40 },
    },
  }),
  createDecision: defineContract({
    fields: {
      title: { type: 'string', required: true, min: 1, max: 240 },
      question: { type: 'string', required: true, min: 1, max: 10_000 },
      category: { type: 'string', max: 100 },
    },
  }),
  rejectDecision: defineContract({
    fields: { reason: { type: 'string', max: 4_000 } },
  }),
  createWorkflow: defineContract({
    fields: {
      name: { type: 'string', required: true, min: 1, max: 200 },
      description: { type: 'string', max: 4_000 },
      triggerType: { type: 'string', required: true, min: 1, max: 80 },
      triggerConfig: { type: 'object' },
      definition: { type: 'object', required: true },
    },
  }),
  publishWorkflow: defineContract({
    fields: { versionId: { type: 'string', required: true, min: 1, max: 128 } },
  }),
  runWorkflow: defineContract({
    fields: { input: { type: 'object', default: {} } },
  }),
  resolveApproval: defineContract({
    fields: {
      status: { type: 'string', required: true, enum: ['APPROVED', 'REJECTED'] },
      note: { type: 'string', max: 4_000 },
    },
  }),
  aiRun: defineContract({
    fields: {
      type: { type: 'string', required: true, min: 1, max: 100 },
      documentId: { type: 'string', max: 128 },
      projectId: { type: 'string', max: 128 },
      documents: { type: 'array', default: [] },
      requirements: { type: 'array', default: [] },
      decisions: { type: 'array', default: [] },
      metadata: { type: 'object', default: {} },
    },
  }),
  pipelineRun: defineContract({
    fields: { pipelineId: { type: 'string', required: true, min: 1, max: 128 } },
  }),
  agentExecute: defineContract({
    fields: {
      query: { type: 'string', required: true, min: 1, max: 20_000 },
      sessionId: { type: 'string', max: 128, default: 'sess_default' },
    },
  }),
  memoryQuery: defineContract({
    fields: { query: { type: 'string', required: true, min: 1, max: 20_000 } },
  }),
  ingestChunk: defineContract({
    fields: {
      content: { type: 'string', required: true, min: 1, max: 1_000_000 },
      chunkSize: { type: 'number', min: 100, max: 4_000, default: 300 },
      chunkOverlap: { type: 'number', min: 0, max: 1_000, default: 40 },
      title: { type: 'string', max: 500, default: 'Document' },
    },
  }),
  graphQuery: defineContract({
    fields: { cypher: { type: 'string', max: 2_000 } },
  }),
} as const;
