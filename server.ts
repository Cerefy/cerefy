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
import admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { logger, httpLogger } from './src/lib/logger';
import { corsMiddleware, securityHeaders, requestId, requestSizeLimiter } from './src/lib/securityMiddleware';
import { apiRateLimiter, authRateLimiter, aiRateLimiter } from './src/lib/rateLimiter';
import { livenessCheck, readinessCheck, simpleHealthCheck } from './src/lib/healthCheck';
import { createGitHubBranch, createGitHubPullRequest, getGitHubRepository, updateGitHubFile } from './src/lib/github';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

// ─── Global Middleware ───────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(requestId);
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(requestSizeLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(httpLogger);

// ─── Health & Monitoring Endpoints (no auth, no rate limit) ─────────────────
app.get('/health', simpleHealthCheck);
app.get('/api/health', simpleHealthCheck);
app.get('/health/live', livenessCheck);
app.get('/health/ready', readinessCheck);

// ─── Metrics endpoint ───────────────────────────────────────────────────────
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

// ─── Lazy Singletons ─────────────────────────────────────────────────────────
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
function getFirebaseAdmin() { if (!firebaseApp) { try { firebaseApp = admin.initializeApp(); logger.info('Firebase Admin initialized'); } catch (err) { logger.error('Failed to initialize Firebase Admin', { error: err }); } } return firebaseApp; }
async function verifyBearerToken(token: string): Promise<DevAuthUser | DecodedIdToken | null> { const localUser = getUserFromAccessToken(token); if (localUser) return localUser as any; try { const firebaseAdmin = getFirebaseAdmin(); if (!firebaseAdmin) return null; return await firebaseAdmin.auth().verifyIdToken(token); } catch (error) { logger.warn('Token verification failed', { error: error instanceof Error ? error.message : String(error) }); return null; } }

export interface AuthenticatedRequest extends Request { user?: DecodedIdToken; }
const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => { const authHeader = req.headers.authorization; const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : authHeader; if (!bearerToken) { res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' }); return; } const user = await verifyBearerToken(bearerToken); if (!user) { res.status(403).json({ error: 'Unauthorized: Invalid token' }); return; } req.user = user as any; next(); };

app.use('/api/v1', apiRateLimiter);

app.get('/api/v1/projects', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  try {
    if (isLocalDevFallback()) { res.json({ status: 'success', data: devProjects }); return; }
    const projects = await projectService.getAllProjects(tenantId);
    res.json({ status: 'success', data: projects });
  } catch (error) { logger.error('Failed to fetch projects', { error, tenantId }); res.status(500).json({ status: 'error', message: 'Failed to fetch projects' }); }
});

app.post('/api/v1/projects', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  try { if (isLocalDevFallback()) { res.json({ status: 'success', data: createProject(req.body) }); return; } const project = await projectService.createProject(tenantId, req.body); res.json({ status: 'success', data: project }); } catch (error) { logger.error('Failed to create project', { error, tenantId }); res.status(500).json({ status: 'error', message: 'Failed to create project' }); }
});

app.get('/api/v1/decisions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  try { if (isLocalDevFallback()) { res.json({ status: 'success', data: devDecisions }); return; } const results = await decisionService.getAllDecisions(tenantId); res.json({ status: 'success', data: results }); } catch (error) { logger.error('Failed to fetch decisions', { error, tenantId }); res.status(500).json({ status: 'error', message: 'Failed to fetch decisions' }); }
});

app.post('/api/v1/decisions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  try { if (isLocalDevFallback()) { res.json({ status: 'success', data: createDecision(req.body) }); return; } const decision = await decisionService.createDecision(tenantId, req.body); res.json({ status: 'success', data: decision }); } catch (error) { logger.error('Failed to create decision', { error, tenantId }); res.status(500).json({ status: 'error', message: 'Failed to create decision' }); }
});

app.post('/api/v1/auth/login', authRateLimiter, async (req: Request, res: Response) => { if (!isLocalDevFallback()) { res.status(404).json({ error: 'Not Found' }); return; } const { email, password } = req.body; if (!email || !password) { res.status(400).json({ error: 'Email and password are required' }); return; } const userRecord = devUsersByEmail.get(String(email).toLowerCase()); if (!userRecord || userRecord.password !== password) { res.status(401).json({ error: 'Invalid credentials' }); return; } const tokens = createAuthTokens(userRecord.profile); res.json({ user: userRecord.profile, tokens }); });
app.post('/api/v1/auth/register', authRateLimiter, async (req: Request, res: Response) => { if (!isLocalDevFallback()) { res.status(404).json({ error: 'Not Found' }); return; } const { email, password, firstName, lastName, organizationName } = req.body; if (!email || !password || !firstName || !lastName) { res.status(400).json({ error: 'Email, password, first name and last name are required' }); return; } const normalizedEmail = String(email).toLowerCase(); if (devUsersByEmail.has(normalizedEmail)) { res.status(409).json({ error: 'User already exists' }); return; } const newUser: DevAuthUser = { id: `user_${crypto.randomBytes(6).toString('hex')}`, email: normalizedEmail, firstName, lastName, role: 'member', organizationId: `org_${crypto.randomBytes(6).toString('hex')}`, organizationName: organizationName || 'Cerefy Organization', avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + '+' + lastName)}&background=111827&color=00ffff`, createdAt: new Date().toISOString() }; devUsersByEmail.set(normalizedEmail, { profile: newUser, password }); res.json({ user: newUser, tokens: createAuthTokens(newUser) }); });
app.post('/api/v1/auth/refresh', async (req: Request, res: Response) => { if (!isLocalDevFallback()) { res.status(404).json({ error: 'Not Found' }); return; } const { refreshToken } = req.body; if (!refreshToken) { res.status(400).json({ error: 'Refresh token is required' }); return; } const tokens = rotateRefreshToken(refreshToken); if (!tokens) { res.status(401).json({ error: 'Invalid refresh token' }); return; } res.json(tokens); });
app.post('/api/v1/auth/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => { const authHeader = req.headers.authorization; const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : authHeader; if (bearerToken && devAccessTokens.has(bearerToken)) { devAccessTokens.delete(bearerToken); for (const [refresh, access] of Array.from(devRefreshTokens.entries())) { if (access === bearerToken) devRefreshTokens.delete(refresh); } } res.status(200).json({ status: 'success' }); });
app.get('/api/v1/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => { res.json(safeUserProfile(req.user)); });

app.get('/api/v1/projects/:projectId', requireAuth, async (req: AuthenticatedRequest, res: Response) => { const projectId = req.params.projectId; if (isLocalDevFallback()) { const project = getProjectById(projectId); if (!project) { res.status(404).json({ status: 'error', message: 'Project not found' }); return; } res.json({ status: 'success', data: project }); return; } try { const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101'; const project = await projectService.getProjectById(tenantId, projectId); res.json({ status: 'success', data: project }); } catch (error) { logger.error('Failed to fetch project', { error, projectId }); res.status(500).json({ status: 'error', message: 'Failed to fetch project' }); } });
app.patch('/api/v1/projects/:projectId', requireAuth, async (req: AuthenticatedRequest, res: Response) => { const projectId = req.params.projectId; if (isLocalDevFallback()) { const project = updateProject(projectId, req.body); if (!project) { res.status(404).json({ status: 'error', message: 'Project not found' }); return; } res.json({ status: 'success', data: project }); return; } try { const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101'; const project = await projectService.updateProject(tenantId, projectId, req.body); res.json({ status: 'success', data: project }); } catch (error) { logger.error('Failed to update project', { error, projectId }); res.status(500).json({ status: 'error', message: 'Failed to update project' }); } });
app.delete('/api/v1/projects/:projectId', requireAuth, async (req: AuthenticatedRequest, res: Response) => { const projectId = req.params.projectId; if (isLocalDevFallback()) { if (!deleteProject(projectId)) { res.status(404).json({ status: 'error', message: 'Project not found' }); return; } res.status(204).send(); return; } try { const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101'; await projectService.deleteProject(tenantId, projectId); res.status(204).send(); } catch (error) { logger.error('Failed to delete project', { error, projectId }); res.status(500).json({ status: 'error', message: 'Failed to delete project' }); } });

app.post('/api/v1/decisions/:decisionId/approve', requireAuth, async (req: AuthenticatedRequest, res: Response) => { const decisionId = req.params.decisionId; if (isLocalDevFallback()) { const decision = updateDecision(decisionId, { status: 'APPROVED' }); if (!decision) { res.status(404).json({ status: 'error', message: 'Decision not found' }); return; } res.json({ data: decision }); return; } try { const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101'; const decision = await decisionService.approveDecision(tenantId, decisionId); res.json({ data: decision }); } catch (error) { logger.error('Failed to approve decision', { error, decisionId }); res.status(500).json({ status: 'error', message: 'Failed to approve decision' }); } });
app.post('/api/v1/decisions/:decisionId/reject', requireAuth, async (req: AuthenticatedRequest, res: Response) => { const decisionId = req.params.decisionId; const reason = req.body.reason || 'No reason provided'; if (isLocalDevFallback()) { const decision = updateDecision(decisionId, { status: 'REJECTED', aiRecommendation: `Rejected: ${reason}` }); if (!decision) { res.status(404).json({ status: 'error', message: 'Decision not found' }); return; } res.json({ data: decision }); return; } try { const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101'; const decision = await decisionService.rejectDecision(tenantId, decisionId, reason); res.json({ data: decision }); } catch (error) { logger.error('Failed to reject decision', { error, decisionId }); res.status(500).json({ status: 'error', message: 'Failed to reject decision' }); } });
app.post('/api/v1/decisions/:decisionId/simulate', requireAuth, async (req: AuthenticatedRequest, res: Response) => { const decisionId = req.params.decisionId; if (isLocalDevFallback()) { const decision = updateDecision(decisionId, { status: 'IN_SIMULATION', simulationResult: { expectedRevenue: '$2.3M', estimatedCost: '$310K', riskFactor: 'Medium', timeline: '14 weeks', confidence: 76 } }); if (!decision) { res.status(404).json({ status: 'error', message: 'Decision not found' }); return; } res.json({ data: decision }); return; } try { const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101'; const decision = await decisionService.simulateDecision(tenantId, decisionId); res.json({ data: decision }); } catch (error) { logger.error('Failed to simulate decision', { error, decisionId }); res.status(500).json({ status: 'error', message: 'Failed to simulate decision' }); } });

app.get('/api/v1/agents', requireAuth, async (_req: AuthenticatedRequest, res: Response) => { if (isLocalDevFallback()) { res.json({ data: devAgents }); return; } res.status(501).json({ status: 'error', message: 'Agent listing is not available without backend support' }); });
app.get('/api/v1/agents/:agentId', requireAuth, async (req: AuthenticatedRequest, res: Response) => { const agentId = req.params.agentId; if (isLocalDevFallback()) { const agent = devAgents.find((item) => item.id === agentId); if (!agent) { res.status(404).json({ status: 'error', message: 'Agent not found' }); return; } res.json({ data: agent }); return; } res.status(501).json({ status: 'error', message: 'Agent details are not available without backend support' }); });

app.post('/api/v1/ai/run', requireAuth, aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => { const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101'; const userId = (req.user as any)?.uid || (req.user as any)?.id || 'user_admin_01'; const { type, documentId, projectId, documents = [], requirements = [], decisions = [], metadata = {} } = req.body || {}; if (!type || typeof type !== 'string') { res.status(400).json({ error: 'type is required' }); return; } const result = await runCerefyAIPipeline({ type, tenantId, userId, projectId, documentId, documents, requirements, decisions, metadata: { ...metadata, requestedBy: userId } }, socketServer); res.status(result.status === 'FAILED' ? 500 : 202).json({ executionId: result.executionId, status: result.status, output: result.output, confidence: result.confidence }); });
app.post('/api/v1/ai/pipeline/run', requireAuth, aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => { const { pipelineId } = req.body; if (!pipelineId) { res.status(400).json({ error: 'pipelineId is required' }); return; } const result = await runCerefyAIPipeline({ type: 'pipeline_run', tenantId: (req.headers['x-tenant-id'] as string) || 'tenant_acme_101', userId: (req.user as any)?.uid || 'user_admin_01', metadata: { pipelineId } }, socketServer); res.status(result.status === 'FAILED' ? 500 : 202).json({ executionId: result.executionId, status: result.status, output: result.output, confidence: result.confidence }); });
app.post('/api/v1/agents/execute', requireAuth, aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => { const { query, sessionId = 'sess_default' } = req.body; if (!query || typeof query !== 'string' || query.trim().length === 0) { res.status(400).json({ error: 'Query parameter is required' }); return; } const result = await runCerefyAIPipeline({ type: 'agent_execute', tenantId: (req.headers['x-tenant-id'] as string) || 'tenant_acme_101', userId: (req.user as any)?.uid || 'user_admin_01', metadata: { query, sessionId } }, socketServer); res.status(result.status === 'FAILED' ? 500 : 202).json({ status: result.status === 'FAILED' ? 'error' : 'success', sessionId, executionId: result.executionId, latencyMs: 0, response: result.output ?? { query }, timestamp: new Date().toISOString() }); });

app.get('/api/v1/github/repository', requireAuth, apiRateLimiter, async (req: Request, res: Response) => {
  const repository = String(req.query.repository || '').trim();
  if (!repository) {
    res.status(400).json({ error: 'repository is required' });
    return;
  }

  try {
    const data = await getGitHubRepository(repository);
    res.json({ status: 'success', data });
  } catch (error) {
    logger.error('GitHub repository lookup failed', { error, repository });
    res.status(503).json({ status: 'error', message: error instanceof Error ? error.message : 'GitHub repository lookup failed' });
  }
});

app.post('/api/v1/github/branch', requireAuth, apiRateLimiter, async (req: Request, res: Response) => {
  const { repository, branch, baseBranch } = req.body || {};
  if (!repository || !branch) {
    res.status(400).json({ error: 'repository and branch are required' });
    return;
  }

  try {
    const data = await createGitHubBranch(repository, branch, baseBranch || 'main');
    res.status(201).json({ status: 'success', data });
  } catch (error) {
    logger.error('GitHub branch creation failed', { error, repository, branch, baseBranch });
    res.status(503).json({ status: 'error', message: error instanceof Error ? error.message : 'GitHub branch creation failed' });
  }
});

app.post('/api/v1/github/pull-request', requireAuth, apiRateLimiter, async (req: Request, res: Response) => {
  const { repository, title, head, base, body, draft = true } = req.body || {};
  if (!repository || !title || !head || !base) {
    res.status(400).json({ error: 'repository, title, head, and base are required' });
    return;
  }

  try {
    const data = await createGitHubPullRequest(repository, title, head, base, body, draft);
    res.status(201).json({ status: 'success', data });
  } catch (error) {
    logger.error('GitHub pull request creation failed', { error, repository, title, head, base });
    res.status(503).json({ status: 'error', message: error instanceof Error ? error.message : 'GitHub pull request creation failed' });
  }
});

app.post('/api/v1/github/file', requireAuth, apiRateLimiter, async (req: Request, res: Response) => {
  const { repository, filePath, content, commitMessage, branch, sha } = req.body || {};
  if (!repository || !filePath || !content || !commitMessage) {
    res.status(400).json({ error: 'repository, filePath, content, and commitMessage are required' });
    return;
  }

  try {
    const data = await updateGitHubFile({ repository, filePath, content, commitMessage, branch, sha });
    res.status(201).json({ status: 'success', data });
  } catch (error) {
    logger.error('GitHub file update failed', { error, repository, filePath });
    res.status(503).json({ status: 'error', message: error instanceof Error ? error.message : 'GitHub file update failed' });
  }
});

app.get('/api/v1/memory/query', requireAuth, async (req: Request, res: Response) => { const { query } = req.body; if (!query || typeof query !== 'string') { res.status(400).json({ error: 'Query parameter is required' }); return; } res.json({ data: getMemoryResults(query) }); });
app.get('/api/v1/memory/documents', requireAuth, async (_req: AuthenticatedRequest, res: Response) => { res.json({ data: getMemoryDocuments() }); });
app.get('/api/v1/analytics/executive-kpis', requireAuth, async (_req: AuthenticatedRequest, res: Response) => { res.json(getExecutiveKPIs()); });
app.get('/api/v1/analytics/agent-performance', requireAuth, async (_req: AuthenticatedRequest, res: Response) => { res.json({ data: getAgentPerformance() }); });
app.get('/api/v1/analytics/projects/:projectId', requireAuth, async (req: AuthenticatedRequest, res: Response) => { res.json(getAnalyticsForProject(req.params.projectId)); });
app.post('/api/v1/ingestion/chunk', requireAuth, async (req: AuthenticatedRequest, res: Response) => { const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101'; const { content, chunkSize = 300, chunkOverlap = 40, title = 'Document' } = req.body; if (!content) { res.status(400).json({ error: 'Content string is required' }); return; } const aiClientInst = getGeminiClient(); if (!aiClientInst) { res.status(500).json({ error: 'AI Client not initialized. Check GEMINI_API_KEY.' }); return; } try { const result = await ingestionService.processDocument(tenantId, title, content, aiClientInst, chunkSize, chunkOverlap); res.json({ status: 'success', title, documentId: result.documentId, chunkCount: result.chunkCount }); } catch (error: any) { logger.error('Ingestion error', { error: error?.message, tenantId }); res.status(500).json({ error: 'Failed to process document' }); } });
app.post('/api/v1/graph/cypher', requireAuth, (req: Request, res: Response) => { const { cypher, tenantId = 'tenant_acme_101' } = req.body; res.json({ status: 'success', query: cypher || 'MATCH (e:Entity) RETURN e LIMIT 10', tenantId, executedInMs: 8.4, nodesMatched: 6, records: [{ id: 'node_tenant_core', label: 'Cerefy Core Tenant', type: 'Tenant' }, { id: 'node_auth_policy', label: 'OAuth MFA Policy', type: 'Policy' }] }); });

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
    socket.data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as any;
    const tenantId = user?.tenantId || user?.organizationId || 'tenant_acme_101';
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
