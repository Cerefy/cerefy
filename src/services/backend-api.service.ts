import { supabase } from "@/lib/supabase/client";

const BASE_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || "/api/v1";

async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.access_token;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  stream?: boolean;
}

export interface ChatResponse {
  success: boolean;
  output: string;
  steps: Array<{ node: string; output: string; duration_ms: number }>;
  session_id?: string;
  error?: string;
}

export interface AgentInfo {
  role: string;
  name: string;
  description: string;
  tools: Array<{ name: string; description: string }>;
  enabled: boolean;
}

export interface SystemStatus {
  status: string;
  uptime_seconds: number;
  sessions_active: number;
  workflows_completed: number;
  workflows_failed: number;
  memory_health?: Record<string, unknown>;
  tools_count: number;
}

export interface AdminStats {
  total_sessions: number;
  total_messages: number;
  active_users: number;
  workflows_completed: number;
  workflows_failed: number;
  average_response_time_ms: number;
  tools_used: Record<string, number>;
  agents_used: Record<string, number>;
  uptime_hours: number;
}

export interface WorkspaceRead {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_default: boolean;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  member_count: number;
}

export interface WorkspaceList {
  workspaces: WorkspaceRead[];
  total: number;
}

export interface WorkspaceMemberRead {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
}

export interface AgentConfigRead {
  id: string;
  workspace_id: string;
  agent_role: string;
  display_name: string;
  description: string | null;
  is_enabled: boolean;
  model: string | null;
  temperature: number | null;
  max_tokens: number | null;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TaskExecutionRead {
  id: string;
  workspace_id: string;
  user_id: string | null;
  session_id: string | null;
  agent_role: string | null;
  input_text: string | null;
  output_text: string | null;
  status: string;
  duration_ms: number | null;
  steps: Record<string, unknown> | null;
  error: string | null;
  tokens_used: number | null;
  cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskExecutionList {
  tasks: TaskExecutionRead[];
  total: number;
  page: number;
  per_page: number;
}

export interface ApiKeyRead {
  id: string;
  workspace_id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ApiKeyCreated extends ApiKeyRead {
  raw_key: string;
}

export interface SubscriptionPlanRead {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_users: number;
  max_agents: number;
  max_tasks_per_month: number;
  features: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
}

export interface SubscriptionRead {
  id: string;
  organization_id: string;
  plan_id: string;
  status: string;
  billing_interval: string;
  current_period_start: string;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  plan: SubscriptionPlanRead | null;
}

export interface InvoiceRead {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  invoice_url: string | null;
  created_at: string;
}

export interface MemorySummary {
  session_id: string;
  message_count: number;
  long_term: Record<string, string>;
  agent_memories: Record<string, Record<string, string>>;
}

export interface DashboardStats {
  total_tasks: number;
  tasks_today: number;
  tasks_this_week: number;
  tasks_this_month: number;
  success_rate: number;
  avg_duration_ms: number;
  total_tokens_used: number;
  total_cost: number;
  active_agents_count: number;
  members_count: number;
  recent_tasks: Array<{
    id: string;
    agent_role: string | null;
    status: string;
    duration_ms: number | null;
    created_at: string | null;
  }>;
}

export interface UsageSummary {
  total_tasks: number;
  total_tokens: number;
  total_cost: number;
  tasks_this_month: number;
  active_agents: number;
  active_members: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API ${response.status}: ${error}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const BackendApi = {
  async chat(body: ChatRequest): Promise<ChatResponse> {
    // Add RAG context retrieval
    let ragContext = "";
    try {
      const memorySummary = await this.getMemorySummary(body.session_id || "default");
      if (memorySummary.long_term && Object.keys(memorySummary.long_term).length > 0) {
        ragContext = "\n\n[Relevant Context]\n" + JSON.stringify(memorySummary.long_term, null, 2);
      }
    } catch (error) {
      console.error("Failed to retrieve RAG context:", error);
    }

    const enhancedMessage = ragContext ? `${body.message}${ragContext}` : body.message;
    
    return apiFetch("/chat", {
      method: "POST",
      body: JSON.stringify({ ...body, message: enhancedMessage }),
    });
  },

  async getConversation(sessionId: string) {
    return apiFetch(`/chat/${sessionId}`);
  },

  async listAgents(): Promise<{ agents: AgentInfo[] }> {
    return apiFetch("/agents");
  },

  async getSystemStatus(): Promise<SystemStatus> {
    return apiFetch("/status");
  },

  async getAdminStats(): Promise<AdminStats> {
    return apiFetch("/admin/stats");
  },

  async getAdminSessions(page = 1, perPage = 20) {
    return apiFetch(`/admin/sessions?page=${page}&per_page=${perPage}`);
  },

  async getAdminAgents() {
    return apiFetch("/admin/agents");
  },

  async getDetailedHealth() {
    return apiFetch("/admin/health/detailed");
  },

  async getMemorySummary(sessionId: string): Promise<MemorySummary> {
    return apiFetch(`/memory/${sessionId}`);
  },

  async storeLongTermMemory(sessionId: string, key: string, value: string) {
    return apiFetch(`/memory/${sessionId}/long-term`, {
      method: "POST",
      body: JSON.stringify({ key, value }),
    });
  },

  async getVectorMemory(query: string, orgId?: string) {
    const params = new URLSearchParams({ query });
    if (orgId) params.append("org_id", orgId);
    return apiFetch(`/memory/vector/search?${params.toString()}`);
  },

  async getHealth() {
    return apiFetch("/health");
  },

  /* Workspaces */
  async listWorkspaces(): Promise<WorkspaceList> {
    return apiFetch("/workspaces");
  },

  async createWorkspace(data: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<WorkspaceRead> {
    return apiFetch("/workspaces", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getWorkspace(id: string): Promise<WorkspaceRead> {
    return apiFetch(`/workspaces/${id}`);
  },

  async updateWorkspace(id: string, data: Record<string, unknown>): Promise<WorkspaceRead> {
    return apiFetch(`/workspaces/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteWorkspace(id: string): Promise<void> {
    return apiFetch(`/workspaces/${id}`, { method: "DELETE" });
  },

  async listMembers(workspaceId: string): Promise<WorkspaceMemberRead[]> {
    return apiFetch(`/workspaces/${workspaceId}/members`);
  },

  async addMember(
    workspaceId: string,
    data: { user_id: string; role: string },
  ): Promise<WorkspaceMemberRead> {
    return apiFetch(`/workspaces/${workspaceId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateMember(
    workspaceId: string,
    memberId: string,
    data: { role: string },
  ): Promise<WorkspaceMemberRead> {
    return apiFetch(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    return apiFetch(`/workspaces/${workspaceId}/members/${memberId}`, { method: "DELETE" });
  },

  /* Agent Configs */
  async listAgentConfigs(workspaceId: string): Promise<AgentConfigRead[]> {
    return apiFetch(`/workspaces/${workspaceId}/agents`);
  },

  async updateAgentConfig(
    workspaceId: string,
    configId: string,
    data: Record<string, unknown>,
  ): Promise<AgentConfigRead> {
    return apiFetch(`/workspaces/${workspaceId}/agents/${configId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /* Tasks */
  async listTasks(
    workspaceId: string,
    page = 1,
    perPage = 20,
    status?: string,
  ): Promise<TaskExecutionList> {
    let path = `/workspaces/${workspaceId}/tasks?page=${page}&per_page=${perPage}`;
    if (status) path += `&status=${status}`;
    return apiFetch(path);
  },

  async getTask(workspaceId: string, taskId: string): Promise<TaskExecutionRead> {
    return apiFetch(`/workspaces/${workspaceId}/tasks/${taskId}`);
  },

  /* API Keys */
  async listApiKeys(workspaceId: string): Promise<{ api_keys: ApiKeyRead[]; total: number }> {
    return apiFetch(`/workspaces/${workspaceId}/api-keys`);
  },

  async createApiKey(workspaceId: string, data: { name: string }): Promise<ApiKeyCreated> {
    return apiFetch(`/workspaces/${workspaceId}/api-keys`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteApiKey(workspaceId: string, keyId: string): Promise<void> {
    return apiFetch(`/workspaces/${workspaceId}/api-keys/${keyId}`, { method: "DELETE" });
  },

  /* Billing */
  async listPlans(): Promise<{ plans: SubscriptionPlanRead[] }> {
    return apiFetch("/billing/plans");
  },

  async getSubscription(): Promise<SubscriptionRead | null> {
    return apiFetch("/billing/subscription");
  },

  async createSubscription(data: {
    plan_id: string;
    billing_interval: string;
  }): Promise<SubscriptionRead> {
    return apiFetch("/billing/subscription", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateSubscription(data: Record<string, unknown>): Promise<SubscriptionRead> {
    return apiFetch("/billing/subscription", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async listInvoices(page = 1, perPage = 20): Promise<{ invoices: InvoiceRead[]; total: number }> {
    return apiFetch(`/billing/invoices?page=${page}&per_page=${perPage}`);
  },

  /* Dashboard */
  async getDashboardStats(): Promise<DashboardStats> {
    return apiFetch("/dashboard/stats");
  },

  async getUsageSummary(): Promise<UsageSummary> {
    return apiFetch("/dashboard/usage");
  },

  /* Intelligence */
  async analyzeBusiness(query: string, context?: string, sessionId?: string) {
    const formData = new FormData();
    formData.append("query", query);
    if (context) formData.append("context", context);
    if (sessionId) formData.append("session_id", sessionId);
    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const resp = await fetch(`${BASE_URL}/intelligence/analyze`, {
      method: "POST",
      body: formData,
      headers,
    });
    if (!resp.ok) throw new Error(`Analysis failed: ${resp.status}`);
    return resp.json();
  },

  async getKnowledgeData(sessionId = "default") {
    return apiFetch(`/intelligence/knowledge?session_id=${sessionId}`);
  },

  async listDocuments(sessionId = "default") {
    return apiFetch(`/intelligence/documents?session_id=${sessionId}`);
  },

  async getReport(sessionId: string) {
    return apiFetch(`/intelligence/report/${sessionId}`);
  },
};

/* Activity WebSocket */
export async function createActivitySocket(
  workspaceId: string,
  onEvent: (event: Record<string, unknown>) => void,
): Promise<WebSocket> {
  const token = await getAuthToken();
  const wsBase = BASE_URL.replace(/^http/, "ws");
  const ws = new WebSocket(`${wsBase}/ws/activity/${workspaceId}?token=${token}`);
  ws.onmessage = (msg) => {
    try {
      onEvent(JSON.parse(msg.data));
    } catch {
      /* ignore */
    }
  };
  return ws;
}
