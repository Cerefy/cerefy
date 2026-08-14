import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, CreateProjectRequest, Project } from '../api/projects';
import { decisionsApi, CreateDecisionRequest, Decision } from '../api/decisions';
import { agentsApi, AgentProfile } from '../api/agents';
import { analyticsApi, ExecutiveKPIs, AgentPerformance } from '../api/analytics';
import { memoryApi, MemoryQueryRequest, MemoryResult, IngestRequest, IngestResponse } from '../api/memory';
import { workflowsApi, CreateWorkflowRequest } from '../api/workflows';

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useProject(projectId: string) {
  return useQuery<Project>({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: !!projectId,
    staleTime: 30_000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDecisions() {
  return useQuery<Decision[]>({
    queryKey: ['decisions'],
    queryFn: decisionsApi.list,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDecisionRequest) => decisionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}

export function useApproveDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (decisionId: string) => decisionsApi.approve(decisionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}

export function useRejectDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ decisionId, reason }: { decisionId: string; reason: string }) => decisionsApi.reject(decisionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}

export function useSimulateDecision() {
  return useMutation({
    mutationFn: (decisionId: string) => decisionsApi.simulate(decisionId),
  });
}

export function useAgents() {
  return useQuery<AgentProfile[]>({
    queryKey: ['agents'],
    queryFn: agentsApi.listAgents,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useAgent(agentId: string) {
  return useQuery<AgentProfile>({
    queryKey: ['agents', agentId],
    queryFn: () => agentsApi.getAgent(agentId),
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

export function useRunAgentTask() {
  return useMutation({
    mutationFn: (agentId: string) => agentsApi.executeAgent(agentId),
  });
}

export function useExecutiveKPIs() {
  return useQuery<ExecutiveKPIs>({
    queryKey: ['executiveKPIs'],
    queryFn: analyticsApi.getExecutiveKPIs,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useAgentPerformance() {
  return useQuery<AgentPerformance[]>({
    queryKey: ['agentPerformance'],
    queryFn: analyticsApi.getAgentPerformance,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useProjectAnalytics(projectId: string) {
  return useQuery({
    queryKey: ['projectAnalytics', projectId],
    queryFn: () => analyticsApi.getProjectAnalytics(projectId),
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

export function useMemoryQuery() {
  return useMutation({
    mutationFn: (data: MemoryQueryRequest) => memoryApi.query(data),
  });
}

export function useMemoryDocuments() {
  return useQuery({
    queryKey: ['memoryDocuments'],
    queryFn: memoryApi.getDocuments,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useMemoryIngest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: IngestRequest) => memoryApi.ingest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memoryDocuments'] });
    },
  });
}

export function useKnowledgeGraph() {
  return useMutation({
    mutationFn: (cypher?: string) => memoryApi.getKnowledgeGraph(cypher),
  });
}

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsApi.list,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useWorkflow(workflowId: string) {
  return useQuery({
    queryKey: ['workflows', workflowId],
    queryFn: () => workflowsApi.get(workflowId),
    enabled: !!workflowId,
    staleTime: 30_000,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkflowRequest) => workflowsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });
}

export function usePublishWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, versionId }: { workflowId: string; versionId: string }) => workflowsApi.publish(workflowId, versionId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflows', variables.workflowId] });
    },
  });
}

export function useRunWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, input, idempotencyKey }: { workflowId: string; input: Record<string, unknown>; idempotencyKey: string }) => workflowsApi.run(workflowId, input, idempotencyKey),
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['workflow-runs', data.run.id] }),
  });
}

export function useWorkflowRun(runId: string) {
  return useQuery({
    queryKey: ['workflow-runs', runId],
    queryFn: () => workflowsApi.getRun(runId),
    enabled: !!runId,
    refetchInterval: (query) => {
      const status = query.state.data?.run.status;
      return status === 'QUEUED' || status === 'RUNNING' || status === 'WAITING_APPROVAL' ? 2_000 : false;
    },
  });
}

export function useResolveWorkflowApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ approvalId, status, note }: { approvalId: string; status: 'APPROVED' | 'REJECTED'; note?: string }) => workflowsApi.resolveApproval(approvalId, status, note),
    onSuccess: (approval) => queryClient.invalidateQueries({ queryKey: ['workflow-runs', approval.workflowRunId] }),
  });
}