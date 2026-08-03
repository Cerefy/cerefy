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

dotenv.config();

const app = express();
const PORT = 3002; // changed to avoid conflict

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
    }
  }
  return aiClient;
}

// Lazy initialize Firebase Admin
let firebaseApp: any | null = null;
function getFirebaseAdmin() {
  if (!firebaseApp) {
    try {
      firebaseApp = admin.initializeApp();
      console.log('Firebase Admin initialized');
    } catch (err) {
      console.error('Failed to initialize Firebase Admin:', err);
    }
  }
  return firebaseApp;
}

// ------------------------------------------------------------------
// API Gateway & Middleware
// ------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    firebaseConfigured: !!getFirebaseAdmin(),
    timestamp: new Date().toISOString(),
  });
});

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
    if (!firebaseAdmin) {
      throw new Error('Firebase Admin not initialized');
    }
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth verification failed:', error);
    res.status(403).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};

// Project Endpoints
app.get('/api/v1/projects', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  try {
    const projects = await projectService.getAllProjects(tenantId);
    res.json({ status: 'success', data: projects });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch projects' });
  }
});

app.post('/api/v1/projects', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  try {
    const project = await projectService.createProject(tenantId, req.body);
    res.json({ status: 'success', data: project });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to create project' });
  }
});

// Decision Endpoints
app.get('/api/v1/decisions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  try {
    const results = await decisionService.getAllDecisions(tenantId);
    res.json({ status: 'success', data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch decisions' });
  }
});

app.post('/api/v1/decisions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  try {
    const decision = await decisionService.createDecision(tenantId, req.body);
    res.json({ status: 'success', data: decision });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to create decision' });
  }
});

// Multi-Agent Orchestrator Execution Endpoint
app.post('/api/v1/agents/execute', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
    
    // Invoke the stateful LangGraph
    const finalState = await orchestrator.invoke({
      tenantId,
      query,
      plan: [],
      retrievedContext: '',
      reasoningOutput: '',
      reflectionCritique: '',
      status: 'started'
    });

    const durationMs = Date.now() - startTime;

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
      tokensUsed: 250, // placeholder metric
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Agent Execution Error:', error);
    res.status(500).json({
      status: 'error',
      message: error?.message || 'Agent execution failed',
      tenantId,
    });
  }
});

// Document Chunking API Endpoint
app.post('/api/v1/ingestion/chunk', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_acme_101';
  const { content, chunkSize = 300, chunkOverlap = 40, title = 'Document' } = req.body;

  if (!content) {
    res.status(400).json({ error: 'Content string is required' });
    return;
  }

  const aiClient = getGeminiClient();
  if (!aiClient) {
    res.status(500).json({ error: 'AI Client not initialized. Check GEMINI_API_KEY.' });
    return;
  }

  try {
    const result = await ingestionService.processDocument(
      tenantId,
      title,
      content,
      aiClient,
      chunkSize,
      chunkOverlap
    );

    res.json({
      status: 'success',
      title,
      documentId: result.documentId,
      chunkCount: result.chunkCount,
    });
  } catch (error: any) {
    console.error('Ingestion error:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// Cypher Graph Sandbox API
app.post('/api/v1/graph/cypher', (req, res) => {
  const { cypher, tenantId = 'tenant_acme_101' } = req.body;
  res.json({
    status: 'success',
    query: cypher || 'MATCH (e:Entity) RETURN e LIMIT 10',
    tenantId,
    executedInMs: 8.4,
    nodesMatched: 6,
    relationshipsMatched: 5,
    records: [
      { id: 'node_tenant_core', label: 'Acme Core Tenant', type: 'Tenant' },
      { id: 'node_auth_policy', label: 'OAuth MFA Policy', type: 'Policy' },
      { id: 'node_soc2_report', label: 'SOC2 Security Audit 2026', type: 'Document' },
    ],
  });
});

// Start Express Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
