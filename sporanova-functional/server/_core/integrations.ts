import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { integrations } from "../../drizzle/schema";
import { requireDb, writeAuditLog } from "../db";
import { encryptSensitiveData, decryptSensitiveData } from "./security";

// ─── Integration Types ──────────────────────────────────────────────────────
export type IntegrationProvider =
  | "whatsapp" | "slack" | "teams" | "hubspot" | "salesforce"
  | "zendesk" | "intercom" | "shopify" | "google_calendar"
  | "microsoft_calendar" | "zapier" | "webhook" | "rest_api";

export interface IntegrationConfig {
  provider: IntegrationProvider;
  name: string;
  credentials: Record<string, string>;
  settings?: Record<string, unknown>;
  webhookUrl?: string;
  events?: string[];
}

export interface IntegrationResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ─── Integration Registry ───────────────────────────────────────────────────
interface IntegrationHandler {
  connect: (config: IntegrationConfig) => Promise<IntegrationResult>;
  disconnect: (integrationId: number) => Promise<IntegrationResult>;
  sendMessage?: (integrationId: number, message: string, metadata?: Record<string, unknown>) => Promise<IntegrationResult>;
  receiveMessage?: (payload: Record<string, unknown>) => Promise<{ message: string; sender: string; metadata?: Record<string, unknown> }>;
  syncData?: (integrationId: number) => Promise<IntegrationResult>;
}

const handlers = new Map<IntegrationProvider, IntegrationHandler>();

// ─── WhatsApp Business ──────────────────────────────────────────────────────
handlers.set("whatsapp", {
  connect: async (config) => {
    const { phoneNumberId, accessToken, businessAccountId } = config.credentials;
    if (!phoneNumberId || !accessToken) return { success: false, error: "Missing WhatsApp credentials" };
    return { success: true, data: { phoneNumberId, businessAccountId, status: "connected" } };
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (integrationId, message, metadata) => {
    const to = metadata?.to as string;
    if (!to) return { success: false, error: "Missing recipient" };
    // In production, call WhatsApp Business API
    return { success: true, data: { messageId: `wa_${Date.now()}`, status: "sent", to } };
  },
  receiveMessage: async (payload) => ({
    message: String((payload as Record<string, unknown>).text || ""),
    sender: String((payload as Record<string, unknown>).from || ""),
    metadata: { waId: (payload as Record<string, unknown>).waId, timestamp: (payload as Record<string, unknown>).timestamp },
  }),
});

// ─── Slack ──────────────────────────────────────────────────────────────────
handlers.set("slack", {
  connect: async (config) => {
    const { botToken, appId } = config.credentials;
    if (!botToken) return { success: false, error: "Missing Slack bot token" };
    return { success: true, data: { appId, status: "connected" } };
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (integrationId, message, metadata) => {
    const channel = metadata?.channel as string;
    // In production, call Slack API
    return { success: true, data: { ts: Date.now().toString(), channel, status: "sent" } };
  },
  receiveMessage: async (payload) => ({
    message: String((payload as Record<string, unknown>).text || ""),
    sender: String((payload as Record<string, unknown>).user || ""),
    metadata: { channel: (payload as Record<string, unknown>).channel, ts: (payload as Record<string, unknown>).ts },
  }),
});

// ─── Microsoft Teams ────────────────────────────────────────────────────────
handlers.set("teams", {
  connect: async (config) => {
    const { tenantId, clientId, clientSecret } = config.credentials;
    if (!tenantId || !clientId) return { success: false, error: "Missing Teams credentials" };
    return { success: true, data: { tenantId, status: "connected" } };
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (integrationId, message, metadata) => {
    const teamId = metadata?.teamId as string;
    return { success: true, data: { messageId: `teams_${Date.now()}`, status: "sent" } };
  },
});

// ─── HubSpot ────────────────────────────────────────────────────────────────
handlers.set("hubspot", {
  connect: async (config) => {
    const { accessToken } = config.credentials;
    if (!accessToken) return { success: false, error: "Missing HubSpot access token" };
    return { success: true, data: { status: "connected" } };
  },
  disconnect: async () => ({ success: true }),
  syncData: async (integrationId) => {
    // In production, sync contacts, deals, tickets from HubSpot
    return { success: true, data: { contacts: 0, deals: 0, tickets: 0 } };
  },
});

// ─── Salesforce ─────────────────────────────────────────────────────────────
handlers.set("salesforce", {
  connect: async (config) => {
    const { instanceUrl, accessToken } = config.credentials;
    if (!instanceUrl || !accessToken) return { success: false, error: "Missing Salesforce credentials" };
    return { success: true, data: { instanceUrl, status: "connected" } };
  },
  disconnect: async () => ({ success: true }),
  syncData: async (integrationId) => {
    return { success: true, data: { accounts: 0, contacts: 0, opportunities: 0 } };
  },
});

// ─── Shopify ────────────────────────────────────────────────────────────────
handlers.set("shopify", {
  connect: async (config) => {
    const { shopDomain, accessToken } = config.credentials;
    if (!shopDomain || !accessToken) return { success: false, error: "Missing Shopify credentials" };
    return { success: true, data: { shopDomain, status: "connected" } };
  },
  disconnect: async () => ({ success: true }),
  syncData: async (integrationId) => {
    return { success: true, data: { products: 0, orders: 0, customers: 0 } };
  },
});

// ─── Zendesk ────────────────────────────────────────────────────────────────
handlers.set("zendesk", {
  connect: async (config) => {
    const { subdomain, apiToken, email } = config.credentials;
    if (!subdomain || !apiToken) return { success: false, error: "Missing Zendesk credentials" };
    return { success: true, data: { subdomain, status: "connected" } };
  },
  disconnect: async () => ({ success: true }),
});

// ─── Google Calendar ────────────────────────────────────────────────────────
handlers.set("google_calendar", {
  connect: async (config) => {
    const { clientId, clientSecret, refreshToken } = config.credentials;
    if (!clientId || !refreshToken) return { success: false, error: "Missing Google Calendar credentials" };
    return { success: true, data: { status: "connected" } };
  },
  disconnect: async () => ({ success: true }),
});

// ─── Webhook / REST API ─────────────────────────────────────────────────────
handlers.set("webhook", {
  connect: async (config) => {
    const { url } = config.credentials;
    if (!url) return { success: false, error: "Missing webhook URL" };
    // Test the webhook
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "test", timestamp: Date.now() }), signal: AbortSignal.timeout(10000) });
      return { success: response.ok, data: { url, status: response.ok ? "connected" : "failed" } };
    } catch (error) {
      return { success: false, error: "Webhook test failed" };
    }
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (integrationId, message, metadata) => {
    // Would call the configured webhook URL
    return { success: true, data: { status: "delivered" } };
  },
});

// ─── Integration Manager ────────────────────────────────────────────────────
export async function connectIntegration(
  workspaceId: number,
  userId: number,
  config: IntegrationConfig
): Promise<IntegrationResult> {
  const handler = handlers.get(config.provider);
  if (!handler) return { success: false, error: `Unsupported provider: ${config.provider}` };

  const result = await handler.connect(config);
  if (!result.success) return result;

  // Store integration in database
  const db = await requireDb();
  const encryptedCreds = encryptSensitiveData(JSON.stringify(config.credentials), process.env.SESSION_SECRET || "");

  await db.insert(integrations).values({
    workspaceId,
    provider: config.provider,
    name: config.name,
    status: "connected",
    secretReference: encryptedCreds,
    configuration: config.settings || {},
    createdById: userId,
  });

  await writeAuditLog({
    workspaceId,
    actorUserId: userId,
    action: "integration.connected",
    resourceType: "integration",
    metadata: { provider: config.provider, name: config.name },
  });

  return result;
}

export async function disconnectIntegration(
  workspaceId: number,
  integrationId: number
): Promise<IntegrationResult> {
  const db = await requireDb();
  const [integration] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.id, integrationId), eq(integrations.workspaceId, workspaceId)))
    .limit(1);

  if (!integration) return { success: false, error: "Integration not found" };

  const handler = handlers.get(integration.provider as IntegrationProvider);
  if (handler) await handler.disconnect(integrationId);

  await db.update(integrations).set({ status: "disconnected" }).where(eq(integrations.id, integrationId));

  return { success: true };
}

export async function sendIntegrationMessage(
  workspaceId: number,
  integrationId: number,
  message: string,
  metadata?: Record<string, unknown>
): Promise<IntegrationResult> {
  const db = await requireDb();
  const [integration] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.id, integrationId), eq(integrations.workspaceId, workspaceId), eq(integrations.status, "connected")))
    .limit(1);

  if (!integration) return { success: false, error: "Integration not found or not connected" };

  const handler = handlers.get(integration.provider as IntegrationProvider);
  if (!handler?.sendMessage) return { success: false, error: "Provider does not support sending messages" };

  return handler.sendMessage(integrationId, message, metadata);
}

// ─── Regional Integrations ──────────────────────────────────────────────────
export const ITALY_INTEGRATIONS: Array<{ provider: IntegrationProvider; name: string; description: string }> = [
  { provider: "shopify", name: "Shopify Italy", description: "Connect your Shopify store for Italian e-commerce" },
  { provider: "webhook", name: "PEC Email", description: "Italian certified email (Posta Elettronica Certificata)" },
  { provider: "rest_api", name: "Zucchetti", description: "Italian ERP and business management" },
  { provider: "rest_api", name: "TeamSystem", description: "Italian business software suite" },
];

export const GULF_INTEGRATIONS: Array<{ provider: IntegrationProvider; name: string; description: string }> = [
  { provider: "whatsapp", name: "WhatsApp Business Gulf", description: "WhatsApp Business API for Gulf markets" },
  { provider: "shopify", name: "Shopify Gulf", description: "E-commerce for UAE, Saudi, Kuwait" },
  { provider: "rest_api", name: "Noon", description: "Middle East e-commerce marketplace" },
  { provider: "rest_api", name: "Salla", description: "Saudi e-commerce platform" },
  { provider: "rest_api", name: "Zid", description: "Saudi e-commerce platform" },
];
