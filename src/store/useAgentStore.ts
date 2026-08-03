import { create } from 'zustand';
import {
  AppMode,
  WorkspaceTab,
  Tenant,
  MultiAgentExecutionPlan,
  AgentStep,
  KGNode,
  KGEdge,
  IngestedDocument,
  DocumentChunk,
  ShortTermMemoryItem,
  ExecutionLog,
  ABACPolicy,
  TelemetrySpan,
  TenantRole,
  DecisionItem,
  AIAgentProfile,
  ProjectItem,
  TaskItem,
  MeetingItem,
  WorkflowNode,
  WorkflowItem,
  KnowledgeArticle,
  IntegrationConnector,
} from '../types';

interface AgentStore {
  currentUser: any | null;
  authLoading: boolean;
  appMode: AppMode;
  activeTab: WorkspaceTab;
  tenants: Tenant[];
  activeTenantId: string;
  activeSessionId: string;
  activeRole: TenantRole;
  executionPlan: MultiAgentExecutionPlan | null;
  isExecuting: boolean;
  graphNodes: KGNode[];
  graphEdges: KGEdge[];
  documents: IngestedDocument[];
  chunks: DocumentChunk[];
  shortTermMemory: ShortTermMemoryItem[];
  logs: ExecutionLog[];
  policies: ABACPolicy[];
  telemetry: TelemetrySpan[];
  commandPaletteOpen: boolean;

  decisions: DecisionItem[];
  agents: AIAgentProfile[];
  projects: ProjectItem[];
  tasks: TaskItem[];
  meetings: MeetingItem[];
  workflowNodes: WorkflowNode[];
  workflows: WorkflowItem[];
  connectors: IntegrationConnector[];
  knowledgeArticles: KnowledgeArticle[];
  integrations: IntegrationConnector[];

  // Actions
  setCurrentUser: (user: any | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAppMode: (mode: AppMode) => void;
  setActiveTab: (tab: WorkspaceTab) => void;
  setActiveTenantId: (tenantId: string) => void;
  setActiveRole: (role: TenantRole) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setExecutionPlan: (plan: MultiAgentExecutionPlan | null) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  updateStepStatus: (stepId: string, status: AgentStep['status'], output?: string, reflectionNotes?: string) => void;
  
  addGraphNode: (node: Omit<KGNode, 'id' | 'tenantId'>) => void;
  addGraphEdge: (source: string, target: string, relation: KGEdge['relation']) => void;
  deleteGraphNode: (nodeId: string) => void;

  ingestDocumentLocal: (title: string, content: string, mimeType?: IngestedDocument['mimeType']) => Promise<IngestedDocument>;
  queryVectorStoreLocal: (query: string) => DocumentChunk[];
  
  clearSessionMemory: () => void;
  addLog: (log: Omit<ExecutionLog, 'id' | 'createdAt'>) => void;
  updatePolicyAllowedRoles: (policyId: string, roles: TenantRole[]) => void;
  addTelemetrySpan: (span: Omit<TelemetrySpan, 'id'>) => void;

  approveDecision: (decisionId: string) => void;
  runDecisionSimulation: (decisionId: string) => void;
  addDecision: (title: string, question: string) => Promise<void>;
  fetchDecisions: () => Promise<void>;
  runAgentTask: (agentId: string) => void;
  addTask: (task: TaskItem) => void;
  updateTaskStatus: (taskId: string, status: TaskItem['status']) => void;
  fetchProjects: () => Promise<void>;
  addProject: (title: string, department: string, budget: string) => Promise<void>;
  addMeeting: (title: string, duration: string) => void;
  addWorkflowNode: (type: WorkflowNode['type'], label: string, description: string) => void;
  toggleIntegration: (id: string) => void;
  toggleConnectorStatus: (id: string) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  currentUser: null,
  authLoading: true,
  appMode: 'WORKSPACE',
  activeTab: 'command-center',
  tenants: [],
  activeTenantId: 'tenant_cerefy_101',
  activeSessionId: 'sess_' + Math.random().toString(36).substring(2, 9),
  activeRole: 'TENANT_ADMIN',
  executionPlan: null,
  isExecuting: false,
  graphNodes: [],
  graphEdges: [],
  documents: [],
  chunks: [],
  shortTermMemory: [],
  logs: [],
  policies: [],
  telemetry: [],
  commandPaletteOpen: false,

  decisions: [],
  agents: [],
  projects: [],
  tasks: [],
  meetings: [],
  workflowNodes: [],
  workflows: [],
  connectors: [],
  knowledgeArticles: [],
  integrations: [],

  setCurrentUser: (currentUser) => set({ currentUser }),
  setAuthLoading: (authLoading) => set({ authLoading }),
  setAppMode: (appMode) => set({ appMode }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveTenantId: (tenantId) => set({ activeTenantId: tenantId }),
  setActiveRole: (role) => set({ activeRole: role }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  
  setExecutionPlan: (executionPlan) => set({ executionPlan }),
  setIsExecuting: (isExecuting) => set({ isExecuting }),

  updateStepStatus: (stepId, status, output, reflectionNotes) =>
    set((state) => {
      if (!state.executionPlan) return state;
      const updatedSteps = state.executionPlan.steps.map((step) => {
        if (step.id === stepId) {
          return {
            ...step,
            status,
            ...(output !== undefined ? { output } : {}),
            ...(reflectionNotes !== undefined ? { reflectionNotes } : {}),
          };
        }
        return step;
      });
      return {
        executionPlan: {
          ...state.executionPlan,
          steps: updatedSteps,
        },
      };
    }),

  addGraphNode: (nodeData) =>
    set((state) => {
      const newNode: KGNode = {
        ...nodeData,
        id: 'node_' + Math.random().toString(36).substring(2, 9),
        tenantId: state.activeTenantId,
      };
      return { graphNodes: [...state.graphNodes, newNode] };
    }),

  addGraphEdge: (source, target, relation) =>
    set((state) => {
      const newEdge: KGEdge = {
        id: 'edge_' + Math.random().toString(36).substring(2, 9),
        tenantId: state.activeTenantId,
        source,
        target,
        relation,
        updatedAt: new Date().toISOString(),
      };
      return { graphEdges: [...state.graphEdges, newEdge] };
    }),

  deleteGraphNode: (nodeId) =>
    set((state) => ({
      graphNodes: state.graphNodes.filter((n) => n.id !== nodeId),
      graphEdges: state.graphEdges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    })),

  ingestDocumentLocal: async (title, content, mimeType: any = 'PDF') => {
    try {
      const authHeader = get().currentUser ? await get().currentUser.getIdToken() : '';
      const response = await fetch('/api/v1/ingestion/chunk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': get().activeTenantId,
          'Authorization': `Bearer ${authHeader}`
        },
        body: JSON.stringify({ title, content, chunkSize: 500, chunkOverlap: 50 }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to ingest document');
      }
      
      const result = await response.json();
      
      const newDoc: IngestedDocument = {
        id: result.documentId || 'doc_' + Math.random().toString(36).substring(2, 9),
        tenantId: get().activeTenantId,
        title: result.title,
        mimeType: mimeType as any,
        rawContent: content,
        chunkCount: result.chunkCount || 0,
        createdAt: new Date().toISOString(),
      };
      
      set((state) => ({ documents: [newDoc, ...state.documents] }));
      return newDoc;
    } catch (error) {
      console.error('Ingestion error:', error);
      throw error;
    }
  },

  queryVectorStoreLocal: (query) => {
    // Phase 3 will replace this with real API call
    return [];
  },

  clearSessionMemory: () => set({ shortTermMemory: [] }),

  addLog: (logData) =>
    set((state) => ({
      logs: [
        {
          ...logData,
          id: 'log_' + Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString(),
        },
        ...state.logs,
      ],
    })),

  updatePolicyAllowedRoles: (policyId, roles) =>
    set((state) => ({
      policies: state.policies.map((p) => (p.id === policyId ? { ...p, allowedRoles: roles } : p)),
    })),

  addTelemetrySpan: (spanData) =>
    set((state) => ({
      telemetry: [
        {
          ...spanData,
          id: 'span_' + Math.random().toString(36).substring(2, 9),
        },
        ...state.telemetry,
      ],
    })),

  approveDecision: (decisionId) =>
    set((state) => ({
      decisions: state.decisions.map((d) => (d.id === decisionId ? { ...d, status: 'APPROVED' } : d)),
    })),

  runDecisionSimulation: (decisionId) =>
    set((state) => ({
      decisions: state.decisions.map((d) => {
        if (d.id === decisionId) {
          return {
            ...d,
            status: 'IN_SIMULATION',
          };
        }
        return d;
      }),
    })),

  fetchDecisions: async () => {
    try {
      const authHeader = get().currentUser ? await get().currentUser.getIdToken() : '';
      const response = await fetch('/api/v1/decisions', {
        headers: { 
          'x-tenant-id': get().activeTenantId,
          'Authorization': `Bearer ${authHeader}`
        }
      });
      if (response.ok) {
        const { data } = await response.json();
        set({ decisions: data });
      }
    } catch (error) {
      console.error('Failed to fetch decisions', error);
    }
  },

  addDecision: async (title, question) => {
    try {
      const authHeader = get().currentUser ? await get().currentUser.getIdToken() : '';
      const response = await fetch('/api/v1/decisions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': get().activeTenantId,
          'Authorization': `Bearer ${authHeader}`
        },
        body: JSON.stringify({ title, question })
      });
      if (response.ok) {
        const { data } = await response.json();
        set((state) => ({ decisions: [data, ...state.decisions] }));
      }
    } catch (error) {
      console.error('Failed to add decision', error);
    }
  },

  runAgentTask: (agentId) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === agentId ? { ...a, status: 'busy', currentTask: 'Executing automated task sequence...' } : a)),
    })),

  addTask: (taskObj) =>
    set((state) => ({
      tasks: [taskObj, ...state.tasks],
    })),

  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    })),

  fetchProjects: async () => {
    try {
      const authHeader = get().currentUser ? await get().currentUser.getIdToken() : '';
      const response = await fetch('/api/v1/projects', {
        headers: { 
          'x-tenant-id': get().activeTenantId,
          'Authorization': `Bearer ${authHeader}`
        }
      });
      if (response.ok) {
        const { data } = await response.json();
        set({ projects: data });
      }
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  },

  addProject: async (title, department, budget) => {
    const newProject = {
      title,
      name: title,
      code: 'PROJ-AI-' + Math.floor(Math.random() * 90 + 10),
      department,
      status: 'Planning',
      progress: 0,
      budget: budget,
      dueDate: new Date().toISOString().split('T')[0],
    };
    try {
      const authHeader = get().currentUser ? await get().currentUser.getIdToken() : '';
      const response = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-tenant-id': get().activeTenantId,
            'Authorization': `Bearer ${authHeader}`
        },
        body: JSON.stringify(newProject),
      });
      if (response.ok) {
        const { data } = await response.json();
        set((state) => ({ projects: [data, ...state.projects] }));
      }
    } catch (error) {
      console.error('Failed to add project', error);
    }
  },

  addMeeting: (title, duration) =>
    set((state) => ({
      meetings: [
        {
          id: 'meet_' + Math.random().toString(36).substring(2, 9),
          title,
          date: new Date().toISOString().split('T')[0],
          time: '10:00 AM',
          duration,
          durationMinutes: parseInt(duration) || 30,
          participants: [],
          attendees: [],
          transcriptSummary: 'Pending transcription',
          actionItems: [],
          assignedTasksCount: 0,
        },
        ...state.meetings,
      ],
    })),

  addWorkflowNode: (type, label, description) =>
    set((state) => ({
      workflowNodes: [
        ...state.workflowNodes,
        {
          id: 'wn_' + Math.random().toString(36).substring(2, 9),
          type,
          label,
          description,
          status: 'pending',
        },
      ],
    })),

  toggleIntegration: (id) =>
    set((state) => ({
      integrations: state.integrations.map((i) =>
        i.id === id ? { ...i, status: i.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' } : i
      ),
      connectors: state.connectors.map((i) =>
        i.id === id ? { ...i, status: i.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' } : i
      ),
    })),

  toggleConnectorStatus: (id) =>
    set((state) => ({
      integrations: state.integrations.map((i) =>
        i.id === id ? { ...i, status: i.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' } : i
      ),
      connectors: state.connectors.map((i) =>
        i.id === id ? { ...i, status: i.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' } : i
      ),
    })),
}));
