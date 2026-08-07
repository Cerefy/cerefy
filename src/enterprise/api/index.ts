// src/enterprise/api/index.ts
// Enterprise API Gateway — Unified API for all enterprise modules

import { Router } from 'express';
import { authenticate, authorize } from '../identity';
import { supervisorAgent } from '../supervisor';
import { agentRegistry } from '../agent-registry';
import { memoryEngine } from '../memory';
import { knowledgeGraph } from '../knowledge-graph';
import { ragPipeline } from '../rag';
import { decisionModule } from '../decision';
import { workflowEngine } from '../workflow';
import { integrationManager } from '../integrations';
import { securityService, auditService, Permission } from '../security';

export function createEnterpriseRouter(): Router {
  const router = Router();

  // Apply authentication to all enterprise routes
  router.use(authenticate);

  // Agent routes
  router.get('/agents', authorize(Permission.AGENT_READ), (req, res) => {
    const user = (req as any).user;
    const agents = agentRegistry.listAgents(user.tenantId);
    res.json({ success: true, data: agents });
  });

  router.post('/agents', authorize(Permission.AGENT_CREATE), (req, res) => {
    const user = (req as any).user;
    const agent = agentRegistry.registerAgent({
      ...req.body,
      tenantId: user.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res.json({ success: true, data: agent });
  });

  router.post('/agents/:id/execute', authorize(Permission.AGENT_EXECUTE), async (req, res) => {
    const { id } = req.params;
    const { input } = req.body;
    const result = await agentRegistry.executeAgent(id, input);
    res.json({ success: true, data: result });
  });

  // Supervisor routes
  router.post('/supervisor/execute', async (req, res) => {
    const user = (req as any).user;
    const task = {
      id: `task_${Date.now()}`,
      ...req.body,
      tenantId: user.tenantId,
      userId: user.id,
    };
    const result = await supervisorAgent.executeTask(task);
    res.json({ success: true, data: result });
  });

  // Memory routes
  router.post('/memory/search', async (req, res) => {
    const user = (req as any).user;
    const results = await memoryEngine.search({
      tenantId: user.tenantId,
      ...req.body,
    });
    res.json({ success: true, data: results });
  });

  router.post('/memory/store', async (req, res) => {
    const user = (req as any).user;
    const item = await memoryEngine.store({
      ...req.body,
      tenantId: user.tenantId,
      userId: user.id,
    });
    res.json({ success: true, data: item });
  });

  // RAG routes
  router.post('/documents/ingest', async (req, res) => {
    const user = (req as any).user;
    const doc = await ragPipeline.ingest({
      ...req.body,
      tenantId: user.tenantId,
    });
    res.json({ success: true, data: doc });
  });

  router.post('/documents/search', async (req, res) => {
    const user = (req as any).user;
    const results = await ragPipeline.retrieve({
      tenantId: user.tenantId,
      ...req.body,
    });
    res.json({ success: true, data: results });
  });

  // Decision routes
  router.post('/decisions', async (req, res) => {
    const user = (req as any).user;
    const decision = await decisionModule.createDecision({
      ...req.body,
      tenantId: user.tenantId,
    });
    res.json({ success: true, data: decision });
  });

  router.get('/decisions', async (req, res) => {
    const user = (req as any).user;
    const decisions = await decisionModule.listDecisions(user.tenantId);
    res.json({ success: true, data: decisions });
  });

  // Workflow routes
  router.post('/workflows', async (req, res) => {
    const user = (req as any).user;
    const workflow = await workflowEngine.createWorkflow({
      ...req.body,
      tenantId: user.tenantId,
    });
    res.json({ success: true, data: workflow });
  });

  router.post('/workflows/:id/execute', async (req, res) => {
    const { id } = req.params;
    const execution = await workflowEngine.executeWorkflow(id);
    res.json({ success: true, data: execution });
  });

  // Integration routes
  router.get('/integrations', async (req, res) => {
    res.json({ success: true, data: [] });
  });

  router.post('/integrations/:id/sync', async (req, res) => {
    const { id } = req.params;
    const result = await integrationManager.testConnection(id);
    res.json({ success: true, data: { connected: result } });
  });

  // Audit routes
  router.get('/audit', authorize(Permission.AUDIT_READ), (req, res) => {
    const user = (req as any).user;
    const logs = auditService.getLogs(user.tenantId);
    res.json({ success: true, data: logs });
  });

  return router;
}
