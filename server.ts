import './instrumentation';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as projectService from './src/lib/projectService';
import * as ingestionService from './src/lib/ingestionService';
import * as decisionService from './src/lib/decisionService';
import { runCerefyAIPipeline } from './src/ai/runtime';
import { applicationDefault, initializeApp, getApp } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { logger, httpLogger } from './src/lib/logger';
import { corsMiddleware, securityHeaders, requestId, requestSizeLimiter } from './src/lib/securityMiddleware';
import { apiRateLimiter, authRateLimiter, aiRateLimiter } from './src/lib/rateLimiter';
import { livenessCheck, readinessCheck, simpleHealthCheck } from './src/lib/healthCheck';
import { createHttpMonitoring, renderPrometheus } from './src/lib/observability/httpMonitoring';
import { buildSloReport, emptyWindow } from './src/lib/observability/slo';
import { requirePermission } from './src/lib/security/expressRbac';
import { auditLog } from './src/lib/security/auditLog';
import { runGuardrails } from './src/lib/guardrails/guardrail';
import { observeAiConfidence, observeHumanOverride, observeAiOutcome } from './src/lib/observability/httpMonitoring';
import { provenanceStore } from './src/lib/reconstruction/store';
import { reconstructAnswer } from './src/lib/reconstruction/provenance';
import { MODEL_INVENTORY } from './src/lib/llm/modelInventory';
import { linkToRunbook } from './src/lib/observability/runbooks';
import { featureFlags } from './src/lib/featureFlags';
import * as authService from './src/lib/auth/authService';
import { verifyAccessToken } from './src/lib/auth/tokens';
import * as analyticsService from './src/lib/analyticsService';
import * as graphService from './src/lib/graphService';
import { listAgentDefinitions, getAgentDefinitionById } from './src/ai/registry';
import { loadVectorMemoryContext } from './src/ai/memory/vectorMemory';
import * as serializers from './src/lib/serializers';

// ─── Initialize Firebase Admin ───────────────────────────────────────────────
let firebaseApp: App | null = null;

function getFirebaseAdmin(): App {
  if (!firebaseApp) {
    try {
      // Check if already initialized
      firebaseApp = getApp();
    } catch {
      // Initialize with Application Default Credentials or explicit config
      firebaseApp = initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
      });
    }
  }
  return firebaseApp;
}

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

// ─── Global Middleware ─────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(requestId);
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(requestSizeLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(httpLogger);
app.use(createHttpMonitoring());

// ─── Health & Monitoring Endpoints (no auth, no rate limit) ───────────────────
app.get('/health', simpleHealthCheck);
app.get('/api/health', simpleHealthCheck);
app.get('/health/live', livenessCheck);
app.get('/health/ready', readinessCheck);

// ─── Metrics endpoint ─────────────────────────────────────────────────────────
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

// ─── Prometheus-style RED + AI metrics (documented §4.1) ──────────────────────
app.get('/api/metrics/render', (_req: Request, res: Response) => {
  res.type('text/plain').send(renderPrometheus());
});

// ─── SLO self-report (documented §4.2 — published in audit surface) ───────────
app.get('/api/slo', (_req: Request, res: Response) => {
  const phase = (process.env.SLO_PHASE as 'pilot' | 'scale') || 'pilot';
  res.json(buildSloReport(phase, emptyWindow()));
});

// ─── §4.3 runbook links — every alert resolves to a documented response. ──────
app.get('/api/runbooks/:alert', (_req: Request, res: Response) => {
  const { alert } = _req.params;
  const link = linkToRunbook(alert);
  const runbook = link.startsWith('runbook:unassigned') ? null : link;
  res.json({ alert, link, runbook });
});

// ─── Lazy Singletons ───────────────────────────────────────────────────────────
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
  { id: 'proj_01', title: 'Next-Gen Workflow Automation', name: 'Workflow Engine Modernization', code: 'WF-2026', department: 'Product', status: 'In Progress', progress: 58, budget: '$420,000', budgetUsed: '$243,000', dueDate: '2025-07-30', assignees: ['Amelia', 'Kai', 'Jordan'], agentLead: 'Ava AI', milestonesCount: 12, completedMilestones: 7 },
  { id: 'proj_02', title: 'Governance Intelligence Suite', name: 'Cerefy Governance Center', code: 'GC-2026', department: 'Operations', status: 'Planning', progress: 22, budget: '$180,000', budgetUsed: '$39,000', dueDate: '2025-10-15', assignees: ['Mia', 'Noah', 'Sofia'], agentLead: 'Atlas Agent', milestonesCount: 8, completedMilestones: 2 },
];

const devDecisions: DecisionRecord[] = [
  { id: 'dec_01', title: 'New Platform Pricing Model', question: 'Should we adopt a usage-based pricing model for Cerefy AI workflows?', category: 'Pricing', riskScore: 6, businessImpact: 'High', expectedROI: '20x', confidenceScore: 78, status: 'OPEN', aiRecommendation: 'Implement a hybrid model for enterprise and volume customers.', alternatives: [{ name: 'Flat subscription', score: 58, cost: '$210K' }, { name: 'Usage-based pricing', score: 83, cost: '$170K' }, { name: 'Tiered bundles', score: 71, cost: '$190K' }], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { id: 'dec_02', title: 'Agent Expansion Strategy', question: 'Should we extend our agent marketplace to support third-party microservices?', category: 'Product Strategy', riskScore: 4, businessImpact: 'Medium', expectedROI: '12x', confidenceScore: 64, status: 'IN_SIMULATION', aiRecommendation: 'Begin with a pilot partner program for select workflows.', alternatives: [{ name: 'In-house agent expansion', score: 76, cost: '$250K' }, { name: 'Partner integration', score: 85, cost: '$180K' }, { name: 'No change', score: 45, cost: '$0' }], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
];

const devAgents = [
  { id: 'agent_01', name: 'Astra', role: 'Strategy Agent', department: 'AI Operations', status: 'idle', skills: ['forecasting', 'decision support', 'workflow orchestration'], performanceScore: 94, monthlyCost: '$14,900', tools: ['Salesforce', 'Jira', 'Data Lake'], permissions: ['read:projects', 'execute:agents', 'manage:workflows'] },
  { id: 'agent_02', name: 'Nova', role: 'Governance Agent', department: 'Compliance', status: 'busy', skills: ['controls', 'policy analysis', 'audit readiness'], performanceScore: 88, monthlyCost: '$12,400', tools: ['Slack', 'Confluence', 'Zendesk'], permissions: ['read:decisions', 'write:reports', 'notify:stakeholders'] },
  { id: 'agent_03', name: 'Orion', role: 'Execution Agent', department: 'Engineering', status: 'reflecting', skills: ['automation', 'integration', 'fine-tuning'], performanceScore: 91, monthlyCost: '$13,800', tools: ['GitHub', 'AWS', 'Docker'], permissions: ['execute:pipelines', 'monitor:exec', 'deploy:agents'] },
];

function generateToken(prefix: string): string { return `${prefix}_${crypto.randomBytes(16).toString('hex')}`; }
function createAuthTokens(user: DevAuthUser) { const accessToken = generateToken('access'); const refreshToken = generateToken('refresh'); devAccessTokens.set(accessToken, user); devRefreshTokens.set(refreshToken, accessToken); return { accessToken, refreshToken }; }
function getUserFromAccessToken(token: string): DevAuthUser | null { return devAccessTokens.get(token) ?? null; }
function getUserFromRefreshToken(refreshToken: string): DevAuthUser | null { const accessToken = devRefreshTokens.get(refreshToken); if (!accessToken) return null; return getUserFromAccessToken(accessToken); }
function rotateRefreshToken(oldRefreshToken: string) { const currentUser = getUserFromRefreshToken(oldRefreshToken); if (!currentUser) return null; const newTokens = createAuthTokens(currentUser); devRefreshTokens.delete(oldRefreshToken); return newTokens; }
function safeUserProfile(user: any) { if (!user) return null; const nameParts = typeof user.name === 'string' ? user.name.split(' ') : []; return { id: user.id || user.uid || 'user_unknown', email: user.email || 'unknown@cerefy.local', firstName: user.firstName || nameParts[0] || 'Cerefy', lastName: user.lastName || nameParts.slice(1).join(' ') || 'User', role: user.role || 'member', organizationId: user.organizationId || 'org_cerefy_101', organizationName: user.organizationName || 'Cerefy Enterprise', avatarUrl: user.avatarUrl || 'https://ui-avatars.com/api/?name=Cerefy+User&background=111827&color=00ffff', createdAt: user.createdAt || new Date().toISOString() }; }
function isLocalDevFallback(): boolean { return process.env.NODE_ENV !== 'production' && process.env.DEV_LOCAL_FALLBACK === 'true'; }
function getProjectById(projectId: string) { return devProjects.find((project) => project.id === projectId) ?? null; }
function getDecisionById(decisionId: string) { return devDecisions.find((decision) => decision.id === decisionId) ?? null; }
function createDecision(payload: any) { const decision: DecisionRecord = { id: `dec_${crypto.randomBytes(6).toString('hex')}`, title: payload.title || 'New Decision Request', question: payload.question || 'What is the recommended choice?', category: payload.category || 'General', riskScore: 5, businessImpact: 'Medium', expectedROI: '8x', confidenceScore: 65, status: 'OPEN', aiRecommendation: 'Evaluate the alternate scenarios carefully.', alternatives: [{ name: 'Option A', score: 68, cost: '$90K' }, { name: 'Option B', score: 74, cost: '$110K' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; devDecisions.unshift(decision); return decision; }
function createProject(payload: any) { const project: ProjectRecord = { id: `proj_${crypto.randomBytes(6).toString('hex')}`, title: payload.title || 'New Project', name: payload.title || 'New Project', code: payload.code || `NP-${Date.now().toString().slice(-4)}`, department: payload.department || 'Product', status: 'Planning', progress: 8, budget: payload.budget || '$50,000', budgetUsed: '$4,000', dueDate: payload.dueDate || new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10), assignees: ['Dev Team'], agentLead: payload.agentLead || 'Astra', milestonesCount: 6, completedMilestones: 0 }; devProjects.unshift(project); return project; }
function updateProject(projectId: string, updates: any) { const project = getProjectById(projectId); if (!project) return null; Object.assign(project, updates); return project; }
function updateDecision(decisionId: string, updates: Partial<DecisionRecord>) { const decision = getDecisionById(decisionId); if (!decision) return null; Object.assign(decision, updates, { updatedAt: new Date().toISOString() }); return decision; }
function deleteProject(projectId: string) { const index = devProjects.findIndex((project) => project.id === projectId); if (index === -1) return false; devProjects.splice(index, 1); return true; }
function getAnalyticsForProject(projectId: string) { return { projectId, openTasks: 32, completedTasks: 18, riskLevel: 'Moderate', burnRate: '0.82', stakeholderSentiment: 'Positive', timelineHealth: 'On Track', forecastedRevenue: '$32M', remainingBudget: '$89,000' }; }
function getExecutiveKPIs() { return { totalProjects: devProjects.length, activeAgents: devAgents.length, decisionsThisMonth: 12, avgConfidenceScore: 78, totalBudgetManaged: '$1.1M', projectCompletionRate: 62, agentUtilization: 81, riskScore: 37, automationRate: 69, costSavings: '$280K', roiMultiple: 4.2, processingTime: '1.8s' }; }
function getAgentPerformance() { return devAgents.map((agent) => ({ agentId: agent.id, agentName: agent.name, tasksCompleted: 118 + Math.floor(Math.random() * 50), avgLatencyMs: 320 + Math.floor(Math.random() * 180), successRate: 85 + Math.floor(Math.random() * 10), tokensUsed: 14230 + Math.floor(Math.random() * 4200), costIncurred: `$${(Math.random() * 12 + 8).toFixed(1)}K`, lastActive: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24).toISOString() })); }
function getMemoryResults(query: string) { return [{ id: `mem_${crypto.randomBytes(4).toString('hex')}`, content: `Insight about ${query}: Cerefy learns from historical workflows and recommends next-best actions.`, source: 'Knowledge Graph', score: 0.92, type: 'vector', metadata: { topic: 'workflow', relevance: 'high' } }, { id: `mem_${crypto.randomBytes(4).toString('hex')}`, content: `Document snippet related to ${query}: Use the integrated agent pipeline for real-time decision automation.`, source: 'Document Store', score: 0.84, type: 'relational', metadata: { topic: 'automation', relevance: 'medium' } }]; }
function getMemoryDocuments() { return [{ id: 'doc_01', title: 'Cerefy Governance Framework', updatedAt: new Date().toISOString(), summary: 'Policy-first AI workflow governance', source: 'Knowledge Base' }, { id: 'doc_02', title: 'Agent Runbooks', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), summary: 'Standard operating procedures for agent orchestration', source: 'Documentation Hub' }]; }

async function verifyBearerToken(token: string): Promise<DevAuthUser | DecodedIdToken | null> {
  // 1) Cerefy JWTs (durable auth) — access tokens issued by authService.
  const claims = verifyAccessToken(token);
  if (claims) {
    return {
      uid: claims.sub,
      id: claims.sub,
      email: claims.email,
      name: claims.name,
      role: claims.role,
      tenantId: claims.tid,
      organizationId: claims.tid,
      organizationName: claims.org,
      createdAt: new Date().toISOString(),
      __jwt: true,
    } as unknown as DevAuthUser;
  }
  // 2) Local dev-fallback opaque tokens.
  if (isLocalDevFallback()) {
    const localUser = getUserFromAccessToken(token);
    if (localUser) return localUser as any;
  }
  // 3) Firebase ID tokens.
  try {
    const firebaseAdmin = getFirebaseAdmin();
    if (!firebaseAdmin) return null;
    return await getAuth(firebaseAdmin).verifyIdToken(token);
  } catch (error) {
    logger.warn('Token verification failed', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

export interface AuthenticatedRequest extends Request { user?: DecodedIdToken; tenantId?: string; }
const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => { const authHeader = req.headers.authorization; const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : authHeader; if (!bearerToken) { res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' }); return; } const user = await verifyBearerToken(bearerToken); if (!user) { res.status(403).json({ error: 'Unauthorized: Invalid token' }); return; } req.user = user as any; next(); };

// ─── Tenant Resolution (authoritative — never trusts client-supplied headers) ──
// The tenant is derived ONLY from the verified identity:
//  - local dev-fallback sessions: the in-memory user record's organizationId
//  - Firebase-verified sessions: the tenantId/organizationId CUSTOM CLAIM on the
//    verified ID token, which can only be set server-side (e.g. via
//    admin.auth().setCustomUserClaims) and can never be forged by the client.
// The `x-tenant-id` request header is intentionally never read for
// authorization purposes anywhere in this file.
function resolveTenantId(user: any): string | null {
  if (!user) return null;
  // Works for both local DevAuthUser records (organizationId) and verified
  // Firebase ID tokens (tenantId / organizationId custom claims).
  const claimTenant = user.tenantId || user.organizationId;
  if (typeof claimTenant === 'string' && claimTenant.trim().length > 0) return claimTenant;
  return null;
}

const requireTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const tenantId = resolveTenantId(req.user);
  if (!tenantId) {
    logger.warn('Tenant resolution failed for authenticated request', { path: req.path, uid: (req.user as any)?.uid || (req.user as any)?.id });
    res.status(403).json({ status: 'error', message: 'Forbidden: no tenant membership associated with this account' });
    return;
  }
  req.tenantId = tenantId;
  next();
};

// ─── §12 answer provenance reconstruction (audit surface, gated read:audit) ───
// The "one metric that matters": for any answer, reconstruct its retrieved
// data, model/prompt version, confidence, cost, and human follow-up on demand.
app.get('/api/v1/ai/answers/:answerId/reconstruction', requireAuth, requireTenant, requirePermission('read:audit', 'audit.log'), (req: AuthenticatedRequest, res: Response) => {
  if (!featureFlags.isEnabled('reconstruction_endpoint', req.tenantId)) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'not found', requestId: req.headers['x-request-id'] } });
    return;
  }
  const answer = provenanceStore.answers().find((a) => a.id === req.params.answerId && a.tenantId === req.tenantId);
  if (!answer) {
    res.status(404).json({ error: { code: 'ANSWER_NOT_FOUND', message: `No answer with id ${req.params.answerId}`, requestId: req.headers['x-request-id'] } });
    return;
  }
  const query = answer.queryId ? provenanceStore.queries().find((q) => q.id === answer.queryId) ?? null : null;
  const followUps = provenanceStore.followUps().filter((f) => f.answerId === answer.id);
  const reconstructed = reconstructAnswer({ answer, query, followUps, inventory: MODEL_INVENTORY });
  if (!reconstructed.reconstructable) {
    res.status(422).json({ error: { code: 'ANSWER_NOT_RECONSTRUCTABLE', message: `Answer ${answer.id} cannot be fully reconstructed: ${reconstructed.gaps.join('; ')}`, requestId: req.headers['x-request-id'] } });
    return;
  }
  res.json({ data: reconstructed, meta: { requestId: req.headers['x-request-id'], tenantId: req.tenantId } });
});

// ─── §11.5 outcome-linked metric: human confirms whether a decision outcome ───
// achieved what was expected — ties the answer to a real business result.
app.post('/api/v1/ai/answers/:answerId/outcome', requireAuth, requireTenant, requirePermission('read:projects', 'project'), async (req: AuthenticatedRequest, res: Response) => {
  if (!featureFlags.isEnabled('outcome_linking', req.tenantId)) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'not found', requestId: req.headers['x-request-id'] } });
    return;
  }
  const { achieved, note } = req.body ?? {};
  if (typeof achieved !== 'boolean') {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'achieved (boolean) is required', requestId: req.headers['x-request-id'] } });
    return;
  }
  await provenanceStore.recordFollowUp({
    answerId: req.params.answerId,
    actorId: (req.user as any)?.uid || 'unknown',
    action: 'approved',
    reviewedAt: new Date().toISOString(),
    outcome: { achieved, confirmedAt: new Date().toISOString(), note: typeof note === 'string' ? note : undefined },
  });
  auditLog.log({ action: 'ai.answer.outcome', actorId: (req.user as any)?.uid || 'unknown', actorRole: (req.user as any)?.role || 'member', tenantId: req.tenantId!, resource: 'ai.answer', detail: { answerId: req.params.answerId, achieved, note: typeof note === 'string' ? note : undefined } }).catch(() => {});
  observeAiOutcome(req.tenantId!, achieved);
  res.json({ data: { answerId: req.params.answerId, achieved, recorded: true }, meta: { requestId: req.headers['x-request-id'], tenantId: req.tenantId } });
});

// ─── §7 audit trail read surface (gated read:audit) ─────────────────────────
// Real tenant-scoped rows from the Postgres `audit_log` table, newest first.
app.get('/api/v1/audit', requireAuth, requireTenant, requirePermission('read:audit', 'audit.log'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = await auditLog.list(req.tenantId!);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to read audit log', { error });
    res.status(500).json({ status: 'error', message: 'Failed to read audit log' });
  }
});

app.use('/api/v1', apiRateLimiter);

// ─── Simple User Store (replace with database in production) ──────────────────
interface StoredUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
}

const userStore = new Map<string, StoredUser>();

// ─── Auth Routes (no requireAuth - used for authentication) ──────────────────
// Durable auth in production: Postgres-backed users/orgs/sessions with scrypt
// password hashing and real JWT access tokens (authService). The in-memory dev
// store is used ONLY under DEV_LOCAL_FALLBACK so local development keeps working
// without a database — never in production.
app.post('/api/v1/auth/register', authRateLimiter, async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, organizationName } = req.body;
  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ error: 'Email, password, first name and last name are required' });
    return;
  }
  if (isLocalDevFallback()) {
    const normalizedEmail = String(email).toLowerCase();
    if (userStore.has(normalizedEmail)) { res.status(409).json({ error: 'Email already registered' }); return; }
    const newUser: StoredUser = {
      id: `user_${crypto.randomBytes(8).toString('hex')}`,
      email: normalizedEmail,
      password, // NOTE: dev-fallback only; production hashes via authService
      firstName,
      lastName,
      role: 'admin',
      organizationId: `org_${crypto.randomBytes(8).toString('hex')}`,
      organizationName: organizationName || `${firstName}'s Organization`,
      createdAt: new Date().toISOString(),
    };
    userStore.set(normalizedEmail, newUser);
    const profile: DevAuthUser = {
      id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName, role: newUser.role,
      organizationId: newUser.organizationId, organizationName: newUser.organizationName,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.firstName + ' ' + newUser.lastName)}&background=111827&color=00ffff`,
      createdAt: newUser.createdAt,
    };
    devUsersByEmail.set(normalizedEmail, { profile, password });
    const { accessToken, refreshToken } = createAuthTokens(profile);
    logger.info('User registered (dev fallback)', { email: normalizedEmail });
    res.json({ user: profile, tokens: { accessToken, refreshToken } });
    return;
  }
  try {
    const { user, tokens } = await authService.register({ email, password, firstName, lastName, organizationName });
    logger.info('User registered', { email: user.email, orgId: user.organizationId });
    auditLog.log({ action: 'user.registered', actorId: user.id, actorRole: user.role, tenantId: user.organizationId, resource: 'user', detail: { email: user.email } }).catch(() => {});
    res.json({ user, tokens });
  } catch (err: any) {
    const status = err instanceof authService.DatabaseUnavailableError ? 503 : err?.status || 500;
    const message = err instanceof authService.DatabaseUnavailableError
      ? 'Registration temporarily unavailable (database not reachable). Please try again shortly.'
      : err?.status ? err.message : 'Registration failed.';
    res.status(status).json({ error: message });
  }
});

app.post('/api/v1/auth/login', authRateLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: 'Email and password are required' }); return; }
  if (isLocalDevFallback()) {
    const normalizedEmail = String(email).toLowerCase();
    const user = userStore.get(normalizedEmail);
    const stored = devUsersByEmail.get(normalizedEmail) ?? (userStore.has(normalizedEmail) ? { profile: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, organizationId: user.organizationId, organizationName: user.organizationName, avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=111827&color=00ffff`, createdAt: user.createdAt }, password: user.password } : null);
    if (!user || !stored || stored.password !== password) { res.status(401).json({ error: 'Invalid email or password' }); return; }
    const { accessToken, refreshToken } = createAuthTokens(stored.profile);
    res.json({ user: stored.profile, tokens: { accessToken, refreshToken } });
    return;
  }
  try {
    const { user, tokens } = await authService.login({ email, password });
    res.json({ user, tokens });
  } catch (err: any) {
    const status = err instanceof authService.DatabaseUnavailableError ? 503 : err?.status || 500;
    const message = err instanceof authService.DatabaseUnavailableError
      ? 'Login temporarily unavailable (database not reachable). Please try again shortly.'
      : err?.status ? err.message : 'Login failed.';
    res.status(status).json({ error: message });
  }
});

app.post('/api/v1/auth/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken || typeof refreshToken !== 'string') { res.status(400).json({ error: 'refreshToken is required' }); return; }
  if (isLocalDevFallback()) {
    const newAccessToken = crypto.randomBytes(32).toString('hex');
    res.json({ accessToken: newAccessToken, refreshToken: crypto.randomBytes(32).toString('hex') });
    return;
  }
  try {
    const { user, tokens } = await authService.refresh(refreshToken);
    res.json({ user, ...tokens });
  } catch (err: any) {
    const status = err instanceof authService.DatabaseUnavailableError ? 503 : err?.status || 401;
    res.status(status).json({ error: err?.status ? err.message : 'Invalid or expired refresh token' });
  }
});

app.post('/api/v1/auth/logout', async (req: Request, res: Response) => {
  const { refreshToken } = req.body ?? {};
  if (isLocalDevFallback()) { res.json({ status: 'success' }); return; }
  if (typeof refreshToken === 'string') await authService.logout(refreshToken);
  res.json({ status: 'success' });
});

app.get('/api/v1/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user as any;
  if (user?.__jwt) {
    try {
      const profile = await authService.meFromClaims(user);
      if (profile) { res.json(profile); return; }
    } catch {
      // fall through to token-derived response below rather than crashing /me
    }
  }
  res.json({ id: user.uid || user.id, email: user.email, firstName: user.name?.split(' ')[0] || '', lastName: user.name?.split(' ').slice(1).join(' ') || '', role: user.role || 'member', organizationId: user.organizationId || '', organizationName: user.organizationName || '', avatarUrl: user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=111827&color=00ffff`, createdAt: user.createdAt || new Date().toISOString() });
});

// ─── Projects Routes ──────────────────────────────────────────────────────────
app.get('/api/v1/projects', requireAuth, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  try {
    if (isLocalDevFallback()) { res.json({ status: 'success', data: devProjects }); return; }
    const rows = await projectService.getAllProjects(tenantId);
    res.json({ status: 'success', data: rows.map(serializers.serializeProject) });
  } catch (error) { logger.error('Failed to fetch projects', { error, tenantId }); res.status(500).json({ status: 'error', message: 'Failed to fetch projects' }); }
});

app.post('/api/v1/projects', requireAuth, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  try {
    if (isLocalDevFallback()) { res.json({ status: 'success', data: createProject(req.body) }); return; }
    const body = req.body ?? {};
    // Frontend create contract sends { title, department, budget, dueDate }. The
    // table requires a code — derive a stable slug from the title instead of
    // inventing data, and default status/progress to their real column defaults.
    const payload = {
      title: body.title,
      code: body.code || String(body.title || 'project').toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 12) || `PRJ-${Date.now().toString().slice(-4)}`,
      department: body.department,
      status: body.status ?? 'Planning',
      progress: body.progress ?? 0,
      budget: body.budget,
      dueDate: body.dueDate,
    };
    const row = await projectService.createProject(tenantId, payload);
    res.json({ status: 'success', data: serializers.serializeProject(row) });
  } catch (error) { logger.error('Failed to create project', { error, tenantId }); res.status(500).json({ status: 'error', message: 'Failed to create project' }); }
});

app.get('/api/v1/decisions', requireAuth, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  try { if (isLocalDevFallback()) { res.json({ status: 'success', data: devDecisions }); return; } const rows = await decisionService.getAllDecisions(tenantId); res.json({ status: 'success', data: rows.map(serializers.serializeDecision) }); } catch (error) { logger.error('Failed to fetch decisions', { error, tenantId }); res.status(500).json({ status: 'error', message: 'Failed to fetch decisions' }); }
});

app.post('/api/v1/decisions', requireAuth, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  try {
    if (isLocalDevFallback()) { res.json({ status: 'success', data: createDecision(req.body) }); return; }
    const body = req.body ?? {};
    // Frontend create contract sends { title, question, category }. Defaults to
    // real column defaults; no fabricated risk/ROI/confidence values.
    const payload = {
      title: body.title,
      question: body.question,
      status: 'OPEN',
    };
    const row = await decisionService.createDecision(tenantId, payload);
    res.json({ status: 'success', data: serializers.serializeDecision(row) });
  } catch (error) { logger.error('Failed to create decision', { error, tenantId }); res.status(500).json({ status: 'error', message: 'Failed to create decision' }); }
});

app.get('/api/v1/projects/:projectId', requireAuth, requireTenant, async (req: AuthenticatedRequest, res: Response) => { const projectId = req.params.projectId; if (isLocalDevFallback()) { const project = getProjectById(projectId); if (!project) { res.status(404).json({ status: 'error', message: 'Project not found' }); return; } res.json({ status: 'success', data: project }); return; } try { const tenantId = req.tenantId!; const project = await projectService.getProjectById(tenantId, projectId); res.json({ status: 'success', data: serializers.serializeProject(project) }); } catch (error) { logger.error('Failed to fetch project', { error, projectId }); res.status(500).json({ status: 'error', message: 'Failed to fetch project' }); } });
app.patch('/api/v1/projects/:projectId', requireAuth, requireTenant, requirePermission('edit:project', 'project'), async (req: AuthenticatedRequest, res: Response) => { const projectId = req.params.projectId; if (isLocalDevFallback()) { const project = updateProject(projectId, req.body); if (!project) { res.status(404).json({ status: 'error', message: 'Project not found' }); return; } res.json({ status: 'success', data: project }); return; } try { const tenantId = req.tenantId!; const project = await projectService.updateProject(tenantId, projectId, req.body); await auditLog.log({ action: 'project.update', actorId: (req.user as any)?.uid || 'unknown', actorRole: (req.user as any)?.role || 'member', tenantId, resource: 'project', detail: { projectId } }).catch(() => {}); res.json({ status: 'success', data: project }); } catch (error) { logger.error('Failed to update project', { error, projectId }); res.status(500).json({ status: 'error', message: 'Failed to update project' }); } });
app.delete('/api/v1/projects/:projectId', requireAuth, requireTenant, requirePermission('delete:project', 'project'), async (req: AuthenticatedRequest, res: Response) => { const projectId = req.params.projectId; if (isLocalDevFallback()) { if (!deleteProject(projectId)) { res.status(404).json({ status: 'error', message: 'Project not found' }); return; } res.status(204).send(); return; } try { const tenantId = req.tenantId!; await projectService.deleteProject(tenantId, projectId); await auditLog.log({ action: 'project.delete', actorId: (req.user as any)?.uid || 'unknown', actorRole: (req.user as any)?.role || 'member', tenantId, resource: 'project', detail: { projectId } }).catch(() => {}); res.status(204).send(); } catch (error) { logger.error('Failed to delete project', { error, projectId }); res.status(500).json({ status: 'error', message: 'Failed to delete project' }); } });

app.post('/api/v1/decisions/:decisionId/approve', requireAuth, requireTenant, requirePermission('approve:decision', 'decision'), async (req: AuthenticatedRequest, res: Response) => { const decisionId = req.params.decisionId; if (isLocalDevFallback()) { const decision = updateDecision(decisionId, { status: 'APPROVED' }); if (!decision) { res.status(404).json({ status: 'error', message: 'Decision not found' }); return; } await auditLog.log({ action: 'decision.approve', actorId: (req.user as any)?.uid || 'unknown', actorRole: (req.user as any)?.role || 'member', tenantId: req.tenantId || '', resource: 'decision', detail: { decisionId } }).catch(() => {}); res.json({ data: decision }); return; } try { const tenantId = req.tenantId!; const decision = await decisionService.approveDecision(tenantId, decisionId); await auditLog.log({ action: 'decision.approve', actorId: (req.user as any)?.uid || 'unknown', actorRole: (req.user as any)?.role || 'member', tenantId, resource: 'decision', detail: { decisionId } }).catch(() => {}); res.json({ data: decision }); } catch (error) { logger.error('Failed to approve decision', { error, decisionId }); res.status(500).json({ status: 'error', message: 'Failed to approve decision' }); } });
app.post('/api/v1/decisions/:decisionId/reject', requireAuth, requireTenant, requirePermission('reject:decision', 'decision'), async (req: AuthenticatedRequest, res: Response) => { const decisionId = req.params.decisionId; const reason = req.body.reason || 'No reason provided'; if (isLocalDevFallback()) { const decision = updateDecision(decisionId, { status: 'REJECTED', aiRecommendation: `Rejected: ${reason}` }); if (!decision) { res.status(404).json({ status: 'error', message: 'Decision not found' }); return; } await auditLog.log({ action: 'decision.reject', actorId: (req.user as any)?.uid || 'unknown', actorRole: (req.user as any)?.role || 'member', tenantId: req.tenantId || '', resource: 'decision', detail: { decisionId, reason } }).catch(() => {}); res.json({ data: decision }); return; } try { const tenantId = req.tenantId!; const decision = await decisionService.rejectDecision(tenantId, decisionId, reason); await auditLog.log({ action: 'decision.reject', actorId: (req.user as any)?.uid || 'unknown', actorRole: (req.user as any)?.role || 'member', tenantId, resource: 'decision', detail: { decisionId, reason } }).catch(() => {}); res.json({ data: decision }); } catch (error) { logger.error('Failed to reject decision', { error, decisionId }); res.status(500).json({ status: 'error', message: 'Failed to reject decision' }); } });
app.post('/api/v1/decisions/:decisionId/simulate', requireAuth, requireTenant, requirePermission('simulate:decision', 'decision'), async (_req: AuthenticatedRequest, res: Response) => { res.status(501).json({ status: 'error', message: 'Decision simulation is not implemented — no real simulation backend exists yet' }); });

app.get('/api/v1/agents', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (isLocalDevFallback()) { res.json({ data: devAgents }); return; }
  try {
    const rows = await listAgentDefinitions();
    const executions = await analyticsService.getTenantExecutions((req as any).tenantId || (req.user as any)?.tenantId || '');
    res.json({ data: rows.map((agent: any) => serializers.serializeAgent(agent, executions)) });
  } catch (error) {
    logger.error('Failed to list agents', { error });
    res.status(500).json({ status: 'error', message: 'Failed to list agents' });
  }
});
app.get('/api/v1/agents/:agentId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const agentId = req.params.agentId;
  if (isLocalDevFallback()) {
    const agent = devAgents.find((item) => item.id === agentId);
    if (!agent) { res.status(404).json({ status: 'error', message: 'Agent not found' }); return; }
    res.json({ data: agent });
    return;
  }
  try {
    const agent: any = await getAgentDefinitionById(agentId);
    if (!agent) { res.status(404).json({ status: 'error', message: 'Agent not found' }); return; }
    const executions = await analyticsService.getTenantExecutions((req as any).tenantId || (req.user as any)?.tenantId || '');
    res.json({ data: serializers.serializeAgent(agent, executions) });
  } catch (error) {
    logger.error('Failed to fetch agent', { error, agentId });
    res.status(500).json({ status: 'error', message: 'Failed to fetch agent' });
  }
});

app.post('/api/v1/ai/run', requireAuth, requireTenant, requirePermission('query:run', 'ai.workspace'), aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => { const tenantId = req.tenantId!; const userId = (req.user as any)?.uid || (req.user as any)?.id || 'user_admin_01'; const { type, documentId, projectId, documents = [], requirements = [], decisions = [], metadata = {} } = req.body || {}; if (!type || typeof type !== 'string') { res.status(400).json({ error: 'type is required' }); return; } const result = await runCerefyAIPipeline({ type, tenantId, userId, projectId, documentId, documents, requirements, decisions, metadata: { ...metadata, requestedBy: userId } }, socketServer); const confidence = result.confidence ?? null; if (confidence != null) observeAiConfidence(tenantId, confidence); const outputSources = Array.isArray(result.output?.sources) ? result.output.sources.filter((s: { id?: string; content?: string }) => s && typeof s.content === 'string') : []; const answerText = typeof result.output?.answer === 'string' && result.output.answer.trim().length > 0 ? result.output.answer : (typeof result.output?.summary === 'string' ? result.output.summary : ''); const provenance = (result.output?.provenance ?? {}) as { modelId?: string; promptVersion?: string; tokensInput?: number; tokensOutput?: number; costUsd?: number }; const modelVersion = String(provenance.modelId || result.output?.modelVersion || process.env.LLM_MODEL || 'gemini-2.5-flash'); const promptVersion = String(provenance.promptVersion || result.output?.promptVersion || 'analysis_v1'); const tokensInput = provenance.tokensInput ?? 0; const tokensOutput = provenance.tokensOutput ?? 0; const costUsd = provenance.costUsd ?? 0; const realSources = outputSources.map((s: { id?: string; content?: string }) => ({ id: s.id ?? 'unknown', content: s.content ?? '' })); if (result.status !== 'FAILED') {
  const recordedQuery = await provenanceStore.recordQuery({ tenantId, userId, type, tokensInput, tokensOutput, costUsd });
  await provenanceStore.recordAnswer({
    tenantId,
    queryId: recordedQuery.id,
    modelVersion,
    promptVersion,
    confidence: confidence ?? 0,
    output: { ...(result.output ?? {}), executionId: result.executionId },
    sources: realSources,
    humanReviewStatus: 'PENDING',
    humanEdited: false,
  });
  auditLog.log({ action: 'ai.run.completed', actorId: userId, actorRole: (req.user as any)?.role || 'member', tenantId, resource: 'ai.execution', detail: { executionId: result.executionId, answerId: recordedQuery.id, confidence: confidence ?? 0, tokensInput, tokensOutput, costUsd } }).catch(() => {});
} if (result.status !== 'FAILED' && (answerText || realSources.length > 0)) { const guard = runGuardrails({ answer: answerText, confidence, sources: realSources, retrieved: realSources, hasHumanFollowup: false }); if (guard.decision !== 'deliver' && guard.decision !== 'escalate') { observeHumanOverride(tenantId, true); res.status(202).json({ executionId: result.executionId, status: 'REVIEW_REQUIRED', output: result.output, confidence, guardrail: { decision: guard.decision, reasons: guard.reasons } }); return; } } res.status(result.status === 'FAILED' ? 500 : 202).json({ executionId: result.executionId, status: result.status, output: result.output, confidence, ...(answerText ? { guardrail: { decision: 'deliver', reasons: [] } } : {}) }); });
app.post('/api/v1/ai/pipeline/run', requireAuth, requireTenant, requirePermission('run:pipeline', 'ai.workspace'), aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => { const { pipelineId } = req.body; if (!pipelineId) { res.status(400).json({ error: 'pipelineId is required' }); return; } const result = await runCerefyAIPipeline({ type: 'pipeline_run', tenantId: req.tenantId!, userId: (req.user as any)?.uid || 'user_admin_01', metadata: { pipelineId } }, socketServer); res.status(result.status === 'FAILED' ? 500 : 202).json({ executionId: result.executionId, status: result.status, output: result.output, confidence: result.confidence }); });
app.post('/api/v1/agents/execute', requireAuth, requireTenant, requirePermission('execute:agents', 'ai.workspace'), aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => { const { query, sessionId = 'sess_default' } = req.body; if (!query || typeof query !== 'string' || query.trim().length === 0) { res.status(400).json({ error: 'Query parameter is required' }); return; } const result = await runCerefyAIPipeline({ type: 'agent_execute', tenantId: req.tenantId!, userId: (req.user as any)?.uid || 'user_admin_01', metadata: { query, sessionId } }, socketServer); res.status(result.status === 'FAILED' ? 500 : 202).json({ status: result.status === 'FAILED' ? 'error' : 'success', sessionId, executionId: result.executionId, latencyMs: 0, response: result.output ?? { query }, timestamp: new Date().toISOString() }); });

// Memory + analytics endpoints are DB-backed: vector memory context is loaded
// from real document chunks/decisions, executive KPIs and agent performance are
// aggregated from real persisted rows, and graph queries read the real
// Postgres-backed knowledge graph. The former Math.random()/hardcoded stubs now
// only exist in the local dev-fallback branch.
app.post('/api/v1/ai/memory/query', requireAuth, requireTenant, requirePermission('query:run', 'ai.workspace'), async (req: AuthenticatedRequest, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') { res.status(400).json({ error: 'Query parameter is required' }); return; }
  if (isLocalDevFallback()) { res.json({ data: getMemoryResults(query) }); return; }
  try {
    const tenantId = req.tenantId!;
    const context = await loadVectorMemoryContext({ tenantId, limit: 8 });
    const data = [
      ...context.chunkSnippets.map((content, i) => ({ id: `chunk_${i}`, content, source: 'Document Store', score: 0, type: 'vector', metadata: {} })),
      ...context.decisionHistory.slice(0, 3).map((d: any, i) => ({ id: `dec_${i}`, content: d.question ?? d.title ?? '', source: 'Decision History', score: 0, type: 'relational', metadata: { status: d.status } })),
    ];
    res.json({ data });
  } catch (error) {
    logger.error('Memory query failed', { error });
    res.status(500).json({ status: 'error', message: 'Memory query failed' });
  }
});
app.get('/api/v1/memory/documents', requireAuth, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  if (isLocalDevFallback()) { res.json({ data: getMemoryDocuments() }); return; }
  try {
    const data = await analyticsService.getMemoryDocuments(req.tenantId!);
    res.json({ data });
  } catch (error) {
    logger.error('Failed to list memory documents', { error });
    res.status(500).json({ status: 'error', message: 'Failed to list memory documents' });
  }
});
app.get('/api/v1/analytics/executive-kpis', requireAuth, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  if (isLocalDevFallback()) { res.json(getExecutiveKPIs()); return; }
  try {
    const kpis = await analyticsService.getExecutiveKPIs(req.tenantId!);
    res.json(kpis);
  } catch (error: any) {
    logger.error('Failed to compute executive KPIs', { error });
    res.status(Number(error?.status) || 500).json({ status: 'error', message: 'Failed to compute executive KPIs' });
  }
});
app.get('/api/v1/analytics/agent-performance', requireAuth, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  if (isLocalDevFallback()) { res.json({ data: getAgentPerformance() }); return; }
  try {
    const data = await analyticsService.getAgentPerformance(req.tenantId!);
    res.json({ data });
  } catch (error) {
    logger.error('Failed to compute agent performance', { error });
    res.status(500).json({ status: 'error', message: 'Failed to compute agent performance' });
  }
});
app.get('/api/v1/analytics/projects/:projectId', requireAuth, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  if (isLocalDevFallback()) { res.json(getAnalyticsForProject(req.params.projectId)); return; }
  try {
    const data = await analyticsService.getProjectAnalytics(req.tenantId!, req.params.projectId);
    res.json(data);
  } catch (error: any) {
    logger.error('Failed to compute project analytics', { error, projectId: req.params.projectId });
    res.status(Number(error?.status) || 500).json({ status: 'error', message: error?.status ? error.message : 'Failed to compute project analytics' });
  }
});
app.post('/api/v1/ingestion/chunk', requireAuth, requireTenant, async (req: AuthenticatedRequest, res: Response) => { const tenantId = req.tenantId!; const { content, chunkSize = 300, chunkOverlap = 40, title = 'Document' } = req.body; if (!content) { res.status(400).json({ error: 'Content string is required' }); return; } const aiClientInst = getGeminiClient(); if (!aiClientInst) { res.status(500).json({ error: 'AI Client not initialized. Check GEMINI_API_KEY.' }); return; } try { const result = await ingestionService.processDocument(tenantId, title, content, aiClientInst, chunkSize, chunkOverlap); res.json({ status: 'success', title, documentId: result.documentId, chunkCount: result.chunkCount }); } catch (error: any) { logger.error('Ingestion error', { error: error?.message, tenantId }); res.status(500).json({ error: 'Failed to process document' }); } });
// Knowledge graph reads are backed by the real Postgres graph tables (entities +
// links persisted at ingestion time), not by a fabricated cypher stub.
app.post('/api/v1/graph/cypher', requireAuth, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  if (isLocalDevFallback()) {
    const { cypher } = req.body;
    res.json({ status: 'success', query: cypher || 'MATCH (e:Entity) RETURN e LIMIT 10', tenantId: req.tenantId, executedInMs: 8.4, nodesMatched: 6, records: [{ id: 'node_tenant_core', label: 'Cerefy Core Tenant', type: 'Tenant' }, { id: 'node_auth_policy', label: 'OAuth MFA Policy', type: 'Policy' }] });
    return;
  }
  try {
    const { cypher } = req.body ?? {};
    const result = await graphService.queryGraph(req.tenantId!, typeof cypher === 'string' ? cypher : undefined);
    res.json({ status: 'success', ...result });
  } catch (error) {
    logger.error('Graph query failed', { error });
    res.status(500).json({ status: 'error', message: 'Knowledge graph querying failed' });
  }
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => { logger.error('Unhandled error', { error: err.message, stack: err.stack, url: req.url, method: req.method }); res.status(500).json({ error: 'Internal server error', requestId: req.headers['x-request-id'] }); });

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1y', etag: false }));
    app.get('*', (req: Request, res: Response) => { res.sendFile(path.join(distPath, 'index.html')); });
  }

  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'], credentials: true },
  });
  socketServer = io;

  io.use(async (socket, next) => {
    const token = String(socket.handshake.auth?.token || socket.handshake.headers.authorization || '');
    const bearerToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    if (!bearerToken) { next(new Error('Unauthorized')); return; }
    const user = await verifyBearerToken(bearerToken);
    if (!user) { next(new Error('Unauthorized')); return; }
    const tenantId = resolveTenantId(user);
    if (!tenantId) { next(new Error('Forbidden: no tenant membership associated with this account')); return; }
    socket.data.user = user;
    socket.data.tenantId = tenantId;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as any;
    const tenantId = socket.data.tenantId as string;
    socket.join(`tenant:${tenantId}`);
    socket.join(`user:${user?.uid || user?.id || socket.id}`);

    socket.on('join', ({ room }) => { if (typeof room === 'string' && room.trim()) socket.join(room); });
    socket.on('leave', ({ room }) => { if (typeof room === 'string' && room.trim()) socket.leave(room); });
    socket.on('subscribe:execution', ({ executionId }) => { if (typeof executionId === 'string' && executionId.trim()) socket.join(`execution:${executionId}`); });
    socket.on('disconnect', () => { logger.info('[Socket.IO] client disconnected', { id: socket.id }); });
  });

  httpServer.listen(PORT, '0.0.0.0', () => { logger.info(`🚀 Cerefy Enterprise AI running`, { port: PORT, env: process.env.NODE_ENV || 'development', url: `http://0.0.0.0:${PORT}` }); });
}

startServer();
