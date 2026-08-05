export interface TemporalWorkflowConfig {
  address: string;
  namespace: string;
  taskQueue: string;
}

export function getTemporalWorkflowConfig(): TemporalWorkflowConfig | null {
  const address = process.env.TEMPORAL_ADDRESS;
  const namespace = process.env.TEMPORAL_NAMESPACE;
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE;

  if (!address || !namespace || !taskQueue) {
    return null;
  }

  return { address, namespace, taskQueue };
}

export function isTemporalConfigured(): boolean {
  return getTemporalWorkflowConfig() !== null;
}

export function prepareTemporalWorkflow(input: {
  workflowName: string;
  executionId: string;
  tenantId: string;
  type: string;
  metadata?: Record<string, unknown>;
}) {
  const config = getTemporalWorkflowConfig();
  return {
    configured: Boolean(config),
    config,
    workflowId: `${input.workflowName}-${input.executionId}`,
    taskQueue: config?.taskQueue || 'cerefy-ai',
    payload: {
      executionId: input.executionId,
      tenantId: input.tenantId,
      type: input.type,
      metadata: input.metadata || {},
    },
  };
}
