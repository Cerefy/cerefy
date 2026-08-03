// src/api/projects.ts
// Projects API service

import api from './axios';

export interface Project {
  id: string;
  title: string;
  name: string;
  code: string;
  department: string;
  status: string;
  progress: number;
  budget: string;
  budgetUsed: string;
  dueDate: string;
  assignees: string[];
  agentLead: string;
  milestonesCount?: number;
  completedMilestones?: number;
}

export interface CreateProjectRequest {
  title: string;
  department: string;
  budget: string;
  dueDate?: string;
}

export const projectsApi = {
  async list(): Promise<Project[]> {
    const response = await api.get<{ status: string; data: Project[] }>('/api/v1/projects');
    return response.data.data;
  },

  async get(projectId: string): Promise<Project> {
    const response = await api.get<{ data: Project }>(`/api/v1/projects/${projectId}`);
    return response.data.data;
  },

  async create(data: CreateProjectRequest): Promise<Project> {
    const response = await api.post<{ status: string; data: Project }>('/api/v1/projects', data);
    return response.data.data;
  },

  async update(projectId: string, data: Partial<Project>): Promise<Project> {
    const response = await api.patch<{ data: Project }>(`/api/v1/projects/${projectId}`, data);
    return response.data.data;
  },

  async delete(projectId: string): Promise<void> {
    await api.delete(`/api/v1/projects/${projectId}`);
  },
};
