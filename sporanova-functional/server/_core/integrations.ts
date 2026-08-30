import { and, eq } from "drizzle-orm";
import { conversations, integrations, messages } from "../../drizzle/schema";
import { requireDb, writeAuditLog } from "../db";
import { encryptSensitiveData } from "./security";

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
  configured?: boolean;
}

export interface ReceivedMessage {
  message: string;
  sender: string;
  metadata?: Record<string, unknown>;
}

// ─── HTTP Helper ────────────────────────────────────────────────────────────
async function safeFetch(url: string, init: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function notConfigured(provider: string, missing: string[]): IntegrationResult {
  return {
    success: false,
    configured: false,
    error: `${provider} is not configured. Set ${missing.join(", ")} in environment.`,
  };
}

function httpError(provider: string, status: number, body: string): IntegrationResult {
  const snippet = body.length > 200 ? `${body.slice(0, 200)}...` : body;
  return {
    success: false,
    error: `${provider} API responded with ${status}: ${snippet}`,
  };
}

// ─── Provider-Specific Helpers (real API calls) ─────────────────────────────

export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string,
  options?: { previewUrl?: boolean }
): Promise<IntegrationResult> {
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { body: text, preview_url: options?.previewUrl ?? false },
  };
  const res = await safeFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await res.text();
  if (!res.ok) return httpError("WhatsApp", res.status, payload);
  try {
    return { success: true, data: JSON.parse(payload) };
  } catch {
    return { success: true, data: { raw: payload } };
  }
}

export async function sendSlackMessage(
  botToken: string,
  channel: string,
  text: string,
  options?: { blocks?: unknown[]; threadTs?: string }
): Promise<IntegrationResult> {
  const url = "https://slack.com/api/chat.postMessage";
  const body: Record<string, unknown> = { channel, text };
  if (options?.blocks) body.blocks = options.blocks;
  if (options?.threadTs) body.thread_ts = options.threadTs;
  const res = await safeFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });
  const payload = await res.text();
  if (!res.ok) return httpError("Slack", res.status, payload);
  let parsed: { ok?: boolean; error?: string; ts?: string; channel?: string } = {};
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { success: false, error: `Slack returned non-JSON response: ${payload.slice(0, 200)}` };
  }
  if (!parsed.ok) return { success: false, error: `Slack API error: ${parsed.error || "unknown"}` };
  return { success: true, data: { ts: parsed.ts, channel: parsed.channel, status: "sent" } };
}

export async function sendTeamsMessage(
  webhookUrl: string,
  text: string,
  options?: { title?: string; themeColor?: string; sections?: unknown[] }
): Promise<IntegrationResult> {
  const card = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    themeColor: options?.themeColor || "0072C6",
    summary: options?.title || text.slice(0, 80),
    title: options?.title,
    text,
    ...(options?.sections ? { sections: options.sections } : {}),
  };
  const res = await safeFetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });
  const body = await res.text();
  if (!res.ok) return httpError("Teams", res.status, body);
  // Teams connectors return "1" on success
  return { success: true, data: { status: body.trim() === "1" ? "delivered" : "accepted", raw: body } };
}

export async function createHubSpotContact(
  apiKey: string,
  email: string,
  properties: Record<string, string | number | boolean> = {}
): Promise<IntegrationResult> {
  const url = "https://api.hubapi.com/crm/v3/objects/contacts";
  const body = {
    properties: { email, ...properties },
  };
  const res = await safeFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await res.text();
  if (!res.ok) return httpError("HubSpot", res.status, payload);
  try {
    return { success: true, data: JSON.parse(payload) };
  } catch {
    return { success: true, data: { raw: payload } };
  }
}

export async function createSalesforceCase(
  instanceUrl: string,
  accessToken: string,
  caseData: Record<string, string | number | boolean>
): Promise<IntegrationResult> {
  const base = instanceUrl.replace(/\/$/, "");
  const url = `${base}/services/data/v59.0/sobjects/Case`;
  const res = await safeFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(caseData),
  });
  const payload = await res.text();
  if (!res.ok) return httpError("Salesforce", res.status, payload);
  try {
    return { success: true, data: JSON.parse(payload) };
  } catch {
    return { success: true, data: { raw: payload } };
  }
}

export async function createShopifyOrder(
  storeUrl: string,
  accessToken: string,
  orderData: Record<string, unknown>
): Promise<IntegrationResult> {
  const base = storeUrl.replace(/\/$/, "");
  const url = `${base}/admin/api/2024-04/orders.json`;
  const res = await safeFetch(url, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ order: orderData }),
  });
  const payload = await res.text();
  if (!res.ok) return httpError("Shopify", res.status, payload);
  try {
    return { success: true, data: JSON.parse(payload) };
  } catch {
    return { success: true, data: { raw: payload } };
  }
}

export async function createZendeskTicket(
  subdomain: string,
  apiToken: string,
  ticketData: Record<string, unknown>,
  options?: { email?: string }
): Promise<IntegrationResult> {
  const sub = subdomain.replace(/^https?:\/\//, "").replace(/\.zendesk\.com\/?$/, "");
  const url = `https://${sub}.zendesk.com/api/v2/tickets.json`;
  // Zendesk API token auth: username/token, password = apiToken (Basic auth)
  const user = options?.email || `${sub}@token`;
  const auth = Buffer.from(`${user}:${apiToken}`).toString("base64");
  const res = await safeFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ticket: ticketData }),
  });
  const payload = await res.text();
  if (!res.ok) return httpError("Zendesk", res.status, payload);
  try {
    return { success: true, data: JSON.parse(payload) };
  } catch {
    return { success: true, data: { raw: payload } };
  }
}

export async function createGoogleCalendarEvent(
  apiKey: string,
  calendarId: string,
  eventData: Record<string, unknown>
): Promise<IntegrationResult> {
  const cid = encodeURIComponent(calendarId);
  const url = `https://www.googleapis.com/calendar/v3/calendars/${cid}/events?key=${encodeURIComponent(apiKey)}`;
  const res = await safeFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  const payload = await res.text();
  if (!res.ok) return httpError("Google Calendar", res.status, payload);
  try {
    return { success: true, data: JSON.parse(payload) };
  } catch {
    return { success: true, data: { raw: payload } };
  }
}

// ─── Integration Registry ───────────────────────────────────────────────────
interface IntegrationHandler {
  connect: (config: IntegrationConfig) => Promise<IntegrationResult>;
  disconnect: (integrationId: number) => Promise<IntegrationResult>;
  sendMessage?: (integrationId: number, message: string, metadata?: Record<string, unknown>) => Promise<IntegrationResult>;
  receiveMessage?: (payload: Record<string, unknown>) => Promise<ReceivedMessage>;
  syncData?: (integrationId: number) => Promise<IntegrationResult>;
}

const handlers = new Map<IntegrationProvider, IntegrationHandler>();

// ─── WhatsApp Business ──────────────────────────────────────────────────────
handlers.set("whatsapp", {
  connect: async (config) => {
    const phoneNumberId = config.credentials.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = config.credentials.accessToken || process.env.WHATSAPP_API_KEY;
    if (!phoneNumberId || !accessToken) {
      return notConfigured("WhatsApp", ["WHATSAPP_API_KEY", "WHATSAPP_PHONE_NUMBER_ID"]);
    }
    // Verify credentials by fetching phone number info
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}?fields=id,display_phone_number,verified_name`;
    try {
      const res = await safeFetch(url, { method: "GET", headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) {
        const body = await res.text();
        return httpError("WhatsApp", res.status, body);
      }
      const data = JSON.parse(await res.text());
      return {
        success: true,
        configured: true,
        data: { phoneNumberId, verifiedName: data.verified_name, displayPhone: data.display_phone_number, status: "connected" },
      };
    } catch (err) {
      return { success: false, error: `WhatsApp verification failed: ${(err as Error).message}` };
    }
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (_integrationId, message, metadata) => {
    const phoneNumberId = (metadata?.phoneNumberId as string) || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = (metadata?.accessToken as string) || process.env.WHATSAPP_API_KEY;
    const to = metadata?.to as string;
    if (!phoneNumberId || !accessToken) {
      return notConfigured("WhatsApp", ["WHATSAPP_API_KEY", "WHATSAPP_PHONE_NUMBER_ID"]);
    }
    if (!to) return { success: false, error: "Missing recipient phone number (metadata.to)" };
    return sendWhatsAppMessage(phoneNumberId, accessToken, to, message);
  },
  receiveMessage: async (payload) => ({
    message: String(
      (payload as Record<string, unknown>).text ||
      ((payload as Record<string, unknown>).message as string) ||
      ((payload as Record<string, unknown>).body as string) ||
      ""
    ),
    sender: String(
      (payload as Record<string, unknown>).from ||
      ((payload as Record<string, unknown>).sender as string) ||
      ""
    ),
    metadata: {
      waId: (payload as Record<string, unknown>).waId,
      timestamp: (payload as Record<string, unknown>).timestamp,
      profileName: ((payload as Record<string, unknown>).profile as Record<string, unknown> | undefined)?.name,
    },
  }),
});

// ─── Slack ──────────────────────────────────────────────────────────────────
handlers.set("slack", {
  connect: async (config) => {
    const botToken = config.credentials.botToken || process.env.SLACK_BOT_TOKEN;
    if (!botToken) return notConfigured("Slack", ["SLACK_BOT_TOKEN"]);
    try {
      const res = await safeFetch("https://slack.com/api/auth.test", {
        method: "POST",
        headers: { Authorization: `Bearer ${botToken}`, "Content-Type": "application/json" },
        body: "{}",
      });
      const payload = await res.text();
      if (!res.ok) return httpError("Slack", res.status, payload);
      let parsed: { ok?: boolean; error?: string; team?: string; user?: string } = {};
      try { parsed = JSON.parse(payload); } catch { /* ignore */ }
      if (!parsed.ok) return { success: false, error: `Slack auth.test failed: ${parsed.error || payload}` };
      return {
        success: true,
        configured: true,
        data: { team: parsed.team, botUser: parsed.user, status: "connected" },
      };
    } catch (err) {
      return { success: false, error: `Slack verification failed: ${(err as Error).message}` };
    }
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (_integrationId, message, metadata) => {
    const botToken = (metadata?.botToken as string) || process.env.SLACK_BOT_TOKEN;
    const channel = (metadata?.channel as string) || (metadata?.to as string);
    if (!botToken) return notConfigured("Slack", ["SLACK_BOT_TOKEN"]);
    if (!channel) return { success: false, error: "Missing Slack channel (metadata.channel)" };
    return sendSlackMessage(botToken, channel, message, {
      blocks: metadata?.blocks as unknown[] | undefined,
      threadTs: metadata?.threadTs as string | undefined,
    });
  },
  receiveMessage: async (payload) => ({
    message: String((payload as Record<string, unknown>).text || ""),
    sender: String((payload as Record<string, unknown>).user || ""),
    metadata: {
      channel: (payload as Record<string, unknown>).channel,
      ts: (payload as Record<string, unknown>).ts,
      threadTs: (payload as Record<string, unknown>).thread_ts,
    },
  }),
});

// ─── Microsoft Teams ────────────────────────────────────────────────────────
handlers.set("teams", {
  connect: async (config) => {
    const webhookUrl = config.webhookUrl || config.credentials.url || process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) return notConfigured("Teams", ["TEAMS_WEBHOOK_URL"]);
    try {
      const res = await safeFetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Sopranova connection test" }),
      });
      if (!res.ok) {
        const body = await res.text();
        return httpError("Teams", res.status, body);
      }
      return { success: true, configured: true, data: { webhookUrl, status: "connected" } };
    } catch (err) {
      return { success: false, error: `Teams webhook test failed: ${(err as Error).message}` };
    }
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (_integrationId, message, metadata) => {
    const webhookUrl = (metadata?.webhookUrl as string) || process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) return notConfigured("Teams", ["TEAMS_WEBHOOK_URL"]);
    return sendTeamsMessage(webhookUrl, message, {
      title: metadata?.title as string | undefined,
      themeColor: metadata?.themeColor as string | undefined,
      sections: metadata?.sections as unknown[] | undefined,
    });
  },
});

// ─── HubSpot ────────────────────────────────────────────────────────────────
handlers.set("hubspot", {
  connect: async (config) => {
    const apiKey = config.credentials.apiKey || config.credentials.accessToken || process.env.HUBSPOT_API_KEY;
    if (!apiKey) return notConfigured("HubSpot", ["HUBSPOT_API_KEY"]);
    try {
      const res = await safeFetch("https://api.hubapi.com/crm/v3/owners/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        const body = await res.text();
        return httpError("HubSpot", res.status, body);
      }
      const data = JSON.parse(await res.text());
      return {
        success: true,
        configured: true,
        data: { portalId: data.portalId, user: `${data.firstName || ""} ${data.lastName || ""}`.trim(), status: "connected" },
      };
    } catch (err) {
      return { success: false, error: `HubSpot verification failed: ${(err as Error).message}` };
    }
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (_integrationId, message, metadata) => {
    const apiKey = (metadata?.apiKey as string) || process.env.HUBSPOT_API_KEY;
    const email = metadata?.to as string;
    if (!apiKey) return notConfigured("HubSpot", ["HUBSPOT_API_KEY"]);
    if (!email) return { success: false, error: "Missing contact email (metadata.to)" };
    return createHubSpotContact(apiKey, email, {
      message,
      ...((metadata?.properties as Record<string, string | number | boolean>) || {}),
    });
  },
  syncData: async (_integrationId) => {
    const apiKey = process.env.HUBSPOT_API_KEY;
    if (!apiKey) return notConfigured("HubSpot", ["HUBSPOT_API_KEY"]);
    const headers = { Authorization: `Bearer ${apiKey}` };
    const counts = { contacts: 0, deals: 0, tickets: 0 };
    try {
      const [c, d, t] = await Promise.all([
        safeFetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", { method: "GET", headers }).then(r => r.json()).catch(() => ({})),
        safeFetch("https://api.hubapi.com/crm/v3/objects/deals?limit=1", { method: "GET", headers }).then(r => r.json()).catch(() => ({})),
        safeFetch("https://api.hubapi.com/crm/v3/objects/tickets?limit=1", { method: "GET", headers }).then(r => r.json()).catch(() => ({})),
      ]);
      counts.contacts = Number(c?.total ?? 0);
      counts.deals = Number(d?.total ?? 0);
      counts.tickets = Number(t?.total ?? 0);
      return { success: true, data: counts };
    } catch (err) {
      return { success: false, error: `HubSpot sync failed: ${(err as Error).message}` };
    }
  },
});

// ─── Salesforce ─────────────────────────────────────────────────────────────
handlers.set("salesforce", {
  connect: async (config) => {
    const instanceUrl = config.credentials.instanceUrl || process.env.SALESFORCE_INSTANCE_URL;
    const accessToken = config.credentials.accessToken || process.env.SALESFORCE_ACCESS_TOKEN;
    if (!instanceUrl || !accessToken) {
      return notConfigured("Salesforce", ["SALESFORCE_INSTANCE_URL", "SALESFORCE_ACCESS_TOKEN"]);
    }
    try {
      const base = instanceUrl.replace(/\/$/, "");
      const res = await safeFetch(`${base}/services/data/v59.0/limits`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const body = await res.text();
        return httpError("Salesforce", res.status, body);
      }
      return {
        success: true,
        configured: true,
        data: { instanceUrl, status: "connected" },
      };
    } catch (err) {
      return { success: false, error: `Salesforce verification failed: ${(err as Error).message}` };
    }
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (_integrationId, message, metadata) => {
    const instanceUrl = (metadata?.instanceUrl as string) || process.env.SALESFORCE_INSTANCE_URL;
    const accessToken = (metadata?.accessToken as string) || process.env.SALESFORCE_ACCESS_TOKEN;
    if (!instanceUrl || !accessToken) {
      return notConfigured("Salesforce", ["SALESFORCE_INSTANCE_URL", "SALESFORCE_ACCESS_TOKEN"]);
    }
    return createSalesforceCase(instanceUrl, accessToken, {
      Subject: (metadata?.subject as string) || "Sopranova message",
      Description: message,
      ...((metadata?.caseData as Record<string, string | number | boolean>) || {}),
    });
  },
  syncData: async (_integrationId) => {
    const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
    const accessToken = process.env.SALESFORCE_ACCESS_TOKEN;
    if (!instanceUrl || !accessToken) {
      return notConfigured("Salesforce", ["SALESFORCE_INSTANCE_URL", "SALESFORCE_ACCESS_TOKEN"]);
    }
    const base = instanceUrl.replace(/\/$/, "");
    const headers = { Authorization: `Bearer ${accessToken}` };
    const counts = { accounts: 0, contacts: 0, opportunities: 0 };
    try {
      const query = (soql: string) =>
        safeFetch(`${base}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`, { method: "GET", headers })
          .then(r => r.json())
          .catch(() => ({}));
      const [a, c, o] = await Promise.all([
        query("SELECT COUNT() FROM Account"),
        query("SELECT COUNT() FROM Contact"),
        query("SELECT COUNT() FROM Opportunity"),
      ]);
      counts.accounts = Number(a?.totalSize ?? 0);
      counts.contacts = Number(c?.totalSize ?? 0);
      counts.opportunities = Number(o?.totalSize ?? 0);
      return { success: true, data: counts };
    } catch (err) {
      return { success: false, error: `Salesforce sync failed: ${(err as Error).message}` };
    }
  },
});

// ─── Shopify ────────────────────────────────────────────────────────────────
handlers.set("shopify", {
  connect: async (config) => {
    const storeUrl = config.credentials.storeUrl || config.credentials.shopDomain || process.env.SHOPIFY_STORE_URL;
    const accessToken = config.credentials.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;
    if (!storeUrl || !accessToken) {
      return notConfigured("Shopify", ["SHOPIFY_STORE_URL", "SHOPIFY_ACCESS_TOKEN"]);
    }
    const base = storeUrl.replace(/\/$/, "");
    try {
      const res = await safeFetch(`${base}/admin/api/2024-04/shop.json`, {
        method: "GET",
        headers: { "X-Shopify-Access-Token": accessToken },
      });
      if (!res.ok) {
        const body = await res.text();
        return httpError("Shopify", res.status, body);
      }
      const data = JSON.parse(await res.text());
      return {
        success: true,
        configured: true,
        data: { shopName: data.shop?.name, domain: data.shop?.domain, status: "connected" },
      };
    } catch (err) {
      return { success: false, error: `Shopify verification failed: ${(err as Error).message}` };
    }
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (_integrationId, message, metadata) => {
    const storeUrl = (metadata?.storeUrl as string) || process.env.SHOPIFY_STORE_URL;
    const accessToken = (metadata?.accessToken as string) || process.env.SHOPIFY_ACCESS_TOKEN;
    if (!storeUrl || !accessToken) {
      return notConfigured("Shopify", ["SHOPIFY_STORE_URL", "SHOPIFY_ACCESS_TOKEN"]);
    }
    const orderData = (metadata?.orderData as Record<string, unknown>) || { note: message };
    return createShopifyOrder(storeUrl, accessToken, orderData);
  },
  syncData: async (_integrationId) => {
    const storeUrl = process.env.SHOPIFY_STORE_URL;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    if (!storeUrl || !accessToken) {
      return notConfigured("Shopify", ["SHOPIFY_STORE_URL", "SHOPIFY_ACCESS_TOKEN"]);
    }
    const base = storeUrl.replace(/\/$/, "");
    const headers = { "X-Shopify-Access-Token": accessToken };
    const counts = { products: 0, orders: 0, customers: 0 };
    try {
      const fetchCount = async (path: string) => {
        const res = await safeFetch(`${base}/admin/api/2024-04/${path}?limit=1`, { method: "GET", headers });
        if (!res.ok) return 0;
        const data = await res.json();
        return Number(data?.count ?? 0);
      };
      counts.products = await fetchCount("products/count.json");
      counts.orders = await fetchCount("orders/count.json");
      counts.customers = await fetchCount("customers/count.json");
      return { success: true, data: counts };
    } catch (err) {
      return { success: false, error: `Shopify sync failed: ${(err as Error).message}` };
    }
  },
});

// ─── Zendesk ────────────────────────────────────────────────────────────────
handlers.set("zendesk", {
  connect: async (config) => {
    const subdomain = config.credentials.subdomain || process.env.ZENDESK_SUBDOMAIN;
    const apiToken = config.credentials.apiToken || process.env.ZENDESK_API_TOKEN;
    const email = config.credentials.email;
    if (!subdomain || !apiToken) {
      return notConfigured("Zendesk", ["ZENDESK_SUBDOMAIN", "ZENDESK_API_TOKEN"]);
    }
    const sub = subdomain.replace(/^https?:\/\//, "").replace(/\.zendesk\.com\/?$/, "");
    const user = email || `${sub}@token`;
    const auth = Buffer.from(`${user}:${apiToken}`).toString("base64");
    try {
      const res = await safeFetch(`https://${sub}.zendesk.com/api/v2/users/me.json`, {
        method: "GET",
        headers: { Authorization: `Basic ${auth}` },
      });
      if (!res.ok) {
        const body = await res.text();
        return httpError("Zendesk", res.status, body);
      }
      const data = JSON.parse(await res.text());
      return {
        success: true,
        configured: true,
        data: { subdomain: sub, userId: data.user?.id, role: data.user?.role, status: "connected" },
      };
    } catch (err) {
      return { success: false, error: `Zendesk verification failed: ${(err as Error).message}` };
    }
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (_integrationId, message, metadata) => {
    const subdomain = (metadata?.subdomain as string) || process.env.ZENDESK_SUBDOMAIN;
    const apiToken = (metadata?.apiToken as string) || process.env.ZENDESK_API_TOKEN;
    const email = metadata?.email as string | undefined;
    if (!subdomain || !apiToken) {
      return notConfigured("Zendesk", ["ZENDESK_SUBDOMAIN", "ZENDESK_API_TOKEN"]);
    }
    const ticketData = (metadata?.ticketData as Record<string, unknown>) || {
      subject: (metadata?.subject as string) || "Sopranova message",
      comment: { body: message },
    };
    return createZendeskTicket(subdomain, apiToken, ticketData, { email });
  },
});

// ─── Google Calendar ────────────────────────────────────────────────────────
handlers.set("google_calendar", {
  connect: async (config) => {
    const apiKey = config.credentials.apiKey || process.env.GOOGLE_CALENDAR_API_KEY;
    const calendarId = config.credentials.calendarId || "primary";
    if (!apiKey) return notConfigured("Google Calendar", ["GOOGLE_CALENDAR_API_KEY"]);
    try {
      const cid = encodeURIComponent(calendarId);
      const res = await safeFetch(
        `https://www.googleapis.com/calendar/v3/calendars/${cid}?key=${encodeURIComponent(apiKey)}`,
        { method: "GET" }
      );
      if (!res.ok) {
        const body = await res.text();
        return httpError("Google Calendar", res.status, body);
      }
      const data = JSON.parse(await res.text());
      return {
        success: true,
        configured: true,
        data: { calendarId: data.id, summary: data.summary, timeZone: data.timeZone, status: "connected" },
      };
    } catch (err) {
      return { success: false, error: `Google Calendar verification failed: ${(err as Error).message}` };
    }
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (_integrationId, message, metadata) => {
    const apiKey = (metadata?.apiKey as string) || process.env.GOOGLE_CALENDAR_API_KEY;
    const calendarId = (metadata?.calendarId as string) || "primary";
    if (!apiKey) return notConfigured("Google Calendar", ["GOOGLE_CALENDAR_API_KEY"]);
    const eventData = (metadata?.eventData as Record<string, unknown>) || {
      summary: (metadata?.summary as string) || "Sopranova event",
      description: message,
      start: (metadata?.start as Record<string, unknown>) || { dateTime: new Date().toISOString() },
      end: (metadata?.end as Record<string, unknown>) || { dateTime: new Date(Date.now() + 3600000).toISOString() },
    };
    return createGoogleCalendarEvent(apiKey, calendarId, eventData);
  },
});

// ─── Webhook / REST API ─────────────────────────────────────────────────────
handlers.set("webhook", {
  connect: async (config) => {
    const url = config.webhookUrl || config.credentials.url;
    if (!url) return { success: false, error: "Missing webhook URL", configured: false };
    try {
      const response = await safeFetch(
        url,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "test", timestamp: Date.now() }) },
        10000
      );
      return {
        success: response.ok,
        configured: true,
        data: { url, status: response.ok ? "connected" : "failed", httpStatus: response.status },
        error: response.ok ? undefined : `Webhook returned ${response.status}`,
      };
    } catch (err) {
      return { success: false, error: `Webhook test failed: ${(err as Error).message}` };
    }
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (_integrationId, message, metadata) => {
    const url = (metadata?.webhookUrl as string) || (metadata?.url as string);
    if (!url) return { success: false, error: "Missing webhook URL", configured: false };
    try {
      const response = await safeFetch(
        url,
        {
          method: (metadata?.method as string) || "POST",
          headers: {
            "Content-Type": "application/json",
            ...((metadata?.headers as Record<string, string>) || {}),
          },
          body: JSON.stringify({
            event: "message",
            content: message,
            timestamp: Date.now(),
            ...((metadata?.payload as Record<string, unknown>) || {}),
          }),
        },
        15000
      );
      const body = await response.text();
      return {
        success: response.ok,
        data: { status: response.ok ? "delivered" : "failed", httpStatus: response.status, body: body.slice(0, 500) },
        error: response.ok ? undefined : `Webhook returned ${response.status}`,
      };
    } catch (err) {
      return { success: false, error: `Webhook delivery failed: ${(err as Error).message}` };
    }
  },
});

// ─── REST API (generic) ─────────────────────────────────────────────────────
handlers.set("rest_api", {
  connect: async (config) => {
    const url = config.credentials.url || config.webhookUrl;
    if (!url) return { success: false, error: "Missing REST API URL", configured: false };
    return { success: true, configured: true, data: { url, status: "connected" } };
  },
  disconnect: async () => ({ success: true }),
  sendMessage: async (_integrationId, message, metadata) => {
    const url = (metadata?.url as string) || (metadata?.webhookUrl as string);
    if (!url) return { success: false, error: "Missing REST API URL", configured: false };
    try {
      const response = await safeFetch(
        url,
        {
          method: (metadata?.method as string) || "POST",
          headers: {
            "Content-Type": "application/json",
            ...((metadata?.headers as Record<string, string>) || {}),
          },
          body: JSON.stringify({ message, ...((metadata?.payload as Record<string, unknown>) || {}) }),
        },
        15000
      );
      const body = await response.text();
      return {
        success: response.ok,
        data: { httpStatus: response.status, body: body.slice(0, 500) },
        error: response.ok ? undefined : `REST API returned ${response.status}`,
      };
    } catch (err) {
      return { success: false, error: `REST API call failed: ${(err as Error).message}` };
    }
  },
});

// ─── Stub handlers for providers without full impls ─────────────────────────
const stubOnly: IntegrationProvider[] = ["intercom", "microsoft_calendar", "zapier"];
for (const p of stubOnly) {
  handlers.set(p, {
    connect: async () => ({
      success: false,
      configured: false,
      error: `${p} integration is not yet implemented in this build.`,
    }),
    disconnect: async () => ({ success: true }),
  });
}

// ─── Integration Manager ────────────────────────────────────────────────────
export async function connectIntegration(
  workspaceId: number,
  userId: number,
  config: IntegrationConfig
): Promise<IntegrationResult> {
  const handler = handlers.get(config.provider);
  if (!handler) return { success: false, error: `Unsupported provider: ${config.provider}`, configured: false };

  const result = await handler.connect(config);
  if (!result.success) {
    await writeAuditLog({
      workspaceId,
      actorUserId: userId,
      action: "integration.connect_failed",
      resourceType: "integration",
      metadata: { provider: config.provider, name: config.name, error: result.error },
    });
    return result;
  }

  // Store integration in database (encrypted credentials)
  const db = await requireDb();
  const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET || "fallback-dev-secret";
  const encryptedCreds = encryptSensitiveData(JSON.stringify(config.credentials), sessionSecret);

  await db.insert(integrations).values({
    workspaceId,
    provider: config.provider,
    name: config.name,
    status: "connected",
    secretReference: encryptedCreds,
    configuration: { ...(config.settings || {}), webhookUrl: config.webhookUrl },
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
  if (handler) {
    try { await handler.disconnect(integrationId); } catch { /* non-fatal */ }
  }

  // Actually delete the record per task spec
  await db.delete(integrations).where(eq(integrations.id, integrationId));

  await writeAuditLog({
    workspaceId,
    actorUserId: null,
    action: "integration.disconnected",
    resourceType: "integration",
    resourceId: String(integrationId),
    metadata: { provider: integration.provider, name: integration.name },
  });

  return { success: true, data: { id: integrationId, deleted: true } };
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

  // Merge configuration-level webhook URL if not provided in metadata
  const cfg = (integration.configuration || {}) as Record<string, unknown>;
  const mergedMetadata: Record<string, unknown> = { ...cfg, ...(metadata || {}) };

  return handler.sendMessage(integrationId, message, mergedMetadata);
}

// ─── Incoming webhook receiver ──────────────────────────────────────────────
export async function receiveMessage(
  provider: IntegrationProvider,
  payload: Record<string, unknown>,
  options?: { workspaceId?: number; integrationId?: number }
): Promise<{ success: boolean; conversationId?: number; messageId?: number; error?: string }> {
  const handler = handlers.get(provider);
  if (!handler?.receiveMessage) {
    return { success: false, error: `Provider ${provider} does not support receiving messages` };
  }
  const received = await handler.receiveMessage(payload);
  if (!received.message) {
    return { success: false, error: "Empty message in webhook payload" };
  }

  const db = await requireDb();
  const workspaceId = options?.workspaceId;
  if (!workspaceId) {
    return { success: false, error: "workspaceId is required to route incoming webhook" };
  }

  const [conv] = await db
    .insert(conversations)
    .values({
      workspaceId,
      title: `${provider} conversation`,
      createdById: 0, // system actor; FK constraint may require adjustment per deployment
    })
    .returning({ id: conversations.id })
    .catch(async () => {
      // Fall back: pick the most recent conversation in the workspace if FK fails
      const existing = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.workspaceId, workspaceId))
        .orderBy(conversations.lastMessageAt)
        .limit(1);
      return existing.length ? existing : [{ id: 0 }];
    });

  if (!conv || conv.id === 0) {
    return { success: false, error: "Could not create or locate a conversation for this workspace" };
  }

  const [msg] = await db
    .insert(messages)
    .values({
      workspaceId,
      conversationId: conv.id,
      authorUserId: null,
      role: "user",
      kind: "question",
      content: received.message,
      metadata: {
        provider,
        sender: received.sender,
        integrationId: options?.integrationId,
        ...(received.metadata || {}),
      },
    })
    .returning({ id: messages.id });

  await db.update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conv.id));

  await writeAuditLog({
    workspaceId,
    actorUserId: null,
    action: "integration.message_received",
    resourceType: "conversation",
    resourceId: String(conv.id),
    metadata: { provider, sender: received.sender, messageId: msg?.id },
  });

  return { success: true, conversationId: conv.id, messageId: msg?.id };
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