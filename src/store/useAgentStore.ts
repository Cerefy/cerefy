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
import {
  INITIAL_TENANTS,
  INITIAL_KG_NODES,
  INITIAL_KG_EDGES,
  INITIAL_DOCUMENTS,
  INITIAL_CHUNKS,
  INITIAL_SHORT_TERM_MEMORY,
  INITIAL_LOGS,
  INITIAL_POLICIES,
  INITIAL_TELEMETRY,
  INITIAL_DECISIONS,
  INITIAL_AGENTS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_MEETINGS,
  INITIAL_WORKFLOW_NODES,
  INITIAL_INTEGRATIONS,
  INITIAL_WORKFLOWS,
  INITIAL_KNOWLEDGE_ARTICLES,
} from '../data/initialData';

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

  // Decision actions
  approveDecision: (decisionId: string) => void;
  runDecisionSimulation: (decisionId: string) => void;
  addDecision: (title: string, question: string) => void;

  // Agent actions
  runAgentTask: (agentId: string) => void;

  // Project / Task actions
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
  tenants: INITIAL_TENANTS,
  activeTenantId: INITIAL_TENANTS[0].id,
  activeSessionId: 'sess_' + Math.random().toString(36).substring(2, 9),
  activeRole: 'TENANT_ADMIN',
  executionPlan: null,
  isExecuting: false,
  graphNodes: INITIAL_KG_NODES,
  graphEdges: INITIAL_KG_EDGES,
  documents: INITIAL_DOCUMENTS,
  chunks: INITIAL_CHUNKS,
  shortTermMemory: INITIAL_SHORT_TERM_MEMORY,
  logs: INITIAL_LOGS,
  policies: INITIAL_POLICIES,
  telemetry: INITIAL_TELEMETRY,
  commandPaletteOpen: false,

  decisions: INITIAL_DECISIONS,
  agents: INITIAL_AGENTS,
  projects: INITIAL_PROJECTS,
  tasks: INITIAL_TASKS,
  meetings: INITIAL_MEETINGS,
  workflowNodes: INITIAL_WORKFLOW_NODES,
  workflows: INITIAL_WORKFLOWS as any,
  connectors: INITIAL_INTEGRATIONS,
  knowledgeArticles: INITIAL_KNOWLEDGE_ARTICLES,
  integrations: INITIAL_INTEGRATIONS,

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

  ingestDocumentLocal: async (title, content, mimeType = 'PDF') => {
    const state = get();
    const docId = 'doc_' + Math.random().toString(36).substring(2, 9);
    
    // Recursive chunking
    const chunkSize = 300;
    const chunkOverlap = 40;
    const textChunks: string[] = [];
    let start = 0;
    while (start < content.length) {
      let end = start + chunkSize;
      if (end < content.length) {
        const lastSpace = content.lastIndexOf(' ', end);
        if (lastSpace > start) end = lastSpace;
      }
      textChunks.push(content.slice(start, end).trim());
      start = end - chunkOverlap;
    }
    const cleanChunks = textChunks.filter((c) => c.length > 0);

    const newDoc: IngestedDocument = {
      id: docId,
      tenantId: state.activeTenantId,
      title,
      mimeType,
      type: mimeType,
      uploadedAt: new Date().toISOString().split('T')[0],
      fileSize: '1.2 MB',
      rawContent: content,
      chunkCount: cleanChunks.length,
      extractedData: {
        extractedBy: 'OCR & AI Vision Pipeline',
        detectedEntities: ['Tenant_Core', 'Policy_Boundary'],
        confidence: '98.5%',
      },
      ocrEntities: [
        { key: 'Contract Parties', value: 'Acme Global Enterprises & Vendor SE' },
        { key: 'Target Jurisdiction', value: 'Frankfurt, Germany' },
        { key: 'SLA Level', value: '99.99% Availability' },
      ],
      summary: `Document uploaded and indexed into ${cleanChunks.length} vector embeddings.`,
      ocrConfidence: 0.98,
      linkedProject: 'proj_1',
      linkedOwner: 'CEO Executive AI',
      createdAt: new Date().toISOString(),
    };

    const newChunkObjects: DocumentChunk[] = cleanChunks.map((chunkText, idx) => ({
      id: 'chunk_' + Math.random().toString(36).substring(2, 9),
      documentId: docId,
      tenantId: state.activeTenantId,
      chunkIndex: idx,
      content: chunkText,
      embedding: Array.from({ length: 16 }, (_, i) => Math.sin((i + idx) * 0.3) * 0.5 + 0.1),
      similarityScore: 0.85 + (idx % 3) * 0.04,
      metadata: {
        title,
        mimeType,
        tokenCount: Math.ceil(chunkText.length / 4),
      },
    }));

    // Auto add node to knowledge graph for the document
    const newDocNode: KGNode = {
      id: 'node_' + docId,
      tenantId: state.activeTenantId,
      label: title,
      type: 'Document',
      x: 300 + Math.random() * 200,
      y: 200 + Math.random() * 100,
      color: '#8b5cf6',
      properties: { mimeType, chunks: String(cleanChunks.length) },
    };

    set((s) => ({
      documents: [newDoc, ...s.documents],
      chunks: [...newChunkObjects, ...s.chunks],
      graphNodes: [...s.graphNodes, newDocNode],
    }));

    return newDoc;
  },

  queryVectorStoreLocal: (query) => {
    const state = get();
    const queryLower = query.toLowerCase();
    return state.chunks
      .filter((c) => c.tenantId === state.activeTenantId)
      .map((chunk) => {
        const containsMatch = chunk.content.toLowerCase().includes(queryLower);
        const score = containsMatch ? 0.95 : Math.random() * 0.4 + 0.5;
        return { ...chunk, similarityScore: Number(score.toFixed(2)) };
      })
      .sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
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
            simulationResult: {
              expectedRevenue: '$3,800,000 ARR',
              estimatedCost: '$420,000 OpEx',
              riskFactor: 'LOW-MEDIUM (28/100)',
              timeline: '3 Months',
              confidence: 96,
            },
          };
        }
        return d;
      }),
    })),

  addDecision: (title, question) =>
    set((state) => ({
      decisions: [
        {
          id: 'dec_' + Math.random().toString(36).substring(2, 9),
          tenantId: state.activeTenantId,
          title,
          question,
          riskScore: 25,
          businessImpact: 'HIGH',
          expectedROI: 'Estimated +180% ROI',
          alternativesCount: 3,
          confidenceScore: 92,
          status: 'OPEN',
          aiRecommendation: 'PROCEED WITH AI MONITORED IMPLEMENTATION. Calculated risk is within acceptable enterprise bounds.',
          createdAt: new Date().toISOString(),
        },
        ...state.decisions,
      ],
    })),

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
      const response = await fetch('/api/v1/projects', {
        headers: { 'x-tenant-id': get().activeTenantId }
      });
      const { data } = await response.json();
      set({ projects: data });
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
      progress: 10,
      progressPercent: 10,
      milestonesCount: 5,
      completedMilestones: 1,
      budget: budget,
      assignees: ['Montaser', 'CEO Executive AI'],
      agentLead: 'CEO Executive AI',
      budgetUsed: '$0 / ' + budget,
      dueDate: '2026-12-31',
    };
    try {
      const response = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-tenant-id': get().activeTenantId 
        },
        body: JSON.stringify(newProject),
      });
      const { data } = await response.json();
      set((state) => ({ projects: [data, ...state.projects] }));
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
          durationMinutes: 30,
          participants: ['Montaser', 'CEO Agent', 'CTO Agent'],
          attendees: ['Montaser', 'CEO Agent', 'CTO Agent'],
          transcriptSummary: 'Meeting initiated. AI transcribed audio stream and summarized core deliverables.',
          actionItems: [{ task: 'Review AI Generated Action Items', assignee: 'CEO Agent' }],
          assignedTasksCount: 2,
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


