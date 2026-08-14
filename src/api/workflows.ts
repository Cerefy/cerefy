import api from './axios';

export type WorkflowStepType = 'AI_ANALYSIS' | 'APPROVAL' | 'CREATE_DECISION' | 'NOTIFY';

export interface WorkflowStep {
  key: string;
  type: WorkflowStepType;
  config?: Record<string, unknown>;
}

export interface WorkflowDefinition {
  steps: WorkflowStep[];
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  status: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  status: string;
  definition: WorkflowDefinition;
  createdBy: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowVersionId: string;
  tenantId: string;
  status: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  idempotencyKey: string | null;
  createdBy: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface WorkflowApproval {
  id: string;
  workflowRunId: string;
  workflowStepRunId: string;
  tenantId: string;
  status: string;
  requestedRole: string | null;
  requestedUserId: string | null;
  decisionNote: string | null;
  requestedAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

export interface WorkflowRunDetails {
  run: WorkflowRun;
  steps: Array<{ id: string; stepKey: string; stepType: string; status: string; output: Record<string, unknown> | null; error: string | null }>;
  approvals: WorkflowApproval[];
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig?: Record<string, unknown>;
  definition: WorkflowDefinition;
}

export const workflowsApi = {
  async list(): Promise<Workflow[]> {
    const response = await api.get<{ data: Workflow[] }>('/api/v1/workflows');
    return response.data.data;
  },

  async get(workflowId: string): Promise<{ workflow: Workflow; versions: WorkflowVersion[] }> {
    const response = await api.get<{ data: { workflow: Workflow; versions: WorkflowVersion[] } }>(`/api/v1/workflows/${workflowId}`);
    return response.data.data;
  },

  async create(data: CreateWorkflowRequest): Promise<{ workflow: Workflow; version: WorkflowVersion }> {
    const response = await api.post<{ data: { workflow: Workflow; version: WorkflowVersion } }>('/api/v1/workflows', data);
    return response.data.data;
  },

  async publish(workflowId: string, versionId: string): Promise<{ workflow: Workflow; version: WorkflowVersion }> {
    const response = await api.post<{ data: { workflow: Workflow; version: WorkflowVersion } }>(`/api/v1/workflows/${workflowId}/publish`, { versionId });
    return response.data.data;
  },

  async run(workflowId: string, input: Record<string, unknown>, idempotencyKey: string): Promise<{ run: WorkflowRun; replayed: boolean }> {
    const response = await api.post<{ data: { run: WorkflowRun; replayed: boolean } }>(`/api/v1/workflows/${workflowId}/runs`, { input }, { headers: { 'Idempotency-Key': idempotencyKey } });
    return response.data.data;
  },

  async getRun(runId: string): Promise<WorkflowRunDetails> {
    const response = await api.get<{ data: WorkflowRunDetails }>(`/api/v1/workflow-runs/${runId}`);
    return response.data.data;
  },

  async resolveApproval(approvalId: string, status: 'APPROVED' | 'REJECTED', note?: string): Promise<WorkflowApproval> {
    const response = await api.post<{ data: WorkflowApproval }>(`/api/v1/workflow-approvals/${approvalId}/resolve`, { status, note });
    return response.data.data;
  },
};
