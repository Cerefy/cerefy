import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { workspaceProcedure, workspaceMemberProcedure, workspaceManagerProcedure } from "../authz";
import { requireDb, writeAuditLog } from "../db";
import { agents, agentRuns, businessRules, conversations, messages, messageSources, documents, integrations, apiKeys } from "../../drizzle/schema";
import {
  evaluateRules,
  loadRules,
  executeActions,
  writeRulesAuditLog,
  type Condition,
  type Action,
} from "../_core/rulesEngine";
import { chat, getConversationHistory, buildSystemPrompt } from "../_core/conversationEngine";
import { invokeLLM, listLLMModels, routeModel, getModelMetadata } from "../_core/llm";
import { retrieveRelevantChunks } from "../_core/rag";
import { getToolSchemas, executeTool, listTools, type ToolContext } from "../_core/toolSystem";
import { createTrace, addSpan, finishSpan, finishTrace, getTrace, getTracesForWorkspace, calculateTraceMetrics } from "../_core/evaluation";
import { getDashboardMetrics, generateAIInsights, getCostBreakdown, mineConversationPatterns } from "../_core/analytics";
import { storeMemory, recallMemory, searchMemory, storeUserProfile, getUserProfile, storeCompanyKnowledge, getCompanyKnowledge, storeAgentMemory, getAgentMemory, garbageCollectMemories } from "../_core/memory";
import { channelRouter } from "../_core/multichannel";
import {
  createAPIKey,
  validateAPIKey,
  createAgentAPI,
  chatAPI,
  listAgentsAPI,
  generateSDKCode,
  searchMCPMarketplace,
  getMCPToolDetails,
} from "../_core/developerApi";
import { connectIntegration, disconnectIntegration, sendIntegrationMessage } from "../_core/integrations";
import { checkRateLimit, getAuditTrail, exportUserData } from "../_core/security";
import {
  createAPIKey as createDbApiKey,
  listAPIKeys as listDbApiKeys,
  revokeAPIKey as revokeDbApiKey,
} from "../_core/apiKeys";
import { playgroundChat, runEvaluation, type TestCase } from "../_core/evaluation";
import {
  executeWorkflow,
  loadWorkflow,
  validateWorkflowDefinition,
  type WorkflowRunResult,
} from "../_core/workflowEngine";

const workspaceInput = z.object({ workspaceId: z.number().int().positive() });

// ─── Enhanced Agent Router ──────────────────────────────────────────────────
export const agentEnhancedRouter = router({
  list: workspaceProcedure.input(workspaceInput).query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select().from(agents).where(and(eq(agents.workspaceId, ctx.workspaceId), isNull(agents.deletedAt))).orderBy(desc(agents.updatedAt));
  }),

  get: workspaceProcedure.input(workspaceInput.extend({ agentId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const agent = (await db.select().from(agents).where(and(eq(agents.id, input.agentId), eq(agents.workspaceId, ctx.workspaceId), isNull(agents.deletedAt))).limit(1))[0];
    if (!agent) throw new Error("Agent not found");
    return agent;
  }),

  create: workspaceManagerProcedure
    .input(workspaceInput.extend({
      name: z.string().trim().min(2).max(160),
      purpose: z.string().trim().min(4).max(2000),
      description: z.string().trim().max(4000).optional(),
      model: z.string().optional(),
      systemPrompt: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().int().min(100).max(128000).optional(),
      tools: z.array(z.string()).optional(),
      language: z.string().optional(),
      welcomeMessage: z.string().optional(),
      fallbackMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [agent] = await db.insert(agents).values({
        workspaceId: ctx.workspaceId,
        name: input.name,
        purpose: input.purpose,
        description: input.description,
        configuration: {
          model: input.model,
          systemPrompt: input.systemPrompt,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          language: input.language,
          welcomeMessage: input.welcomeMessage,
          fallbackMessage: input.fallbackMessage,
        },
        capabilities: input.tools || [],
        createdById: ctx.user.id,
      }).returning({ id: agents.id });

      await writeAuditLog({ workspaceId: ctx.workspaceId, actorUserId: ctx.user.id, action: "agent.created", resourceType: "agent", resourceId: agent.id });
      return { id: agent.id, name: input.name };
    }),

  update: workspaceManagerProcedure
    .input(workspaceInput.extend({
      agentId: z.number().int().positive(),
      name: z.string().trim().min(2).max(160).optional(),
      purpose: z.string().trim().min(4).max(2000).optional(),
      model: z.string().optional(),
      systemPrompt: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().int().min(100).max(128000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const updateData: Record<string, unknown> = {};
      if (input.name) updateData.name = input.name;
      if (input.purpose) updateData.purpose = input.purpose;
      if (input.model || input.systemPrompt || input.temperature || input.maxTokens) {
        const agent = (await db.select().from(agents).where(eq(agents.id, input.agentId)).limit(1))[0];
        const config = (agent?.configuration || {}) as Record<string, unknown>;
        if (input.model) config.model = input.model;
        if (input.systemPrompt) config.systemPrompt = input.systemPrompt;
        if (input.temperature) config.temperature = input.temperature;
        if (input.maxTokens) config.maxTokens = input.maxTokens;
        updateData.configuration = config;
      }
      await db.update(agents).set(updateData).where(and(eq(agents.id, input.agentId), eq(agents.workspaceId, ctx.workspaceId)));
      await writeAuditLog({ workspaceId: ctx.workspaceId, actorUserId: ctx.user.id, action: "agent.updated", resourceType: "agent", resourceId: input.agentId });
      return { success: true };
    }),

  delete: workspaceManagerProcedure
    .input(workspaceInput.extend({ agentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db.update(agents).set({ deletedAt: new Date() }).where(and(eq(agents.id, input.agentId), eq(agents.workspaceId, ctx.workspaceId)));
      await writeAuditLog({ workspaceId: ctx.workspaceId, actorUserId: ctx.user.id, action: "agent.deleted", resourceType: "agent", resourceId: input.agentId });
      return { success: true };
    }),

  getAvailableTools: workspaceProcedure.query(() => {
    return listTools().map(t => ({ name: t.name, description: t.description, category: t.category }));
  }),
});

// ─── Chat / Conversation Router ─────────────────────────────────────────────
export const chatRouter = router({
  send: workspaceMemberProcedure
    .input(workspaceInput.extend({
      conversationId: z.number().int().positive(),
      message: z.string().trim().min(1).max(4000),
      agentId: z.number().int().positive().optional(),
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await chat({
        workspaceId: ctx.workspaceId,
        conversationId: input.conversationId,
        userId: ctx.user.id,
        message: input.message,
        agentId: input.agentId,
        model: input.model,
        temperature: input.temperature,
      });
      return result;
    }),

  stream: workspaceMemberProcedure
    .input(workspaceInput.extend({
      conversationId: z.number().int().positive(),
      message: z.string().trim().min(1).max(4000),
      agentId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const chunks: string[] = [];
      const result = await chat({
        workspaceId: ctx.workspaceId,
        conversationId: input.conversationId,
        userId: ctx.user.id,
        message: input.message,
        agentId: input.agentId,
        onChunk: (chunk) => chunks.push(chunk),
      });
      return { ...result, fullContent: chunks.join("") };
    }),

  history: workspaceProcedure
    .input(workspaceInput.extend({ conversationId: z.number().int().positive(), limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      return getConversationHistory(input.workspaceId, input.conversationId, input.limit);
    }),

  getContext: workspaceProcedure
    .input(workspaceInput.extend({ query: z.string().trim().min(1) }))
    .query(async ({ input }) => {
      return retrieveRelevantChunks(input.workspaceId, input.query, 5);
    }),
});

// ─── RAG / Knowledge Router ─────────────────────────────────────────────────
export const ragRouter = router({
  search: workspaceProcedure
    .input(workspaceInput.extend({ query: z.string().trim().min(1), limit: z.number().int().min(1).max(20).default(5) }))
    .query(async ({ input }) => {
      return retrieveRelevantChunks(input.workspaceId, input.query, input.limit);
    }),

  getDocuments: workspaceProcedure.input(workspaceInput).query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select().from(documents).where(and(eq(documents.workspaceId, ctx.workspaceId), isNull(documents.deletedAt))).orderBy(desc(documents.createdAt));
  }),
});

// ─── Observability Router ───────────────────────────────────────────────────
export const observabilityRouter = router({
  traces: workspaceProcedure
    .input(workspaceInput.extend({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(({ ctx, input }) => {
      return getTracesForWorkspace(ctx.workspaceId, input.limit);
    }),

  trace: workspaceProcedure
    .input(workspaceInput.extend({ traceId: z.string() }))
    .query(async ({ input }) => {
      return (await getTrace(input.traceId)) || null;
    }),

  metrics: workspaceProcedure
    .input(workspaceInput.extend({ traceId: z.string() }))
    .query(async ({ input }) => {
      const trace = await getTrace(input.traceId);
      if (!trace) return null;
      return calculateTraceMetrics(trace);
    }),
});

// ─── Analytics Router (Enhanced) ────────────────────────────────────────────
export const analyticsEnhancedRouter = router({
  dashboard: workspaceProcedure
    .input(workspaceInput.extend({ period: z.enum(["day", "week", "month"]).default("week") }))
    .query(async ({ ctx, input }) => {
      return getDashboardMetrics(ctx.workspaceId, input.period);
    }),

  insights: workspaceProcedure
    .input(workspaceInput)
    .query(async ({ ctx }) => {
      return generateAIInsights(ctx.workspaceId);
    }),

  costs: workspaceProcedure
    .input(workspaceInput)
    .query(async ({ ctx }) => {
      return getCostBreakdown(ctx.workspaceId);
    }),

  patterns: workspaceProcedure
    .input(workspaceInput)
    .query(async ({ ctx }) => {
      return mineConversationPatterns(ctx.workspaceId);
    }),
});

// ─── Memory Router ──────────────────────────────────────────────────────────
export const memoryRouter = router({
  search: workspaceProcedure
    .input(workspaceInput.extend({ query: z.string().trim().min(1), type: z.enum(["short_term", "conversation", "user", "company", "agent", "long_term"]).optional(), limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return searchMemory(ctx.workspaceId, input.query, { type: input.type, limit: input.limit });
    }),

  getProfile: workspaceProcedure
    .input(workspaceInput.extend({ userId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return getUserProfile(ctx.workspaceId, input.userId);
    }),

  getCompanyKnowledge: workspaceProcedure
    .input(workspaceInput)
    .query(async ({ ctx }) => {
      return getCompanyKnowledge(ctx.workspaceId);
    }),

  garbageCollect: workspaceProcedure
    .input(workspaceInput)
    .mutation(async ({ ctx }) => {
      return garbageCollectMemories(ctx.workspaceId);
    }),
});

// ─── Playground Router ──────────────────────────────────────────────────────
export const playgroundRouter = router({
  chat: workspaceMemberProcedure
    .input(workspaceInput.extend({
      message: z.string().trim().min(1).max(4000),
      agentId: z.number().int().positive().optional(),
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      systemPrompt: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return playgroundChat({
        workspaceId: ctx.workspaceId,
        message: input.message,
        agentId: input.agentId,
        model: input.model,
        temperature: input.temperature,
        systemPrompt: input.systemPrompt,
      });
    }),

  models: workspaceProcedure.query(async () => {
    try {
      const models = await listLLMModels();
      return models.data;
    } catch {
      return [];
    }
  }),

  modelInfo: workspaceProcedure.input(z.object({ modelId: z.string() })).query(({ input }) => {
    return getModelMetadata(input.modelId) || null;
  }),

  routeModel: workspaceProcedure
    .input(z.object({
      capabilities: z.array(z.string()).optional(),
      language: z.string().optional(),
      preferCost: z.enum(["low", "medium", "high"]).optional(),
    }))
    .query(({ input }) => {
      return routeModel(input as any);
    }),

  evaluate: workspaceMemberProcedure
    .input(workspaceInput.extend({
      testCases: z.array(z.object({
        id: z.string(),
        name: z.string(),
        input: z.string(),
        expectedOutput: z.string().optional(),
        tags: z.array(z.string()).default([]),
        category: z.enum(["correctness", "groundedness", "safety", "tool_use", "language"]).default("correctness"),
      })),
      model: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return runEvaluation(ctx.workspaceId, input.testCases as TestCase[], { model: input.model });
    }),
});

// ─── Integrations Router ────────────────────────────────────────────────────
export const integrationsRouter = router({
  connect: workspaceManagerProcedure
    .input(workspaceInput.extend({
      provider: z.string(),
      name: z.string().trim().min(2).max(160),
      credentials: z.record(z.string(), z.string()),
      settings: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return connectIntegration(ctx.workspaceId, ctx.user.id, {
        provider: input.provider as any,
        name: input.name,
        credentials: input.credentials,
        settings: input.settings,
      });
    }),

  disconnect: workspaceManagerProcedure
    .input(workspaceInput.extend({ integrationId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      return disconnectIntegration(ctx.workspaceId, input.integrationId);
    }),

  sendMessage: workspaceMemberProcedure
    .input(workspaceInput.extend({
      integrationId: z.number().int().positive(),
      message: z.string().trim().min(1),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return sendIntegrationMessage(ctx.workspaceId, input.integrationId, input.message, input.metadata);
    }),

  list: workspaceProcedure.input(workspaceInput).query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select().from(integrations)
      .where(eq(integrations.workspaceId, ctx.workspaceId))
      .orderBy(desc(integrations.createdAt));
  }),
});

// ─── Security Router ────────────────────────────────────────────────────────
export const securityRouter = router({
  generateApiKey: workspaceManagerProcedure
    .input(workspaceInput.extend({
      name: z.string().trim().min(2).max(160),
      scopes: z.array(z.string()).optional(),
      expiresInDays: z.number().int().min(1).max(365).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createDbApiKey(
        ctx.workspaceId,
        ctx.user.id,
        input.name,
        (input.scopes || ["*"]) as string[],
        input.expiresInDays,
      );
      await writeAuditLog({ workspaceId: ctx.workspaceId, actorUserId: ctx.user.id, action: "api_key.created", resourceType: "api_key", metadata: { name: input.name } });
      return { key: result.key, keyId: result.id, keyPrefix: result.key.substring(0, 12) };
    }),

  listApiKeys: workspaceProcedure
    .input(workspaceInput)
    .query(async ({ ctx }) => {
      return listDbApiKeys(ctx.workspaceId);
    }),

  revokeApiKey: workspaceManagerProcedure
    .input(workspaceInput.extend({ keyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const success = await revokeDbApiKey(input.keyId, ctx.workspaceId);
      if (success) {
        await writeAuditLog({ workspaceId: ctx.workspaceId, actorUserId: ctx.user.id, action: "api_key.revoked", resourceType: "api_key", resourceId: input.keyId });
      }
      return { success };
    }),

  auditTrail: workspaceProcedure
    .input(workspaceInput.extend({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      return getAuditTrail(ctx.workspaceId, { limit: input.limit });
    }),

  exportData: workspaceProcedure
    .input(workspaceInput)
    .query(async ({ ctx }) => {
      return exportUserData(ctx.workspaceId, ctx.user.id);
    }),
});

// ─── Developer API Router ───────────────────────────────────────────────────
export const developerApiRouter = router({
  createApiKey: workspaceManagerProcedure
    .input(workspaceInput.extend({
      name: z.string().trim().min(2).max(160),
      scopes: z.array(z.string()).optional(),
      expiresInDays: z.number().int().min(1).max(365).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createAPIKey({
        name: input.name,
        workspaceId: ctx.workspaceId,
        userId: ctx.user.id,
        scopes: input.scopes,
        expiresInDays: input.expiresInDays,
      });
    }),

  createAgent: workspaceManagerProcedure
    .input(workspaceInput.extend({
      name: z.string().trim().min(2).max(160),
      purpose: z.string().trim().min(4).max(2000),
      model: z.string().optional(),
      systemPrompt: z.string().optional(),
      tools: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createAgentAPI(ctx.workspaceId, {
        id: "",
        name: input.name,
        purpose: input.purpose,
        model: input.model,
        systemPrompt: input.systemPrompt,
        tools: input.tools,
      });
    }),

  chat: workspaceMemberProcedure
    .input(workspaceInput.extend({
      agentId: z.string(),
      message: z.string().trim().min(1).max(4000),
    }))
    .mutation(async ({ ctx, input }) => {
      return chatAPI(ctx.workspaceId, input.agentId, input.message);
    }),

  listAgents: workspaceProcedure.input(workspaceInput).query(async ({ ctx }) => {
    return listAgentsAPI(ctx.workspaceId);
  }),

  listKeys: workspaceProcedure.input(workspaceInput).query(async ({ ctx }) => {
    const db = await requireDb();
    const results = await db.select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      expiresAt: apiKeys.expiresAt,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    }).from(apiKeys).where(eq(apiKeys.workspaceId, ctx.workspaceId));
    return results;
  }),

  deleteKey: workspaceManagerProcedure
    .input(workspaceInput.extend({ keyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db.delete(apiKeys).where(and(eq(apiKeys.id, input.keyId), eq(apiKeys.workspaceId, ctx.workspaceId)));
      return { success: true };
    }),

  sdk: workspaceProcedure.query(({ ctx }) => {
    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    return generateSDKCode("YOUR_API_KEY", baseUrl);
  }),

  mcpMarketplace: workspaceProcedure.input(z.object({ query: z.string().optional(), category: z.string().optional() })).query(({ input }) => {
    return searchMCPMarketplace(input.query || "", input.category);
  }),

  mcpTool: workspaceProcedure.input(z.object({ name: z.string() })).query(({ input }) => {
    return getMCPToolDetails(input.name) || null;
  }),
});

// ─── Business Rules Router ──────────────────────────────────────────────────
const rulesConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({
      type: z.literal("comparison"),
      field: z.string(),
      operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "contains", "in", "exists"]),
      value: z.unknown().optional(),
    }),
    z.object({ type: z.literal("and"), conditions: z.array(rulesConditionSchema) }),
    z.object({ type: z.literal("or"), conditions: z.array(rulesConditionSchema) }),
    z.object({ type: z.literal("not"), condition: rulesConditionSchema }),
  ]),
);

const rulesActionSchema: z.ZodType<Action> = z.lazy(() =>
  z.union([
    z.object({ type: z.literal("set_field"), field: z.string(), value: z.unknown() }),
    z.object({
      type: z.literal("escalate"),
      reason: z.string(),
      priority: z.enum(["low", "medium", "high", "critical"]),
    }),
    z.object({
      type: z.literal("notify"),
      channel: z.enum(["email", "in_app", "webhook"]),
      template: z.string(),
      recipients: z.array(z.string()).optional(),
    }),
    z.object({
      type: z.literal("create_case"),
      system: z.string(),
      template: z.record(z.string(), z.unknown()),
    }),
    z.object({ type: z.literal("route"), destination: z.string(), agentId: z.number().int().positive().optional() }),
    z.object({ type: z.literal("delay"), duration: z.string() }),
    z.object({
      type: z.literal("end_conversation"),
      status: z.enum(["resolved", "abandoned", "escalated"]),
    }),
    z.object({
      type: z.literal("log"),
      message: z.string(),
      level: z.enum(["info", "warn", "error"]),
    }),
  ]),
);

export const rulesRouter = router({
  list: workspaceProcedure
    .input(workspaceInput.extend({ agentId: z.number().int().positive().optional() }))
    .query(async ({ ctx, input }) => {
      return loadRules(ctx.workspaceId, input.agentId);
    }),

  create: workspaceManagerProcedure
    .input(workspaceInput.extend({
      name: z.string().trim().min(2).max(200),
      description: z.string().trim().max(4000).optional(),
      agentId: z.number().int().positive().optional(),
      priority: z.number().int().min(0).max(10000).default(100),
      enabled: z.boolean().default(true),
      condition: rulesConditionSchema,
      actions: z.array(rulesActionSchema).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [created] = await db.insert(businessRules).values({
        workspaceId: ctx.workspaceId,
        agentId: input.agentId ?? null,
        name: input.name,
        description: input.description ?? null,
        priority: input.priority,
        enabled: input.enabled,
        condition: input.condition as unknown as Record<string, unknown>,
        actions: input.actions as unknown as Record<string, unknown>,
        createdById: ctx.user.id,
      }).returning({ id: businessRules.id });

      await writeRulesAuditLog({
        workspaceId: ctx.workspaceId,
        actorUserId: ctx.user.id,
        action: "business_rule.created",
        resourceId: created.id,
        metadata: { name: input.name, priority: input.priority },
      });
      return { id: created.id, name: input.name };
    }),

  update: workspaceManagerProcedure
    .input(workspaceInput.extend({
      ruleId: z.number().int().positive(),
      name: z.string().trim().min(2).max(200).optional(),
      description: z.string().trim().max(4000).optional(),
      priority: z.number().int().min(0).max(10000).optional(),
      enabled: z.boolean().optional(),
      condition: rulesConditionSchema.optional(),
      actions: z.array(rulesActionSchema).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.enabled !== undefined) updateData.enabled = input.enabled;
      if (input.condition !== undefined) updateData.condition = input.condition as unknown as Record<string, unknown>;
      if (input.actions !== undefined) updateData.actions = input.actions as unknown as Record<string, unknown>;

      const updated = await db.update(businessRules)
        .set(updateData)
        .where(and(eq(businessRules.id, input.ruleId), eq(businessRules.workspaceId, ctx.workspaceId), isNull(businessRules.deletedAt)))
        .returning({ id: businessRules.id });
      if (updated.length === 0) throw new Error("Rule not found");
      await writeRulesAuditLog({
        workspaceId: ctx.workspaceId,
        actorUserId: ctx.user.id,
        action: "business_rule.updated",
        resourceId: input.ruleId,
      });
      return { success: true };
    }),

  delete: workspaceManagerProcedure
    .input(workspaceInput.extend({ ruleId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const updated = await db.update(businessRules)
        .set({ deletedAt: new Date() })
        .where(and(eq(businessRules.id, input.ruleId), eq(businessRules.workspaceId, ctx.workspaceId), isNull(businessRules.deletedAt)))
        .returning({ id: businessRules.id });
      if (updated.length === 0) throw new Error("Rule not found");
      await writeRulesAuditLog({
        workspaceId: ctx.workspaceId,
        actorUserId: ctx.user.id,
        action: "business_rule.deleted",
        resourceId: input.ruleId,
      });
      return { success: true };
    }),

  test: workspaceManagerProcedure
    .input(workspaceInput.extend({
      context: z.record(z.string(), z.unknown()),
      agentId: z.number().int().positive().optional(),
    }))
    .query(async ({ input }) => {
      return evaluateRules(input.workspaceId, input.context, input.agentId);
    }),

  executeActions: workspaceManagerProcedure
    .input(workspaceInput.extend({
      actions: z.array(rulesActionSchema).min(1),
      context: z.record(z.string(), z.unknown()).default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      return executeActions(input.actions, input.context, ctx.workspaceId);
    }),
});

// ─── Workflow Engine Router ──────────────────────────────────────────────────
export const workflowEngineRouter = router({
  run: workspaceMemberProcedure
    .input(workspaceInput.extend({
      workflowId: z.number().int().positive(),
      context: z.record(z.string(), z.unknown()).default({}),
      triggerType: z.enum(["manual", "agent_request", "event", "schedule"]).default("manual"),
    }))
    .mutation(async ({ ctx, input }): Promise<WorkflowRunResult> => {
      return executeWorkflow(
        input.workflowId,
        input.context,
        input.triggerType,
        ctx.user.id,
        ctx.workspaceId,
      );
    }),
  validate: workspaceProcedure
    .input(workspaceInput.extend({ workflowId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const { nodes, edges } = await loadWorkflow(input.workflowId);
      return validateWorkflowDefinition(nodes, edges);
    }),
  load: workspaceProcedure
    .input(workspaceInput.extend({ workflowId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return loadWorkflow(input.workflowId);
    }),
});
