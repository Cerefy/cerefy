// src/api/analytics.ts
// Analytics API service for executive KPIs and agent performance.
// Nullable fields are deliberately unavailable until Cerefy persists the
// measurement; the UI must render an honest unavailable state rather than infer.

import api from './axios';

export interface ExecutiveKPIs {
  totalProjects: number;
  activeAgents: number;
  decisionsThisMonth: number;
  avgConfidenceScore: number | null;
  totalBudgetManaged: null;
  projectCompletionRate: number | null;
  agentUtilization: null;
  riskScore: number | null;
  automationRate: null;
  costSavings: null;
  roiMultiple: null;
  processingTime: null;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  tasksCompleted: number;
  avgLatencyMs: number | null;
  successRate: number | null;
  tokensUsed: number | null;
  costIncurred: string | null;
  lastActive: string | null;
}

export const analyticsApi = {
  async getExecutiveKPIs(): Promise<ExecutiveKPIs> {
    const response = await api.get<ExecutiveKPIs>('/api/v1/analytics/executive-kpis');
    return response.data;
  },

  async getAgentPerformance(): Promise<AgentPerformance[]> {
    const response = await api.get<{ data: AgentPerformance[] }>('/api/v1/analytics/agent-performance');
    return response.data.data;
  },

  async getProjectAnalytics(projectId: string) {
    const response = await api.get(`/api/v1/analytics/projects/${projectId}`);
    return response.data;
  },
};
