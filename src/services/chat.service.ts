import { BackendApi } from "./backend-api.service";

export interface CopilotStep {
  agent: string;
  duration: number;
  result: string;
}

export interface CopilotResult {
  success: boolean;
  text?: string;
  steps?: CopilotStep[];
  structured?: Record<string, unknown>;
  error?: string;
}

export const ChatService = {
  async sendMessage(
    message: string,
    history: { role: string; text: string }[],
  ): Promise<CopilotResult> {
    try {
      const response = await BackendApi.chat({
        message,
        stream: false,
      });

      return {
        success: true,
        text: response.output,
        steps: response.steps?.map((s) => ({
          agent: s.node,
          duration: s.duration_ms,
          result: s.output,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
