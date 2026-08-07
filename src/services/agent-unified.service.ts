import { BackendApi, type ChatResponse } from "./backend-api.service";
import { ChatService as NodeChatService } from "./chat.service";

export interface UnifiedChatResult {
  text: string;
  steps: Array<{ agent: string; duration: number }>;
  source: "python-backend" | "node-orchestrator";
}

async function isPythonBackendAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const backendUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || "/api/v1";
    const baseUrl = backendUrl.endsWith("/api/v1") ? backendUrl.slice(0, -7) : backendUrl;
    const resp = await fetch(`${baseUrl}/api/v1/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return resp.ok;
  } catch {
    return false;
  }
}

export const AgentService = {
  async chat(
    message: string,
    history: { role: string; text: string }[],
  ): Promise<UnifiedChatResult> {
    const backendAvailable = await isPythonBackendAvailable();

    if (backendAvailable) {
      try {
        const result: ChatResponse = await BackendApi.chat({
          message,
          session_id: crypto.randomUUID?.() ?? Math.random().toString(36),
        });
        return {
          text: result.output,
          steps: (result.steps ?? []).map((s) => ({ agent: s.node, duration: s.duration_ms })),
          source: "python-backend",
        };
      } catch (err) {
        console.warn("Python backend failed, falling back to Node orchestrator:", err);
      }
    }

    const result = await NodeChatService.sendMessage(message, history);
    return {
      text: result.text ?? "",
      steps: (result.steps ?? []).map((s) => ({ agent: s.agent, duration: s.duration })),
      source: "node-orchestrator",
    };
  },

  async executeWorkflow(request: string) {
    const { WorkflowService } = await import("./workflow.service");
    return WorkflowService.execute(request);
  },
};
