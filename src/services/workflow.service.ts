import { BackendApi } from "./backend-api.service";

export const WorkflowService = {
  async execute(request: string) {
    const response = await BackendApi.chat({ message: request, stream: false });
    return { success: true, output: response.output, steps: response.steps };
  },
};
