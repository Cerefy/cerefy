export interface CopilotStep {
  agent: string;
  duration: number;
  result: string;
}

export interface CopilotResult {
  success: boolean;
  text?: string;
  steps?: CopilotStep[];
  structured?: any;
  error?: string;
}

export const ChatService = {
  async sendMessage(
    message: string,
    history: { role: string; text: string }[],
  ): Promise<CopilotResult> {
    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error("Chat Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
