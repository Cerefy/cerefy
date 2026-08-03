// src/api/analytics.ts
// Analytics API service for executive KPIs and agent performance

import api from './axios';

export interface ExecutiveKPIs {
  totalProjects: number;
  activeAgents: number;
  decisionsThisMonth: number;
  avgConfidenceScore: number;
  totalBudgetManaged: string;
  projectCompletionRate: number;
  agentUtilization: number;
  riskScore: number;
  automationRate: number;
  costSavings: string;
  roiMultiple: number;
  processingTime: string;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  tasksCompleted: number;
  avgLatencyMs: number;
  successRate: number;
  tokensUsed: number;
  costIncurred: string;
  lastActive: string;
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
