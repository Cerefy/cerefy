export const WorkflowService = {
  async execute(request: string) {
    const response = await fetch("http://localhost:8000/api/workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Workflow execution failed");
    }
    return data;
  },
};
