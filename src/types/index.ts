export type AppMode = 'MARKETING' | 'WORKSPACE' | 'ADMIN';

export type WorkspaceTab = 
  | 'command-center'
  | 'dashboard'
  | 'memory'
  | 'knowledge'
  | 'projects'
  | 'documents'
  | 'meetings'
  | 'tasks'
  | 'agents'
  | 'studio'
  | 'decisions'
  | 'analytics'
  | 'integrations'
  | 'settings'
  // AI & Workspace Views
  | 'ai-canvas'
  | 'bpmn'
  | 'governance'
  | 'activity'
  // Legacy / Direct access mappings
  | 'orchestrator'
  | 'graph'
  | 'ingestion'
  | 'security'
  | 'telemetry';


export type TenantRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'ANALYST' | 'VIEWER';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  tier?: string;
  environment: 'production' | 'staging' | 'sandbox';
  userCount: number;
  createdAt: string;
}

export interface UserContext {
  id: string;
  email: string;
  tenantId: string;
  role: TenantRole;
  attributes: Record<string, string>;
}

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'reflected';

export interface AgentStep {
  id: string;
  agentName: string;
  agentRole: 'Planner' | 'Retriever' | 'Reasoner' | 'Reflection' | 'ToolExecutor';
  status: StepStatus;
  timestamp: string;
  durationMs?: number;
  input?: string;
  output?: string;
  reflectionNotes?: string;
  metadata?: Record<string, any>;
}

export interface MultiAgentExecutionPlan {
  id: string;
  query: string;
  tenantId: string;
  sessionId: string;
  status: 'idle' | 'planning' | 'running' | 'reflecting' | 'completed' | 'failed';
  currentStepIndex: number;
  steps: AgentStep[];
  finalResponse?: string;
  totalTokensUsed?: number;
  latencyMs?: number;
  reflectionCount: number;
}

export interface KGNode {
  id: string;
  tenantId: string;
  label: string;
  type: 'Tenant' | 'Policy' | 'Document' | 'User' | 'Service' | 'Agent' | 'DataAsset' | 'Process' | 'Department';
  x: number;
  y: number;
  color?: string;
  properties?: Record<string, string>;
}

export interface KGEdge {
  id: string;
  tenantId: string;
  source: string;
  target: string;
  relation: 'HAS_ROLE' | 'ACCESSES' | 'BELONGS_TO' | 'DEPENDS_ON' | 'GOVERNS' | 'INDEXES' | 'PART_OF' | 'PRODUCES';
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  tenantId: string;
  chunkIndex: number;
  content: string;
  embedding: number[]; // 1536 vector elements
  similarityScore?: number;
  metadata: {
    title: string;
    mimeType: string;
    tokenCount: number;
  };
}

export interface IngestedDocument {
  id: string;
  tenantId: string;
  title: string;
  type?: string;
  mimeType: 'PDF' | 'Word' | 'Excel' | 'PowerPoint' | 'Email' | 'Contract' | 'Invoice';
  rawContent: string;
  chunkCount: number;
  extractedData?: Record<string, any>;
  summary?: string;
  ocrEntities?: { key: string; value: string }[];
  uploadedAt?: string;
  fileSize?: string;
  ocrConfidence?: number;
  linkedProject?: string;
  linkedOwner?: string;
  createdAt: string;
}

export interface ShortTermMemoryItem {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  ttlSeconds: number;
}

export interface ExecutionLog {
  id: string;
  tenantId: string;
  agentId: string;
  executionTimeMs: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  inputPayload: Record<string, any>;
  outputPayload: Record<string, any>;
  createdAt: string;
}

export interface ABACPolicy {
  id: string;
  tenantId: string;
  name: string;
  resource: string;
  action: 'READ' | 'WRITE' | 'EXECUTE' | 'DELETE';
  allowedRoles: TenantRole[];
  attributeConstraint?: string;
}

export interface TelemetrySpan {
  id: string;
  service: string;
  name: string;
  startTime: string;
  durationMs: number;
  status: 'OK' | 'ERROR';
  attributes: Record<string, string>;
}

export interface DecisionItem {
  id: string;
  tenantId: string;
  title: string;
  question: string;
  category?: string;
  riskScore: number; // 0 - 100
  businessImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expectedROI: string;
  alternativesCount: number;
  confidenceScore: number; // 0 - 100
  confidence?: number;
  status: 'OPEN' | 'IN_SIMULATION' | 'APPROVED' | 'REJECTED';
  aiRecommendation: string;
  alternatives?: { name: string; score: number; cost: string }[];
  simulationResult?: {
    expectedRevenue: string;
    estimatedCost: string;
    riskFactor: string;
    timeline: string;
    confidence: number;
  };
  createdAt: string;
}

export interface AIAgentProfile {
  id: string;
  name: string;
  role: string;
  department: 'Executive' | 'Engineering' | 'Product' | 'Operations' | 'Finance' | 'HR' | 'Sales' | 'Security';
  avatarColor: string;
  status: 'idle' | 'busy' | 'reflecting' | 'offline';
  skills: string[];
  currentTask?: string;
  performanceScore: number; // e.g. 98%
  monthlyCost: string;
  tools: string[];
  permissions: string[];
}

export interface ProjectItem {
  id: string;
  tenantId: string;
  title: string;
  name?: string;
  code: string;
  department: string;
  status: 'Planning' | 'In Progress' | 'In Review' | 'Completed' | 'IN_PROGRESS';
  progress: number;
  progressPercent?: number;
  assignees: string[];
  agentLead: string;
  budgetUsed: string;
  budget?: string;
  milestonesCount?: number;
  completedMilestones?: number;
  dueDate: string;
}

export interface TaskItem {
  id: string;
  title: string;
  projectId: string;
  assignee: string;
  assigneeAgentId?: string;
  assignedByAgent?: string;
  status: 'Backlog' | 'In Progress' | 'Review' | 'Done' | 'BACKLOG' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
}

export interface MeetingItem {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  durationMinutes?: number;
  participants?: string[];
  attendees: string[];
  transcriptSummary: string;
  actionItems: string[] | { task: string; assignee: string }[];
  assignedTasksCount: number;
}

export interface WorkflowNode {
  id: string;
  type: 'Trigger' | 'Understand' | 'Reason' | 'CallAgent' | 'Review' | 'Approval' | 'Execute' | 'Notify';
  label: string;
  description: string;
  status?: 'pending' | 'active' | 'success';
}

export interface WorkflowItem {
  id: string;
  name: string;
  triggerType: string;
  nodes: WorkflowNode[];
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

export interface IntegrationConnector {
  id: string;
  name: string;
  category: 'Code' | 'Project' | 'Communication' | 'Storage' | 'CRM' | 'ERP' | 'Analytics';
  icon: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING';
  lastSync: string;
}


