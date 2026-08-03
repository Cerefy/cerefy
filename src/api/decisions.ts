// src/api/decisions.ts
// Decision Governance API service

import api from './axios';

export interface Decision {
  id: string;
  title: string;
  question: string;
  category: string;
  riskScore: number;
  businessImpact: string;
  expectedROI: string;
  confidenceScore: number;
  status: 'OPEN' | 'IN_SIMULATION' | 'APPROVED' | 'REJECTED';
  aiRecommendation: string;
  alternatives: { name: string; score: number; cost: string }[];
  simulationResult?: {
    expectedRevenue: string;
    estimatedCost: string;
    riskFactor: string;
    timeline: string;
    confidence: number;
  };
  createdAt: string;
}

export interface CreateDecisionRequest {
  title: string;
  question: string;
  category?: string;
}

export const decisionsApi = {
  async list(): Promise<Decision[]> {
    const response = await api.get<{ status: string; data: Decision[] }>('/api/v1/decisions');
    return response.data.data;
  },

  async create(data: CreateDecisionRequest): Promise<Decision> {
    const response = await api.post<{ status: string; data: Decision }>('/api/v1/decisions', data);
    return response.data.data;
  },

  async approve(decisionId: string): Promise<Decision> {
    const response = await api.post<{ data: Decision }>(`/api/v1/decisions/${decisionId}/approve`);
    return response.data.data;
  },

  async reject(decisionId: string, reason: string): Promise<Decision> {
    const response = await api.post<{ data: Decision }>(`/api/v1/decisions/${decisionId}/reject`, { reason });
    return response.data.data;
  },

  async simulate(decisionId: string): Promise<Decision> {
    const response = await api.post<{ data: Decision }>(`/api/v1/decisions/${decisionId}/simulate`);
    return response.data.data;
  },
};
