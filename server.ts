import './instrumentation';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import http from 'http';
import axios from 'axios';
import neo4j from 'neo4j-driver';
import { Server as SocketIOServer } from 'socket.io';
import * as projectService from './src/lib/projectService';
import * as ingestionService from './src/lib/ingestionService';
import * as decisionService from './src/lib/decisionService';
import { buildAgentOrchestrator } from './src/lib/agentOrchestrator';
import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { logger, httpLogger } from './src/lib/logger';
import { corsMiddleware, securityHeaders, requestId, requestSizeLimiter } from './src/lib/securityMiddleware';
import { apiRateLimiter, authRateLimiter, aiRateLimiter } from './src/lib/rateLimiter';
import { livenessCheck, readinessCheck, simpleHealthCheck } from './src/lib/healthCheck';
import { withTenantContext } from './src/db';
import { documents } from './src/db/schema';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

// ─── Global Middleware ─────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(requestId);
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(requestSizeLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(httpLogger);

// ─── Health & Monitoring Endpoints (no auth, no rate limit) ───────────────
app.get('/health', simpleHealthCheck);
app.get('/api/health', simpleHealthCheck);
app.get('/health/live', livenessCheck);
app.get('/health/ready', readinessCheck);

// ─── Metrics endpoint ─────────────────────────────────────────────────────
app.get('/api/metrics', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  res.json({
    uptime: process.uptime(),
    memory: {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
    },
    cpu: process.cpuUsage(),
    nodeVersion: process.version,
    pid: process.pid,
    timestamp: new Date().toISOString(),
  });
});

// ─── Lazy Singletons ─────────────────────────────────────────────────────
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'cerefy-enterprise/1.0' } },
      });
    } catch (err) {
      logger.warn('Failed to initialize GoogleGenAI client', { error: err });
    }
  }
  return aiClient;
}

let neo4jDriver: ReturnType<typeof neo4j.driver> | null = null;
function getNeo4jDriver(): ReturnType<typeof neo4j.driver> {
  if (!neo4jDriver) {
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !username || !password) {
      throw new Error('Neo4j connection settings are required in NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD');
    }

    neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }
  return neo4jDriver;
}

let firebaseApp: any | null = null;
let socketServer: SocketIOServer | null = null;

interface DevAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  organizationName: string;
  avatarUrl?: string;
  createdAt: string;
}

const devUsersByEmail = new Map<string, { profile: DevAuthUser; password: string }>();
const devAccessTokens = new Map<string, DevAuthUser>();
const devRefreshTokens = new Map<string, string>();

const defaultDevUser: DevAuthUser = {
  id: 'user_dev_01',
  email: 'dev@cerefy.local',
  firstName: 'Local',
  lastName: 'Developer',
  role: 'admin',
  organizationId: 'org_dev_01',
  organizationName: 'Cerefy Labs',
  avatarUrl: 'https://ui-avatars.com/api/?name=Local+Dev&background=111827&color=00ffff',
  createdAt: new Date().toISOString(),
};

devUsersByEmail.set(defaultDevUser.email, { profile: defaultDevUser, password: 'password' });

type ProjectRecord = {
  id: string;
  title: string;
  name: string;
  code: string;
  department: string;
  status: string;
  progress: number;
  budget: string;
  budgetUsed: string;
  dueDate: string;
  assignees: string[];
  agentLead: string;
  milestonesCount?: number;
  completedMilestones?: number;
};

type DecisionRecord = {
  id: string;
  title: string;
  question: string;
  category: string;
  riskScore: number;
  businessImpact: string;
  expectedROI: string;
  confidenceScore: number;
  status: 'OPEN' | 'IN_SIMULATION' | 'APPROVED' | 'REJECTED';
  aiRecommendation: string;
  alternatives: { name: string; score: number; cost: string }[];
  simulationResult?: {
    expectedRevenue: string;
    estimatedCost: string;
    riskFactor: string;
    timeline: string;
    confidence: number;
  };
  createdAt: string;
  updatedAt: string;
};

const devProjects: ProjectRecord[] = [
  {
    id: 'proj_01',
    title: 'Next-Gen Workflow Automation',
    name: 'Workflow Engine Modernization',
    code: 'WF-2026',
    department: 'Product',
    status: 'In Progress',
    progress: 58,
    budget: '$420,000',
    budgetUsed: '$243,000',
    dueDate: '2025-07-30',
    assignees: ['Amelia', 'Kai', 'Jordan'],
    agentLead: 'Ava AI',
    milestonesCount: 12,
    completedMilestones: 7,
  },
  {
    id: 'proj_02',
    title: 'Governance Intelligence Suite',
    name: 'Cerefy Governance Center',
    code: 'GC-2026',
    department: 'Operations',
    status: 'Planning',
    progress: 22,
    budget: '$180,000',
    budgetUsed: '$39,000',
    dueDate: '2025-10-15',
    assignees: ['Mia', 'Noah', 'Sofia'],
    agentLead: 'Atlas Agent',
    milestonesCount: 8,
    completedMilestones: 2,
  },
];

const devDecisions: DecisionRecord[] = [
  {
    id: 'dec_01',
    title: 'New Platform Pricing Model',
    question: 'Should we adopt a usage-based pricing model for Cerefy AI workflows?',
    category: 'Pricing',
    riskScore: 6,
    businessImpact: 'High',
    expectedROI: '20x',
    confidenceScore: 78,
    status: 'OPEN',
    aiRecommendation: 'Implement a hybrid model for enterprise and volume customers.',
    alternatives: [
      { name: 'Flat subscription', score: 58, cost: '$210K' },
      { name: 'Usage-based pricing', score: 83, cost: '$170K' },
      { name: 'Tiered bundles', score: 71, cost: '$190K' },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'dec_02',
    title: 'Agent Expansion Strategy',
    question: 'Should we extend our agent marketplace to support third-party microservices?',
    category: 'Product Strategy',
    riskScore: 4,
    businessImpact: 'Medium',
    expectedROI: '12x',
    confidenceScore: 64,
    status: 'IN_SIMULATION',
    aiRecommendation: 'Begin with a pilot partner program for select workflows.',
    alternatives: [
      { name: 'In-house agent expansion', score: 76, cost: '$250K' },
      { name: 'Partner integration', score: 85, cost: '$180K' },
      { name: 'No change', score: 45, cost: '$0' },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

const devAgents = [
  {
    id: 'agent_01',
    name: 'Astra',
    role: 'Strategy Agent',
    department: 'AI Operations',
    status: 'idle',
    skills: ['forecasting', 'decision support', 'workflow orchestration'],
    performanceScore: 94,
    monthlyCost: '$14,900',
    tools: ['Salesforce', 'Jira', 'Data Lake'],
    permissions: ['read:projects', 'execute:agents', 'manage:workflows'],
  },
  {
    id: 'agent_02',
    name: 'Nova',
    role: 'Governance Agent',
    department: 'Compliance',
    status: 'busy',
    skills: ['controls', 'policy analysis', 'audit readiness'],
    performanceScore: 88,
    monthlyCost: '$12,400',
    tools: ['Slack', 'Confluence', 'Zendesk'],
    permissions: ['read:decisions', 'write:reports', 'notify:stakeholders'],
  },
  {
    id: 'agent_03',
    name: 'Orion',
    role: 'Execution Agent',
    department: 'Engineering',
    status: 'reflecting',
    skills: ['automation', 'integration', 'fine-tuning'],
    performanceScore: 91,
    monthlyCost: '$13,800',
    tools: ['GitHub', 'AWS', 'Docker'],
    permissions: ['execute:pipelines', 'monitor:exec', 'deploy:agents'],
  },
];

function generateToken(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
}

function createAuthTokens(user: DevAuthUser) {
  const accessToken = generateToken('access');
  const refreshToken = generateToken('refresh');
  devAccessTokens.set(accessToken, user);
  devRefreshTokens.set(refreshToken, accessToken);
  return { accessToken, refreshToken };
}

function getUserFromAccessToken(token: string): DevAuthUser | null {
  return devAccessTokens.get(token) ?? null;
}

function getUserFromRefreshToken(refreshToken: string): DevAuthUser | null {
  const accessToken = devRefreshTokens.get(refreshToken);
  if (!accessToken) return null;
  return getUserFromAccessToken(accessToken);
}

function rotateRefreshToken(oldRefreshToken: string) {
  const currentUser = getUserFromRefreshToken(oldRefreshToken);
  if (!currentUser) return null;
  const newTokens = createAuthTokens(currentUser);
  devRefreshTokens.delete(oldRefreshToken);
  return newTokens;
}

function safeUserProfile(user: any) {
  if (!user) return null;
  const nameParts = typeof user.name === 'string' ? user.name.split(' ') : [];
  return {
    id: user.id || user.uid || 'user_unknown',
    email: user.email || 'unknown@cerefy.local',
    firstName: user.firstName || nameParts[0] || 'Cerefy',
    lastName: user.lastName || nameParts.slice(1).join(' ') || 'User',
    role: user.role || 'member',
    organizationId: user.organizationId || 'org_cerefy_101',
    organizationName: user.organizationName || 'Cerefy Enterprise',
    avatarUrl: user.avatarUrl || 'https://ui-avatars.com/api/?name=Cerefy+User&background=111827&color=00ffff',
    createdAt: user.createdAt || new Date().toISOString(),
  };
}

function getTenantId(req: AuthenticatedRequest): string {
  const headerTenant = req.headers['x-tenant-id'] as string;
  const userTenant = req.user?.tenantId || req.user?.organizationId;

  if (headerTenant) return headerTenant;
  if (userTenant) return userTenant;
  if (isLocalDevFallback()) return 'tenant_acme_101';

  throw new Error('Tenant ID is required for authenticated requests');
}

function convertNeo4jValue(value: any): any {
  if (value === null || value === undefined) return value;
  if (neo4j.isInt && neo4j.isInt(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(convertNeo4jValue);
  if (typeof value === 'object') {
    if (typeof value.toObject === 'function') {
      return convertNeo4jValue(value.toObject());
    }
    const converted: Record<string, any> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      converted[key] = convertNeo4jValue(nestedValue);
    }
    return converted;
  }
  return value;
}

async function getMemoryResults(query: string, tenantId: string, type = 'hybrid', limit = 5) {
  const aiClientInst = getGeminiClient();
  if (!aiClientInst) {
    throw new Error('AI Client not initialized. Check GEMINI_API_KEY.');
  }

  const encoded = await aiClientInst.models.embedContent({
    model: 'text-embedding-004',
    contents: query,
  });

  const queryVector = encoded.embeddings?.[0]?.values || [];
  if (!queryVector.length) {
    throw new Error('Failed to encode query for memory search');
  }

  const results: Array<any> = [];
  const pgResults: Array<any> = [];

  if (process.env.QDRANT_URL && process.env.QDRANT_API_KEY) {
    try {
      const qdrantUrl = process.env.QDRANT_URL.replace(/\/+$/, '');
      const qdrantCollection = process.env.QDRANT_COLLECTION || 'cerefy_memory';
      const qdrantResponse = await axios.post(
        `${qdrantUrl}/collections/${qdrantCollection}/points/search`,
        {
          vector: queryVector,
          limit,
          with_payload: true,
          with_vector: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.QDRANT_API_KEY,
          },
          timeout: 15000,
        }
      );

      if (Array.isArray(qdrantResponse.data?.result)) {
        qdrantResponse.data.result.forEach((item: any, index: number) => {
          results.push({
            id: item.id || `qdrant_${index}`,
            content: item.payload?.content || item.payload?.text || 'Vector search result',
            source: 'Qdrant',
            score: item.score ?? 0,
            type: 'vector',
            metadata: item.payload || {},
          });
        });
      }
    } catch (err) {
      logger.warn('Qdrant search failed, falling back to pgvector', { error: err });
    }
  }

  const vectorString = `[${queryVector.join(',')}]`;
  await withTenantContext(tenantId, async (tx) => {
    const queryResult = await tx.execute(
      `SELECT id, chunk_index, content, embedding <=> $1::vector AS distance
       FROM document_chunks
       WHERE tenant_id = $2 AND embedding IS NOT NULL
       ORDER BY distance
       LIMIT $3`,
      [vectorString, tenantId, limit]
    );

    const rows = (queryResult as any).rows || [];
    rows.forEach((row: any) => {
      pgResults.push({
        id: row.id,
        content: row.content,
        source: 'PostgreSQL PGVector',
        score: typeof row.distance === 'number' ? 1 / (1 + row.distance) : 0,
        type: 'vector',
        metadata: { chunkIndex: row.chunk_index },
      });
    });
  });

  if (type === 'vector') {
    return results.length > 0 ? results : pgResults;
  }

  if (type === 'graph' || type === 'hybrid') {
    const neo4jDriver = getNeo4jDriver();
    const session = neo4jDriver.session();
    try {
      const graphResults = await session.run(
        `MATCH (t:Tenant {id: $tenantId})<-[:BELONGS_TO]-(e:Entity)
         WHERE toLower(e.name) CONTAINS toLower($query)
            OR toLower(e.label) CONTAINS toLower($query)
         RETURN e.name AS name, e.label AS label, e AS entity
         LIMIT $limit`,
        { tenantId, query, limit }
      );

      graphResults.records.forEach((record: any) => {
        results.push({
          id: record.get('name') || record.get('label') || `node_${results.length + 1}`,
          content: `Entity: ${record.get('name')} (${record.get('label')})`,
          source: 'Neo4j',
          score: 0.8,
          type: 'graph',
          metadata: convertNeo4jValue(record.get('entity')),
        });
      });
    } catch (err) {
      logger.warn('Neo4j memory query failed', { error: err });
    } finally {
      await session.close();
    }
  }

  if (results.length > 0) return results;
  return pgResults;
}

function isLocalDevFallback(): boolean {
  // Local dev fallbacks are only enabled when explicitly requested via
  // DEV_LOCAL_FALLBACK=true in the environment and when not running in production.
  return process.env.NODE_ENV !== 'production' && process.env.DEV_LOCAL_FALLBACK === 'true';
}

function getProjectById(projectId: string) {
  return devProjects.find((project) => project.id === projectId) ?? null;
}

function getDecisionById(decisionId: string) {
  return devDecisions.find((decision) => decision.id === decisionId) ?? null;
}

function createDecision(payload: any) {
  const decision: DecisionRecord = {
    id: `dec_${crypto.randomBytes(6).toString('hex')}`,
    title: payload.title || 'New Decision Request',
    question: payload.question || 'What is the recommended choice?',
    category: payload.category || 'General',
    riskScore: 5,
    businessImpact: 'Medium',
    expectedROI: '8x',
    confidenceScore: 65,
    status: 'OPEN',
    aiRecommendation: 'Evaluate the alternate scenarios carefully.',
    alternatives: [
      { name: 'Option A', score: 68, cost: '$90K' },
      { name: 'Option B', score: 74, cost: '$110K' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  devDecisions.unshift(decision);
  return decision;
}

function createProject(payload: any) {
  const project: ProjectRecord = {
    id: `proj_${crypto.randomBytes(6).toString('hex')}`,
    title: payload.title || 'New Project',
    name: payload.title || 'New Project',
    code: payload.code || `NP-${Date.now().toString().slice(-4)}`,
    department: payload.department || 'Product',
    status: 'Planning',
    progress: 8,
    budget: payload.budget || '$50,000',
    budgetUsed: '$4,000',
    dueDate: payload.dueDate || new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10),
    assignees: ['Dev Team'],
    agentLead: payload.agentLead || 'Astra',
    milestonesCount: 6,
    completedMilestones: 0,
  };
  devProjects.unshift(project);
  return project;
}

function updateProject(projectId: string, updates: any) {
  const project = getProjectById(projectId);
  if (!project) return null;
  Object.assign(project, updates);
  return project;
}

function updateDecision(decisionId: string, updates: Partial<DecisionRecord>) {
  const decision = getDecisionById(decisionId);
  if (!decision) return null;
  Object.assign(decision, updates, { updatedAt: new Date().toISOString() });
  return decision;
}

function deleteProject(projectId: string) {
  const index = devProjects.findIndex((project) => project.id === projectId);
  if (index === -1) return false;
  devProjects.splice(index, 1);
  return true;
}

function getAnalyticsForProject(projectId: string) {
  return {
    projectId,
    openTasks: 32,
    completedTasks: 18,
    riskLevel: 'Moderate',
    burnRate: '0.82',
    stakeholderSentiment: 'Positive',
    timelineHealth: 'On Track',
    forecastedRevenue: '$32M',
    remainingBudget: '$89,000',
  };
}

function getExecutiveKPIs() {
  return {
    totalProjects: devProjects.length,
    activeAgents: devAgents.length,
    decisionsThisMonth: 12,
    avgConfidenceScore: 78,
    totalBudgetManaged: '$1.1M',
    projectCompletionRate: 62,
    agentUtilization: 81,
    riskScore: 37,
    automationRate: 69,
    costSavings: '$280K',
    roiMultiple: 4.2,
    processingTime: '1.8s',
  };
}

function getAgentPerformance() {
  return devAgents.map((agent) => ({
    agentId: agent.id,
    agentName: agent.name,
    tasksCompleted: 118 + Math.floor(Math.random() * 50),
    avgLatencyMs: 320 + Math.floor(Math.random() * 180),
    successRate: 85 + Math.floor(Math.random() * 10),
    tokensUsed: 14230 + Math.floor(Math.random() * 4200),
    costIncurred: `$${(Math.random() * 12 + 8).toFixed(1)}K`,
    lastActive: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24).toISOString(),
  }));
}


function getMemoryDocuments() {
  return [
    { id: 'doc_01', title: 'Cerefy Governance Framework', updatedAt: new Date().toISOString(), summary: 'Policy-first AI workflow governance', source: 'Knowledge Base' },
    { id: 'doc_02', title: 'Agent Runbooks', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), summary: 'Standard operating procedures for agent orchestration', source: 'Documentation Hub' },
  ];
}

function createAgentExecutionResponse(query: string, userId: string, sessionId = 'sess_default') {
  return {
    status: 'success',
    userId,
    sessionId,
    latencyMs: 420,
    plan: [
      { agentName: 'Astra', role: 'Strategy Agent', status: 'complete', output: 'Planned an orchestration path based on the latest governance data.', durationMs: 260 },
      { agentName: 'Orion', role: 'Execution Agent', status: 'complete', output: 'Prepared the execution environment and queued the workflow.', durationMs: 310 },
    ],
    response: `Agent result for query: ${query}`,
    reflectionCritique: 'The pipeline completed successfully with moderate confidence.',
    reflectionAttempts: 1,
    tokensUsed: 312,
    timestamp: new Date().toISOString(),
  };
}

function getFirebaseAdmin() {
  if (!firebaseApp) {
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        firebaseApp = admin.initializeApp({
          credential: (admin as any).credential.cert(credentials),
        });
      } else {
        firebaseApp = admin.initializeApp();
      }
      logger.info('Firebase Admin initialized');
    } catch (err) {
      logger.error('Failed to initialize Firebase Admin', { error: err });
    }
  }
  return firebaseApp;
}

// ─── Auth Middleware ──────────────────────────────────────────────────────
export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : authHeader;
 
  // DEV_AUTH_BYPASS is intentionally disabled for production readiness.
  // Local dev tokens should use the explicit local dev auth endpoints instead.
  
  if (bearerToken && isLocalDevFallback()) {
    const localUser = getUserFromAccessToken(bearerToken);
    if (localUser) {
      req.user = localUser as any;
      return next();
    }
  }
 
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const firebaseAdmin = getFirebaseAdmin();
    if (!firebaseAdmin) throw new Error('Firebase Admin not initialized');
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.warn('Auth verification failed', { error });
    res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

// ─── Apply API Rate Limiter to all /api/v1 routes ────────────────────────
app.use('/api/v1', apiRateLimiter);

// ─── Project Endpoints ────────────────────────────────────────────────────
app.get('/api/v1/projects', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = getTenantId(req);
  try {
    if (isLocalDevFallback()) {
      res.json({ status: 'success', data: devProjects });
      return;
    }
    const projects = await projectService.getAllProjects(tenantId);
    res.json({ status: 'success', data: projects });
  } catch (error) {
    logger.error('Failed to fetch projects', { error, tenantId });
    res.status(500).json({ status: 'error', message: 'Failed to fetch projects' });
  }
});

app.post('/api/v1/projects', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = getTenantId(req);
  try {
    if (isLocalDevFallback()) {
      const project = createProject(req.body);
      res.json({ status: 'success', data: project });
      return;
    }

    const project = await projectService.createProject(tenantId, req.body);
    res.json({ status: 'success', data: project });
  } catch (error) {
    logger.error('Failed to create project', { error, tenantId });
    res.status(500).json({ status: 'error', message: 'Failed to create project' });
  }
});

// ─── Decision Endpoints ───────────────────────────────────────────────────
app.get('/api/v1/decisions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = getTenantId(req);
  try {
    if (isLocalDevFallback()) {
      res.json({ status: 'success', data: devDecisions });
      return;
    }
    const results = await decisionService.getAllDecisions(tenantId);
    res.json({ status: 'success', data: results });
  } catch (error) {
    logger.error('Failed to fetch decisions', { error, tenantId });
    res.status(500).json({ status: 'error', message: 'Failed to fetch decisions' });
  }
});

app.post('/api/v1/decisions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = getTenantId(req);
  try {
    if (isLocalDevFallback()) {
      const decision = createDecision(req.body);
      res.json({ status: 'success', data: decision });
      return;
    }

    const decision = await decisionService.createDecision(tenantId, req.body);
    res.json({ status: 'success', data: decision });
  } catch (error) {
    logger.error('Failed to create decision', { error, tenantId });
    res.status(500).json({ status: 'error', message: 'Failed to create decision' });
  }
});

app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  // Local dev-only login is disabled by default. Enable DEV_LOCAL_FALLBACK=true to use in-memory auth for local testing.
  if (!isLocalDevFallback()) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const userRecord = devUsersByEmail.get(email.toLowerCase());
  if (!userRecord || userRecord.password !== password) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const tokens = createAuthTokens(userRecord.profile);
  res.json({ user: userRecord.profile, tokens });
});

app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
  // Local dev-only register is disabled by default. Enable DEV_LOCAL_FALLBACK=true to use in-memory auth for local testing.
  if (!isLocalDevFallback()) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  const { email, password, firstName, lastName, organizationName } = req.body;
  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ error: 'Email, password, first name and last name are required' });
    return;
  }

  const normalizedEmail = email.toLowerCase();
  if (devUsersByEmail.has(normalizedEmail)) {
    res.status(409).json({ error: 'User already exists' });
    return;
  }

  const newUser: DevAuthUser = {
    id: `user_${crypto.randomBytes(6).toString('hex')}`,
    email: normalizedEmail,
    firstName,
    lastName,
    role: 'member',
    organizationId: `org_${crypto.randomBytes(6).toString('hex')}`,
    organizationName: organizationName || 'Cerefy Organization',
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + '+' + lastName)}&background=111827&color=00ffff`,

    createdAt: new Date().toISOString(),
  };

  devUsersByEmail.set(normalizedEmail, { profile: newUser, password });
  const tokens = createAuthTokens(newUser);
  res.json({ user: newUser, tokens });
});

app.post('/api/v1/auth/refresh', async (req: Request, res: Response) => {
  // Local dev-only refresh is disabled by default. In production this endpoint
  // should be handled by the real auth provider. Enable DEV_LOCAL_FALLBACK=true
  // to enable in-memory refresh for local testing.
  if (!isLocalDevFallback()) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token is required' });
    return;
  }

  const tokens = rotateRefreshToken(refreshToken);
  if (!tokens) {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  res.json(tokens);
});

app.post('/api/v1/auth/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : authHeader;

  if (bearerToken && devAccessTokens.has(bearerToken)) {
    devAccessTokens.delete(bearerToken);
    for (const [refresh, access] of Array.from(devRefreshTokens.entries())) {
      if (access === bearerToken) {
        devRefreshTokens.delete(refresh);
      }
    }
  }

  res.status(200).json({ status: 'success' });
});

app.get('/api/v1/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  res.json(safeUserProfile(req.user));
});

app.get('/api/v1/projects/:projectId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.projectId;
  if (isLocalDevFallback()) {
    const project = getProjectById(projectId);
    if (!project) {
      res.status(404).json({ status: 'error', message: 'Project not found' });
      return;
    }
    res.json({ status: 'success', data: project });
    return;
  }

  try {
    const tenantId = getTenantId(req);
    const project = await projectService.getProjectById(tenantId, projectId);
    if (!project) {
      res.status(404).json({ status: 'error', message: 'Project not found' });
      return;
    }
    res.json({ status: 'success', data: project });
  } catch (error) {
    logger.error('Failed to fetch project', { error, projectId });
    res.status(500).json({ status: 'error', message: 'Failed to fetch project' });
  }
});

app.patch('/api/v1/projects/:projectId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.projectId;
  if (isLocalDevFallback()) {
    const project = updateProject(projectId, req.body);
    if (!project) {
      res.status(404).json({ status: 'error', message: 'Project not found' });
      return;
    }
    res.json({ status: 'success', data: project });
    return;
  }

  try {
    const tenantId = getTenantId(req);
    const project = await projectService.updateProject(tenantId, projectId, req.body);
    if (!project) {
      res.status(404).json({ status: 'error', message: 'Project not found' });
      return;
    }
    res.json({ status: 'success', data: project });
  } catch (error) {
    logger.error('Failed to update project', { error, projectId });
    res.status(500).json({ status: 'error', message: 'Failed to update project' });
  }
});

app.delete('/api/v1/projects/:projectId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.projectId;
  if (isLocalDevFallback()) {
    if (!deleteProject(projectId)) {
      res.status(404).json({ status: 'error', message: 'Project not found' });
      return;
    }
    res.status(204).send();
    return;
  }

  try {
    const tenantId = getTenantId(req);
    await projectService.deleteProject(tenantId, projectId);
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete project', { error, projectId });
    res.status(500).json({ status: 'error', message: 'Failed to delete project' });
  }
});

app.post('/api/v1/decisions/:decisionId/approve', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const decisionId = req.params.decisionId;
  if (isLocalDevFallback()) {
    const decision = updateDecision(decisionId, { status: 'APPROVED' });
    if (!decision) {
      res.status(404).json({ status: 'error', message: 'Decision not found' });
      return;
    }
    res.json({ data: decision });
    return;
  }

  try {
    const tenantId = getTenantId(req);
    const decision = await decisionService.approveDecision(tenantId, decisionId);
    res.json({ data: decision });
  } catch (error) {
    logger.error('Failed to approve decision', { error, decisionId });
    res.status(500).json({ status: 'error', message: 'Failed to approve decision' });
  }
});

app.post('/api/v1/decisions/:decisionId/reject', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const decisionId = req.params.decisionId;
  const reason = req.body.reason || 'No reason provided';
  if (isLocalDevFallback()) {
    const decision = updateDecision(decisionId, { status: 'REJECTED', aiRecommendation: `Rejected: ${reason}` });
    if (!decision) {
      res.status(404).json({ status: 'error', message: 'Decision not found' });
      return;
    }
    res.json({ data: decision });
    return;
  }

  try {
    const tenantId = getTenantId(req);
    const decision = await decisionService.rejectDecision(tenantId, decisionId, reason);
    res.json({ data: decision });
  } catch (error) {
    logger.error('Failed to reject decision', { error, decisionId });
    res.status(500).json({ status: 'error', message: 'Failed to reject decision' });
  }
});

app.post('/api/v1/decisions/:decisionId/simulate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const decisionId = req.params.decisionId;
  if (isLocalDevFallback()) {
    const decision = updateDecision(decisionId, {
      status: 'IN_SIMULATION',
      simulationResult: {
        expectedRevenue: '$2.3M',
        estimatedCost: '$310K',
        riskFactor: 'Medium',
        timeline: '14 weeks',
        confidence: 76,
      },
    });
    if (!decision) {
      res.status(404).json({ status: 'error', message: 'Decision not found' });
      return;
    }
    res.json({ data: decision });
    return;
  }

  try {
    const tenantId = getTenantId(req);
    const decision = await decisionService.simulateDecision(tenantId, decisionId);
    res.json({ data: decision });
  } catch (error) {
    logger.error('Failed to simulate decision', { error, decisionId });
    res.status(500).json({ status: 'error', message: 'Failed to simulate decision' });
  }
});

app.get('/api/v1/agents', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  res.json({ status: 'success', data: devAgents });
});

app.get('/api/v1/agents/:agentId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const agentId = req.params.agentId;
  const agent = devAgents.find((item) => item.id === agentId);
  if (!agent) {
    res.status(404).json({ status: 'error', message: 'Agent not found' });
    return;
  }
  res.json({ status: 'success', data: agent });
});

app.post('/api/v1/ai/pipeline/run', requireAuth, aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = getTenantId(req);
  const userId = req.user?.uid || 'user_admin_01';
  const { pipelineId, input = {} } = req.body;
  const startTime = Date.now();

  if (!pipelineId) {
    res.status(400).json({ error: 'pipelineId is required' });
    return;
  }

  const query = typeof input === 'object' && typeof input.query === 'string' && input.query.trim().length > 0
    ? input.query
    : pipelineId;

  try {
    const orchestrator = buildAgentOrchestrator();
    const finalState = await orchestrator.invoke({
      tenantId,
      query,
      plan: [],
      retrievedContext: '',
      reasoningOutput: '',
      reflectionCritique: '',
      status: 'started',
    });

    const durationMs = Date.now() - startTime;
    const payload = {
      status: 'success',
      tenantId,
      userId,
      sessionId: pipelineId,
      latencyMs: durationMs,
      plan: finalState.plan || [],
      response: finalState.reasoningOutput || 'No response generated.',
      reflectionCritique: finalState.reflectionCritique || 'No critique.',
      reflectionAttempts: 1,
      tokensUsed: 0,
      timestamp: new Date().toISOString(),
    };

    socketServer?.emit('agent.started', {
      agentId: 'pipeline_orchestrator',
      agentName: 'Pipeline Orchestrator',
      stepIndex: 1,
      totalSteps: 1,
      status: 'running',
      output: `Running pipeline ${pipelineId}`,
      durationMs,
      timestamp: new Date().toISOString(),
    });

    socketServer?.emit('agent.completed', {
      agentId: 'pipeline_orchestrator',
      agentName: 'Pipeline Orchestrator',
      status: 'completed',
      output: payload.response,
      latencyMs: durationMs,
      timestamp: payload.timestamp,
    });

    res.json(payload);
  } catch (error: any) {
    logger.error('Pipeline execution failed', { error: error?.message, tenantId, pipelineId });
    res.status(500).json({ status: 'error', message: error?.message || 'Pipeline execution failed' });
  }
});

app.post('/api/v1/ai/memory/query', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { query, type = 'hybrid', limit = 5 } = req.body;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query parameter is required' });
    return;
  }

  try {
    const tenantId = getTenantId(req);
    const results = await getMemoryResults(query, tenantId, type, Number(limit));
    res.json({ status: 'success', data: results });
  } catch (error: any) {
    logger.error('Memory query failed', { error, query });
    res.status(500).json({ status: 'error', message: error?.message || 'Memory query failed' });
  }
});

app.get('/api/v1/memory/documents', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const documentsList = await withTenantContext(tenantId, async (tx) => {
      return await tx.select().from(documents);
    });
    res.json({ status: 'success', data: documentsList });
  } catch (error: any) {
    logger.error('Failed to fetch memory documents', { error });
    res.status(500).json({ status: 'error', message: 'Failed to fetch memory documents' });
  }
});

app.get('/api/v1/analytics/executive-kpis', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  res.json(getExecutiveKPIs());
});

app.get('/api/v1/analytics/agent-performance', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  res.json({ data: getAgentPerformance() });
});

app.get('/api/v1/analytics/projects/:projectId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.projectId;
  res.json(getAnalyticsForProject(projectId));
});

// ─── AI Agent Orchestration ───────────────────────────────────────────────
app.post('/api/v1/agents/execute', requireAuth, aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = getTenantId(req);
  const userId = req.user?.uid || 'user_admin_01';
  const { query, sessionId = 'sess_default' } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({ error: 'Query parameter is required' });
    return;
  }

  const startTime = Date.now();

  try {
    const orchestrator = buildAgentOrchestrator();
    const finalState = await orchestrator.invoke({
      tenantId,
      query,
      plan: [],
      retrievedContext: '',
      reasoningOutput: '',
      reflectionCritique: '',
      status: 'started',
    });

    const durationMs = Date.now() - startTime;

    logger.info('Agent execution complete', { tenantId, userId, sessionId, durationMs });
    socketServer?.emit('agent.started', {
      agentId: 'agent_orchestrator',
      agentName: 'Orchestrator',
      stepIndex: 1,
      totalSteps: 3,
      status: 'running',
      output: `Executing query: ${query}`,
      durationMs,
      timestamp: new Date().toISOString(),
    });

    socketServer?.emit('agent.completed', {
      agentId: 'agent_orchestrator',
      agentName: 'Orchestrator',
      status: 'completed',
      output: finalState.reasoningOutput || 'Execution complete.',
      durationMs,
      timestamp: new Date().toISOString(),
    });

    res.json({
      status: 'success',
      tenantId,
      userId,
      sessionId,
      latencyMs: durationMs,
      plan: finalState.plan || [],
      response: finalState.reasoningOutput || 'No response generated.',
      reflectionCritique: finalState.reflectionCritique || 'No critique.',
      reflectionAttempts: 1,
      tokensUsed: 250,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Agent Execution Error', { error: error?.message, tenantId });
    res.status(500).json({
      status: 'error',
      message: error?.message || 'Agent execution failed',
      tenantId,
    });
  }
});

// ─── Document Ingestion ───────────────────────────────────────────────────
app.post('/api/v1/ingestion/chunk', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = getTenantId(req);
  const { content, chunkSize = 300, chunkOverlap = 40, title = 'Document' } = req.body;

  if (!content) {
    res.status(400).json({ error: 'Content string is required' });
    return;
  }

  const aiClientInst = getGeminiClient();
  if (!aiClientInst) {
    res.status(500).json({ error: 'AI Client not initialized. Check GEMINI_API_KEY.' });
    return;
  }

  try {
    const result = await ingestionService.processDocument(tenantId, title, content, aiClientInst, chunkSize, chunkOverlap);
    res.json({ status: 'success', title, documentId: result.documentId, chunkCount: result.chunkCount });
  } catch (error: any) {
    logger.error('Ingestion error', { error: error?.message, tenantId });
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// ─── Knowledge Graph Sandbox ──────────────────────────────────────────────
app.post('/api/v1/graph/cypher', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { cypher, tenantId: bodyTenantId } = req.body;
  if (!cypher || typeof cypher !== 'string') {
    res.status(400).json({ status: 'error', message: 'Cypher query is required' });
    return;
  }

  const tenantId = bodyTenantId || getTenantId(req);
  const queryText = cypher.trim();
  const prohibitedPattern = /\b(create|merge|delete|set|remove|drop|call|alter|detach|truncate)\b/i;

  if (prohibitedPattern.test(queryText)) {
    res.status(400).json({ status: 'error', message: 'Only read-only Cypher queries are permitted in this endpoint.' });
    return;
  }

  try {
    const neo4jDriver = getNeo4jDriver();
    const session = neo4jDriver.session();
    const startTime = Date.now();
    const result = await session.run(queryText, { tenantId });

    const records = result.records.map((record: any) => {
      const entry: Record<string, any> = {};
      record.keys.forEach((key: string) => {
        entry[key] = convertNeo4jValue(record.get(key));
      });
      return entry;
    });

    await session.close();
    res.json({
      status: 'success',
      query: queryText,
      tenantId,
      executedInMs: Date.now() - startTime,
      nodesMatched: result.records.length,
      records,
    });
  } catch (error: any) {
    logger.error('Cypher query execution failed', { error, query: queryText, tenantId });
    res.status(500).json({ status: 'error', message: error.message || 'Failed to execute Cypher query' });
  }
});

// ─── Error Handler ────────────────────────────────────────────────────────
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.headers['x-request-id'],
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1y', etag: false }));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Create HTTP server and attach Socket.IO for real-time
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  socketServer = io;

  io.on('connection', (socket) => {
    logger.info('[Socket.IO] client connected', { id: socket.id });

    // If dev bypass token supplied via query or auth, log it
    const token = (socket.handshake?.auth as any)?.token || socket.handshake.query?.token;
    if (token) {
      logger.info('[Socket.IO] client token', { token });
    }

    // In production the server should only relay real events from the backend orchestration
    // No simulated events or dev-only emitters are present here. If explicit local simulation
    // is needed a separate tooling script should be used under DEV_LOCAL_FALLBACK guard.

    // Keep socket listeners minimal — clients should authenticate and subscribe to rooms as needed.
    socket.on('disconnect', () => {
      logger.info('[Socket.IO] client disconnected', { id: socket.id });
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Cerefy Enterprise AI running`, {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      url: `http://0.0.0.0:${PORT}`,
    });
  });
}

startServer();
