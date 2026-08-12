// src/api/agents.ts
// AI Agent execution API service

import api from './axios';

export interface AgentExecutionRequest {
  query: string;
  sessionId?: string;
  agentId?: string;
  context?: Record<string, unknown>;
}

export interface AgentExecutionStep {
  agentName: string;
  role: string;
  status: string;
  output: string;
  durationMs: number;
}

export interface AgentExecutionResponse {
  status: string;
  tenantId: string;
  userId: string;
  sessionId: string;
  latencyMs: number;
  plan: AgentExecutionStep[];
  response: string;
  reflectionCritique: string;
  reflectionAttempts: number;
  tokensUsed: number;
  timestamp: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'idle' | 'busy' | 'reflecting' | 'offline';
  skills: string[];
  performanceScore: number;
  monthlyCost: string;
  tools: string[];
  permissions: string[];
}

export const agentsApi = {
  async execute(data: AgentExecutionRequest): Promise<AgentExecutionResponse> {
    const response = await api.post<AgentExecutionResponse>('/api/v1/agents/execute', data);
    return response.data;
  },

  async listAgents(): Promise<AgentProfile[]> {
    const response = await api.get<{ data: AgentProfile[] }>('/api/v1/agents');
    return response.data.data;
  },

  async getAgent(agentId: string): Promise<AgentProfile> {
    const response = await api.get<{ data: AgentProfile }>(`/api/v1/agents/${agentId}`);
    return response.data.data;
  },

  async runPipeline(pipelineId: string, input: Record<string, unknown>): Promise<AgentExecutionResponse> {
    const response = await api.post<AgentExecutionResponse>(`/api/v1/ai/pipeline/run`, {
      pipelineId,
      input,
    });
    return response.data;
  },

  async executeAgent(agentId: string): Promise<AgentExecutionResponse> {
    const response = await api.post<AgentExecutionResponse>('/api/v1/agents/execute', { agentId });
    return response.data;
  },
};
