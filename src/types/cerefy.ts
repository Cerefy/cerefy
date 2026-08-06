export type AgentRole = "CEO" | "CTO" | "Product" | "CFO" | "Marketing" | "Investor";

export interface AgentStatus {
  role: AgentRole;
  name: string;
  status: "active" | "thinking" | "idle" | "error";
  currentTask: string | null;
  lastOutput: string | null;
  icon: string;
}

export interface AgentOutput {
  id: string;
  role: AgentRole;
  type: string;
  content: string;
  createdAt: string;
}

export interface FounderTeam {
  agents: AgentStatus[];
  outputs: AgentOutput[];
}

export interface WorkspaceState {
  id: string;
  name: string;
  stage: StartupStage;
  progress: number;
  agents: AgentStatus[];
  tasks: WorkspaceTask[];
  documents: WorkspaceDocument[];
  timeline: TimelineEntry[];
}

export type StartupStage =
  "idea" | "research" | "business-model" | "product" | "technology" | "launch";

export interface WorkspaceTask {
  id: string;
  title: string;
  agent: AgentRole;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
}

export interface WorkspaceDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  stage: StartupStage;
  label: string;
  timestamp: string;
  completed: boolean;
}

export interface WorkflowStep {
  id: string;
  label: string;
  stage: StartupStage;
  status: "completed" | "current" | "upcoming";
  description: string;
  icon: string;
}

export interface ActivityEvent {
  id: string;
  agentRole: AgentRole;
  agentName: string;
  message: string;
  type: "task_complete" | "task_start" | "milestone" | "error" | "info";
  timestamp: string;
}

export interface VideoSection {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  category: string;
}

export interface CerefyApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}
