import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { authenticateWithPassword, createSession, publicUser, registerWithPassword, requestPasswordReset, resetPassword, revokeSession, SESSION_COOKIE, sessionCookieOptions } from "./auth";
import { bootstrapWorkspace } from "./db";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { agentsRouter } from "./routers/agents";
import { analyticsRouter } from "./routers/analytics";
import { auditRouter, notificationsRouter } from "./routers/notifications";
import { conversationsRouter, intelligenceRouter } from "./routers/conversations";
import { dashboardRouter } from "./routers/dashboard";
import { dataSourcesRouter, documentsRouter, memoryRouter as dataMemoryRouter } from "./routers/data";
import { preferencesRouter, workspacesRouter } from "./routers/workspaces";
import { workflowsRouter } from "./routers/workflows";
import {
  agentEnhancedRouter,
  chatRouter,
  ragRouter,
  observabilityRouter,
  analyticsEnhancedRouter,
  memoryRouter,
  playgroundRouter,
  integrationsRouter,
  securityRouter,
  developerApiRouter,
  rulesRouter,
} from "./routers/enhanced";

const credentialsInput = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(12, "Use at least 12 characters.").max(128),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => (ctx.user ? publicUser(ctx.user) : null)),
    register: publicProcedure.input(credentialsInput.extend({ name: z.string().trim().min(2).max(160), organizationName: z.string().trim().min(2).max(180).optional() })).mutation(async ({ ctx, input }) => {
      try {
        const user = await registerWithPassword(input);
        await bootstrapWorkspace(user, input.organizationName);
        const session = await createSession(user.id);
        ctx.res.cookie(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
        return publicUser(user);
      } catch (error) {
        if (error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED") throw new TRPCError({ code: "CONFLICT", message: "An account already exists for this email." });
        throw error;
      }
    }),
    login: publicProcedure.input(credentialsInput).mutation(async ({ ctx, input }) => {
      const user = await authenticateWithPassword(input.email, input.password);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
      const session = await createSession(user.id);
      ctx.res.cookie(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
      return publicUser(user);
    }),
    requestPasswordReset: publicProcedure.input(z.object({ email: z.string().trim().email().max(320) })).mutation(async ({ input }) => {
      await requestPasswordReset(input.email);
      return { accepted: true } as const;
    }),
    resetPassword: publicProcedure.input(z.object({ token: z.string().min(20).max(200), password: z.string().min(12).max(128) })).mutation(async ({ input }) => {
      try {
        return await resetPassword(input.token, input.password);
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_RESET_TOKEN") throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link is invalid or has expired." });
        throw error;
      }
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const token = ctx.req.headers.cookie?.split(";").map(item => item.trim()).find(item => item.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
      await revokeSession(token);
      ctx.res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
      return { success: true } as const;
    }),
  }),
  workspaces: workspacesRouter,
  preferences: preferencesRouter,
  dashboard: dashboardRouter,
  conversations: conversationsRouter,
  intelligence: intelligenceRouter,
  agents: agentsRouter,
  dataSources: dataSourcesRouter,
  documents: documentsRouter,
  memory: dataMemoryRouter,
  analytics: analyticsRouter,
  workflows: workflowsRouter,
  notifications: notificationsRouter,
  audit: auditRouter,
  // ─── Enhanced SOPRANOVA Routers ───────────────────────────────────────────
  chat: chatRouter,
  rag: ragRouter,
  observability: observabilityRouter,
  analyticsEnhanced: analyticsEnhancedRouter,
  memoryEnhanced: memoryRouter,
  playground: playgroundRouter,
  integrations: integrationsRouter,
  security: securityRouter,
  developerApi: developerApiRouter,
  agentEnhanced: agentEnhancedRouter,
  rules: rulesRouter,
});

export type AppRouter = typeof appRouter;
