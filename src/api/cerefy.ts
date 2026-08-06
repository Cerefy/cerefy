import { BackendApi, type AgentConfigRead } from "@/services/backend-api.service";
import type {
  AgentStatus,
  AgentRole,
  FounderTeam,
  WorkspaceState,
  StartupStage,
  WorkflowStep,
  ActivityEvent,
  VideoSection,
  CerefyApiResponse,
} from "@/types/cerefy";

const BASE = "/api/v1/cerefy";

async function cerefyFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await BackendApi.getHealth()
    .then(() => null)
    .catch(() => null);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const response = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!response.ok) throw new Error(`Cerefy API error (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const CerefyApi = {
  async getFounderTeam(): Promise<CerefyApiResponse<FounderTeam>> {
    return cerefyFetch("/team");
  },

  async getWorkspace(workspaceId: string): Promise<CerefyApiResponse<WorkspaceState>> {
    return cerefyFetch(`/workspace/${workspaceId}`);
  },

  async getWorkflow(
    workspaceId: string,
  ): Promise<CerefyApiResponse<{ steps: WorkflowStep[]; currentStage: StartupStage }>> {
    return cerefyFetch(`/workspace/${workspaceId}/workflow`);
  },

  async getActivity(
    workspaceId: string,
    limit = 50,
  ): Promise<CerefyApiResponse<{ events: ActivityEvent[] }>> {
    return cerefyFetch(`/workspace/${workspaceId}/activity?limit=${limit}`);
  },

  async getVideos(): Promise<CerefyApiResponse<{ videos: VideoSection[] }>> {
    return cerefyFetch("/videos");
  },

  listAgentConfigs(workspaceId: string): Promise<AgentConfigRead[]> {
    return BackendApi.listAgentConfigs(workspaceId);
  },

  async triggerWorkflow(workspaceId: string, stage: StartupStage) {
    return fetch(`${BASE}/workspace/${workspaceId}/workflow/${stage}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then((r) => r.json());
  },

  async simulateAgentActivity(workspaceId: string) {
    return cerefyFetch(`/workspace/${workspaceId}/simulate`, { method: "POST" });
  },
};
