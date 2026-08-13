// src/enterprise/database/schema.ts
// Data Intelligence Layer — Drizzle ORM schema definitions

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  firebaseUid?: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: string;
  department: string;
  budget: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  description?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  tenantId: string;
  userId: string;
  agentId?: string;
  title?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  tokens?: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface Document {
  id: string;
  tenantId: string;
  title: string;
  content?: string;
  mimeType: string;
  metadata: Record<string, unknown>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  tenantId: string;
  projectId?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Decision {
  id: string;
  tenantId: string;
  title: string;
  question: string;
  category: string;
  options: Record<string, unknown>;
  status: string;
  selectedOption?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  resource?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

export interface Integration {
  id: string;
  tenantId: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  isActive: boolean;
  lastSync?: Date;
  createdAt: Date;
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  definition: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Database service interface
export interface DatabaseService {
  // Organizations
  createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | null>;

  // Users
  createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;

  // Projects
  createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  listProjects(tenantId: string): Promise<Project[]>;

  // Agents
  createAgent(data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent>;
  listAgents(tenantId: string): Promise<Agent[]>;

  // Conversations
  createConversation(data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conversation>;
  addMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;

  // Documents
  createDocument(data: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document>;
  listDocuments(tenantId: string): Promise<Document[]>;

  // Decisions
  createDecision(data: Omit<Decision, 'id' | 'createdAt' | 'updatedAt'>): Promise<Decision>;
  listDecisions(tenantId: string): Promise<Decision[]>;

  // Audit
  logAction(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  listAuditLogs(tenantId: string, limit?: number): Promise<AuditLog[]>;
}
