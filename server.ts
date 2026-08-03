import './instrumentation';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import * as projectService from './src/lib/projectService';
import * as ingestionService from './src/lib/ingestionService';
import * as decisionService from './src/lib/decisionService';
import { buildAgentOrchestrator } from './src/lib/agentOrchestrator';
import admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { logger, httpLogger } from './src/lib/logger';
import { corsMiddleware, securityHeaders, requestId, requestSizeLimiter } from './src/lib/securityMiddleware';
import { apiRateLimiter, authRateLimiter, aiRateLimiter } from './src/lib/rateLimiter';
import { livenessCheck, readinessCheck, simpleHealthCheck } from './src/lib/healthCheck';

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

let firebaseApp: any | null = null;
function getFirebaseAdmin() {
  if (!firebaseApp) {
    try {
      firebaseApp = admin.initializeApp();
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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
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
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  try {
    const projects = await projectService.getAllProjects(tenantId);
    res.json({ status: 'success', data: projects });
  } catch (error) {
    logger.error('Failed to fetch projects', { error, tenantId });
    res.status(500).json({ status: 'error', message: 'Failed to fetch projects' });
  }
});

app.post('/api/v1/projects', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  try {
    const project = await projectService.createProject(tenantId, req.body);
    res.json({ status: 'success', data: project });
  } catch (error) {
    logger.error('Failed to create project', { error, tenantId });
    res.status(500).json({ status: 'error', message: 'Failed to create project' });
  }
});

// ─── Decision Endpoints ───────────────────────────────────────────────────
app.get('/api/v1/decisions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  try {
    const results = await decisionService.getAllDecisions(tenantId);
    res.json({ status: 'success', data: results });
  } catch (error) {
    logger.error('Failed to fetch decisions', { error, tenantId });
    res.status(500).json({ status: 'error', message: 'Failed to fetch decisions' });
  }
});

app.post('/api/v1/decisions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  try {
    const decision = await decisionService.createDecision(tenantId, req.body);
    res.json({ status: 'success', data: decision });
  } catch (error) {
    logger.error('Failed to create decision', { error, tenantId });
    res.status(500).json({ status: 'error', message: 'Failed to create decision' });
  }
});

// ─── AI Agent Orchestration ───────────────────────────────────────────────
app.post('/api/v1/agents/execute', requireAuth, aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
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
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
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
app.post('/api/v1/graph/cypher', requireAuth, (req: Request, res: Response) => {
  const { cypher, tenantId = 'tenant_acme_101' } = req.body;
  res.json({
    status: 'success',
    query: cypher || 'MATCH (e:Entity) RETURN e LIMIT 10',
    tenantId,
    executedInMs: 8.4,
    nodesMatched: 6,
    records: [
      { id: 'node_tenant_core', label: 'Cerefy Core Tenant', type: 'Tenant' },
      { id: 'node_auth_policy', label: 'OAuth MFA Policy', type: 'Policy' },
    ],
  });
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

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Cerefy Enterprise AI running`, {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      url: `http://0.0.0.0:${PORT}`,
    });
  });
}

startServer();
