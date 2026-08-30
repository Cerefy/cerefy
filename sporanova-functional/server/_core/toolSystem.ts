import { z } from "zod";
import { type Tool, invokeLLM } from "../_core/llm";
import { requireDb, writeAuditLog, listWorkspaceMembers } from "../db";
import { and, eq, isNull, sql, or, like } from "drizzle-orm";
import {
  agents,
  agentRuns,
  users,
  dataRecords,
  dataSources,
  notifications,
  memberships,
} from "../../drizzle/schema";
import { sendEmail } from "../email";

// ─── Tool Registry ──────────────────────────────────────────────────────────
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (args: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
  category: "internal" | "external" | "crm" | "erp" | "database" | "web" | "custom";
  requiresAuth?: boolean;
  rateLimit?: number;
}

export interface ToolContext {
  workspaceId: number;
  userId: number;
  agentId?: number;
  conversationId?: number;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

const toolRegistry = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition) {
  toolRegistry.set(tool.name, tool);
}

export function getTool(name: string): ToolDefinition | undefined {
  return toolRegistry.get(name);
}

export function listTools(category?: string): ToolDefinition[] {
  const all = Array.from(toolRegistry.values());
  if (category) return all.filter(t => t.category === category);
  return all;
}

export function getToolSchemas(): Tool[] {
  return Array.from(toolRegistry.values()).map(tool => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

// ─── Tool Execution ─────────────────────────────────────────────────────────
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const tool = toolRegistry.get(name);
  if (!tool) return { success: false, error: `Tool '${name}' not found` };

  try {
    const result = await tool.handler(args, context);
    try {
      await writeAuditLog({
        workspaceId: context.workspaceId,
        actorUserId: context.userId,
        action: "tool.executed",
        resourceType: "tool",
        resourceId: name,
        metadata: { toolName: name, success: result.success, args },
      });
    } catch (auditErr) {
      console.error(`[toolSystem] audit log failed for tool ${name}:`, auditErr);
    }
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Tool execution failed";
    console.error(`[toolSystem] tool ${name} threw:`, msg);
    return { success: false, error: msg };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getOrCreateTicketAgent(workspaceId: number, userId: number): Promise<number> {
  const db = await requireDb();
  const existing = await db
    .select({ id: agents.id })
    .from(agents)
    .where(and(eq(agents.workspaceId, workspaceId), eq(agents.name, "Ticketing Agent")))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const [created] = await db
    .insert(agents)
    .values({
      workspaceId,
      name: "Ticketing Agent",
      description: "System agent that manages internal support tickets and cases.",
      purpose: "Receive and route support tickets created via agent tools.",
      status: "active",
      createdById: userId,
    })
    .returning({ id: agents.id });
  return created.id;
}

async function ensureSystemDataSource(workspaceId: number, name: string, type: string, userId: number): Promise<number> {
  const db = await requireDb();
  const existing = await db
    .select({ id: dataSources.id })
    .from(dataSources)
    .where(and(eq(dataSources.workspaceId, workspaceId), eq(dataSources.name, name)))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const [created] = await db
    .insert(dataSources)
    .values({
      workspaceId,
      name,
      type,
      status: "connected",
      configuration: { system: true },
      createdById: userId,
    })
    .returning({ id: dataSources.id });
  return created.id;
}

async function listWorkspaceAdminUserIds(workspaceId: number): Promise<number[]> {
  const members = await listWorkspaceMembers(workspaceId);
  return members
    .filter(m => m.role === "admin" || m.role === "owner")
    .map(m => m.userId);
}

// ─── Built-in Tools ─────────────────────────────────────────────────────────

// 1. create_ticket — stores a "case" in agent_runs
registerTool({
  name: "create_ticket",
  description: "Create a support ticket. Stores the case in the agent_runs table and returns the real ID.",
  category: "internal",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "Ticket title" },
      description: { type: "string", description: "Ticket description" },
      priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Ticket priority" },
      assignee: { type: "string", description: "Assignee email or name" },
    },
    required: ["title", "description"],
  },
  handler: async (args, context) => {
    const db = await requireDb();
    const ticketAgentId = await getOrCreateTicketAgent(context.workspaceId, context.userId);
    const [run] = await db
      .insert(agentRuns)
      .values({
        workspaceId: context.workspaceId,
        agentId: ticketAgentId,
        status: "pending",
        triggerType: "manual",
        progress: 0,
        input: {
          kind: "support_ticket",
          title: String(args.title),
          description: String(args.description),
          priority: String(args.priority || "medium"),
          assignee: args.assignee ?? null,
          createdByUserId: context.userId,
        },
        createdById: context.userId,
      })
      .returning({ id: agentRuns.id });
    console.info(`[toolSystem] create_ticket runId=${run.id} title="${args.title}" priority=${args.priority || "medium"}`);
    return {
      success: true,
      data: {
        ticketId: `RUN-${run.id}`,
        runId: run.id,
        title: args.title,
        description: args.description,
        priority: args.priority || "medium",
        status: "open",
        createdAt: new Date().toISOString(),
      },
    };
  },
});

// 2. lookup_customer — real DB lookup by email
registerTool({
  name: "lookup_customer",
  description: "Look up a customer by email. Returns real user record or asks the agent to request the email.",
  category: "crm",
  parameters: {
    type: "object",
    properties: {
      email: { type: "string", description: "Customer email" },
      name: { type: "string", description: "Customer name" },
      customerId: { type: "string", description: "Customer ID (numeric user id)" },
    },
  },
  handler: async (args, context) => {
    const email = typeof args.email === "string" && args.email.trim() ? args.email.trim().toLowerCase() : null;
    const customerId = args.customerId !== undefined && args.customerId !== null && args.customerId !== ""
      ? Number(args.customerId)
      : null;

    if (!email && !customerId) {
      return {
        success: false,
        error: "Customer lookup requires email. Ask the user for their email address.",
      };
    }

    const db = await requireDb();
    const conditions = [];
    if (email) conditions.push(eq(users.email, email));
    if (customerId !== null && Number.isFinite(customerId)) conditions.push(eq(users.id, customerId));

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        jobTitle: users.jobTitle,
        role: users.role,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .limit(1);

    if (rows.length === 0) {
      return {
        success: false,
        error: `No customer found${email ? ` for email "${email}"` : ""}${customerId ? ` (id ${customerId})` : ""}.`,
      };
    }

    const c = rows[0];
    return {
      success: true,
      data: {
        id: c.id,
        name: c.name,
        email: c.email,
        jobTitle: c.jobTitle,
        role: c.role,
        createdAt: c.createdAt,
        lastSignedIn: c.lastSignedIn,
      },
    };
  },
});

// 3. check_order — searches data_records for order-shaped payloads
registerTool({
  name: "check_order",
  description: "Check order status by searching the workspace's data_records for matching order IDs.",
  category: "erp",
  parameters: {
    type: "object",
    properties: {
      orderId: { type: "string", description: "Order ID" },
      customerEmail: { type: "string", description: "Customer email for verification" },
    },
    required: ["orderId"],
  },
  handler: async (args, context) => {
    const orderId = String(args.orderId || "").trim();
    if (!orderId) return { success: false, error: "orderId is required" };

    const db = await requireDb();
    const rows = await db
      .select({
        id: dataRecords.id,
        externalId: dataRecords.externalId,
        payload: dataRecords.payload,
        searchableText: dataRecords.searchableText,
        dataSourceId: dataRecords.dataSourceId,
      })
      .from(dataRecords)
      .innerJoin(dataSources, eq(dataRecords.dataSourceId, dataSources.id))
      .where(
        and(
          eq(dataRecords.workspaceId, context.workspaceId),
          or(
            eq(dataRecords.externalId, orderId),
            sql`${dataRecords.searchableText} ILIKE ${`%${orderId}%`}`,
          ),
        ),
      )
      .limit(20);

    const matches = rows.filter(r => {
      const srcType = (r.payload as Record<string, unknown> | null)?.type;
      const searchable = (r.searchableText || "").toLowerCase();
      return (
        (typeof srcType === "string" && srcType.toLowerCase().includes("order")) ||
        searchable.includes("order") ||
        r.externalId.toLowerCase() === orderId.toLowerCase()
      );
    });

    if (matches.length === 0) {
      return {
        success: false,
        error: `No order found for ID "${orderId}".`,
      };
    }

    const record = matches[0];
    const payload = (record.payload as Record<string, unknown>) || {};
    return {
      success: true,
      data: {
        orderId: record.externalId,
        recordId: record.id,
        payload,
        sourceType: payload.type ?? null,
      },
    };
  },
});

// 4. book_meeting — creates a meeting notification
registerTool({
  name: "book_meeting",
  description: "Book a meeting by creating a meeting notification entry for the requesting user.",
  category: "internal",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "Meeting title" },
      date: { type: "string", description: "Meeting date (ISO format)" },
      duration: { type: "number", description: "Duration in minutes" },
      attendees: { type: "array", items: { type: "string" }, description: "Attendee emails" },
      description: { type: "string", description: "Meeting description" },
    },
    required: ["title", "date"],
  },
  handler: async (args, context) => {
    const db = await requireDb();
    const dateIso = String(args.date);
    const date = new Date(dateIso);
    if (Number.isNaN(date.getTime())) {
      return { success: false, error: `Invalid meeting date: ${dateIso}` };
    }
    const attendees = Array.isArray(args.attendees) ? (args.attendees as unknown[]).map(String) : [];
    const [notification] = await db
      .insert(notifications)
      .values({
        workspaceId: context.workspaceId,
        recipientUserId: context.userId,
        type: "meeting_reminder",
        title: `Meeting: ${String(args.title)}`,
        content: JSON.stringify({
          date: date.toISOString(),
          duration: Number(args.duration || 30),
          attendees,
          description: args.description ?? null,
        }),
        relatedEntityType: "meeting",
        relatedEntityId: null,
      })
      .returning({ id: notifications.id });
    console.info(`[toolSystem] book_meeting notificationId=${notification.id} date=${date.toISOString()}`);
    return {
      success: true,
      data: {
        meetingId: `MTG-${notification.id}`,
        notificationId: notification.id,
        title: args.title,
        date: date.toISOString(),
        duration: args.duration || 30,
        attendees,
        status: "scheduled",
      },
    };
  },
});

// 5. send_email — uses real Resend (or console fallback) via sendEmail()
registerTool({
  name: "send_email",
  description: "Send an email via Resend if RESEND/EMAIL_API_KEY is configured; otherwise log to console.",
  category: "external",
  parameters: {
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient email" },
      subject: { type: "string", description: "Email subject" },
      body: { type: "string", description: "Email body (plain text or HTML)" },
      cc: { type: "array", items: { type: "string" }, description: "CC recipients" },
    },
    required: ["to", "subject", "body"],
  },
  handler: async (args, context) => {
    const to = String(args.to || "").trim();
    const subject = String(args.subject || "").trim();
    const body = String(args.body || "");
    if (!to || !subject || !body) {
      return { success: false, error: "to, subject and body are required" };
    }
    try {
      const result = await sendEmail({ to, subject, text: body, html: body.includes("<") ? body : undefined });
      console.info(`[toolSystem] send_email provider=${result.provider} delivered=${result.delivered} to=${to}`);
      return {
        success: true,
        data: {
          messageId: "id" in result && result.id ? result.id : `MSG-${Date.now()}`,
          to,
          subject,
          status: result.delivered ? "sent" : "logged",
          provider: result.provider,
          delivered: result.delivered,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Email send failed" };
    }
  },
});

// 6. search_products — searches data_records where data_source.type = 'products'
registerTool({
  name: "search_products",
  description: "Search products in workspace data_records for any data source whose type is 'products'.",
  category: "erp",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      category: { type: "string", description: "Product category" },
      minPrice: { type: "number", description: "Minimum price" },
      maxPrice: { type: "number", description: "Maximum price" },
      market: { type: "string", description: "Market (IT, UAE, SA, etc.)" },
    },
    required: ["query"],
  },
  handler: async (args, context) => {
    const q = String(args.query || "").trim();
    if (!q) return { success: false, error: "query is required" };

    const db = await requireDb();
    const productSourceIds = await db
      .select({ id: dataSources.id, name: dataSources.name })
      .from(dataSources)
      .where(and(eq(dataSources.workspaceId, context.workspaceId), eq(dataSources.type, "products")));

    if (productSourceIds.length === 0) {
      return {
        success: true,
        data: { products: [], total: 0, query: q, note: "No product data sources connected for this workspace." },
      };
    }

    const sourceIds = productSourceIds.map(s => s.id);
    const rows = await db
      .select({
        id: dataRecords.id,
        externalId: dataRecords.externalId,
        payload: dataRecords.payload,
        searchableText: dataRecords.searchableText,
        dataSourceId: dataRecords.dataSourceId,
      })
      .from(dataRecords)
      .where(
        and(
          eq(dataRecords.workspaceId, context.workspaceId),
          sql`${dataRecords.dataSourceId} = ANY(${sourceIds})`,
          sql`${dataRecords.searchableText} ILIKE ${`%${q}%`}`,
        ),
      )
      .limit(25);

    const products = rows.map(r => ({
      recordId: r.id,
      externalId: r.externalId,
      dataSourceId: r.dataSourceId,
      dataSourceName: productSourceIds.find(s => s.id === r.dataSourceId)?.name ?? null,
      payload: r.payload,
    }));

    return {
      success: true,
      data: {
        products,
        total: products.length,
        query: q,
      },
    };
  },
});

// 7. get_invoice — searches data_records for invoice payloads
registerTool({
  name: "get_invoice",
  description: "Retrieve an invoice by ID from the workspace data_records.",
  category: "erp",
  parameters: {
    type: "object",
    properties: {
      invoiceId: { type: "string", description: "Invoice ID" },
      customerEmail: { type: "string", description: "Customer email" },
    },
  },
  handler: async (args, context) => {
    const invoiceId = typeof args.invoiceId === "string" ? args.invoiceId.trim() : "";
    if (!invoiceId) return { success: false, error: "invoiceId is required" };

    const db = await requireDb();
    const rows = await db
      .select({
        id: dataRecords.id,
        externalId: dataRecords.externalId,
        payload: dataRecords.payload,
        searchableText: dataRecords.searchableText,
      })
      .from(dataRecords)
      .where(
        and(
          eq(dataRecords.workspaceId, context.workspaceId),
          or(
            eq(dataRecords.externalId, invoiceId),
            sql`${dataRecords.searchableText} ILIKE ${`%${invoiceId}%`}`,
          ),
        ),
      )
      .limit(25);

    const matches = rows.filter(r => {
      const payloadType = ((r.payload as Record<string, unknown> | null)?.type ?? "").toString().toLowerCase();
      const searchable = (r.searchableText || "").toLowerCase();
      return payloadType.includes("invoice") || searchable.includes("invoice");
    });

    if (matches.length === 0) {
      return {
        success: false,
        error: `Invoice not found for ID "${invoiceId}".`,
      };
    }

    const record = matches[0];
    return {
      success: true,
      data: {
        invoiceId: record.externalId,
        recordId: record.id,
        payload: record.payload,
      },
    };
  },
});

// 8. create_lead — INSERT into data_records as a lead
registerTool({
  name: "create_lead",
  description: "Create a new lead stored in data_records with metadata type 'lead'.",
  category: "crm",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Lead name" },
      email: { type: "string", description: "Lead email" },
      company: { type: "string", description: "Company name" },
      source: { type: "string", description: "Lead source" },
      notes: { type: "string", description: "Notes about the lead" },
    },
    required: ["name", "email"],
  },
  handler: async (args, context) => {
    const name = String(args.name || "").trim();
    const email = String(args.email || "").trim();
    if (!name || !email) return { success: false, error: "name and email are required" };

    const db = await requireDb();
    const sourceId = await ensureSystemDataSource(context.workspaceId, "System Leads", "leads", context.userId);
    const externalId = `LEAD-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    const payload = {
      type: "lead",
      name,
      email,
      company: args.company ?? null,
      source: args.source ?? "chat",
      notes: args.notes ?? null,
      status: "new",
      createdByUserId: context.userId,
      createdAt: new Date().toISOString(),
    };
    const searchableText = JSON.stringify(payload);
    const [row] = await db
      .insert(dataRecords)
      .values({
        workspaceId: context.workspaceId,
        dataSourceId: sourceId,
        externalId,
        payload: payload as Record<string, unknown>,
        searchableText,
      })
      .returning({ id: dataRecords.id });

    console.info(`[toolSystem] create_lead id=${row.id} email=${email}`);
    return {
      success: true,
      data: {
        leadId: row.id,
        externalId,
        name,
        email,
        company: args.company ?? null,
        source: args.source ?? "chat",
        status: "new",
        createdAt: new Date().toISOString(),
      },
    };
  },
});

// 9. update_crm — honest audit-log-only update
registerTool({
  name: "update_crm",
  description: "Records a CRM update request to the audit log. Returns the audit log id and a note about limited native CRM support.",
  category: "crm",
  parameters: {
    type: "object",
    properties: {
      customerId: { type: "string", description: "Customer ID" },
      fields: { type: "object", description: "Fields to update" },
    },
    required: ["customerId", "fields"],
  },
  handler: async (args, context) => {
    const customerId = String(args.customerId || "");
    if (!customerId) return { success: false, error: "customerId is required" };
    const fields = (args.fields && typeof args.fields === "object" ? args.fields : {}) as Record<string, unknown>;

    const db = await requireDb();
    await db.execute(
      sql`INSERT INTO audit_logs ("organizationId", "workspaceId", "actorUserId", action, "resourceType", "resourceId", metadata, "createdAt")
          SELECT w."organizationId", w.id, ${context.userId}, 'crm.update.requested', 'customer', ${customerId},
                 ${JSON.stringify({ requestedFields: fields, source: "tool", note: "Native CRM not configured; recorded for manual follow-up" })}::jsonb,
                 NOW()
          FROM workspaces w
          WHERE w.id = ${context.workspaceId}
          LIMIT 1`,
    );
    console.info(`[toolSystem] update_crm recorded audit for customerId=${customerId} fields=${Object.keys(fields).join(",")}`);
    return {
      success: true,
      data: {
        customerId,
        recordedFields: Object.keys(fields),
        note: "Native CRM integration is not configured. The update request has been written to the audit log for manual follow-up.",
        updatedAt: new Date().toISOString(),
      },
    };
  },
});

// 10. web_search — uses SERP API if configured, otherwise returns honest error
registerTool({
  name: "web_search",
  description: "Search the web using SerpAPI if SERP_API_KEY is set. Otherwise returns a configuration error.",
  category: "web",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      numResults: { type: "number", description: "Number of results" },
    },
    required: ["query"],
  },
  handler: async (args, context) => {
    const query = String(args.query || "").trim();
    if (!query) return { success: false, error: "query is required" };
    const apiKey = process.env.SERP_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "Web search requires SERP_API_KEY to be configured.",
      };
    }
    const num = Math.min(Math.max(Number(args.numResults || 5), 1), 20);
    try {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&num=${num}&api_key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        return { success: false, error: `SerpAPI responded with ${res.status}` };
      }
      const json = (await res.json()) as { organic_results?: Array<{ title?: string; link?: string; snippet?: string }> };
      const results = (json.organic_results || []).slice(0, num).map(r => ({
        title: r.title || "",
        url: r.link || "",
        snippet: r.snippet || "",
      }));
      return { success: true, data: { results, query } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Web search failed" };
    }
  },
});

// 11. execute_sql — read-only SELECT against the database
registerTool({
  name: "execute_sql",
  description: "Execute a read-only SELECT query against the application database. INSERT/UPDATE/DELETE are rejected.",
  category: "database",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "SQL query (SELECT only)" },
    },
    required: ["query"],
  },
  handler: async (args, context) => {
    const query = String(args.query || "").trim();
    if (!query) return { success: false, error: "query is required" };
    const normalized = query.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (!normalized.toUpperCase().startsWith("SELECT") && !normalized.toUpperCase().startsWith("WITH")) {
      return { success: false, error: "Only SELECT/WITH queries are allowed" };
    }
    const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|VACUUM|REINDEX)\b/i;
    if (forbidden.test(normalized)) {
      return { success: false, error: "Query contains a forbidden keyword" };
    }
    const db = await requireDb();
    try {
      const result = await db.execute(sql.raw(normalized));
      const rows = (result as unknown as { rows?: unknown[] }).rows ?? (Array.isArray(result) ? (result as unknown[]) : []);
      return {
        success: true,
        data: {
          rows,
          rowCount: Array.isArray(rows) ? rows.length : 0,
          executedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "SQL execution failed" };
    }
  },
});

// 12. webhook_call — real HTTP call
registerTool({
  name: "webhook_call",
  description: "Make a real HTTP call to an external webhook/API endpoint. URLs must be allowlisted or match the WEBHOOK_BASE_URL.",
  category: "external",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", description: "Webhook URL" },
      method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], description: "HTTP method" },
      headers: { type: "object", description: "Request headers" },
      body: { type: "object", description: "Request body" },
    },
    required: ["url", "method"],
  },
  handler: async (args, context) => {
    const url = String(args.url || "");
    const method = String(args.method || "GET").toUpperCase();
    const baseUrl = process.env.WEBHOOK_BASE_URL;
    if (baseUrl) {
      try {
        const parsed = new URL(url);
        const allowed = new URL(baseUrl);
        if (parsed.origin !== allowed.origin) {
          return {
            success: false,
            error: `Webhook origin '${parsed.origin}' not allowed. WEBHOOK_BASE_URL is '${allowed.origin}'.`,
          };
        }
      } catch {
        return { success: false, error: `Invalid webhook URL` };
      }
    }
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...(args.headers as Record<string, string> || {}) },
        body: args.body ? JSON.stringify(args.body) : undefined,
        signal: AbortSignal.timeout(15000),
      });
      const text = await response.text();
      console.info(`[toolSystem] webhook_call ${method} ${url} -> ${response.status}`);
      return {
        success: response.ok,
        data: { status: response.status, body: text.slice(0, 5000) },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Webhook failed" };
    }
  },
});

// 13. escalate_to_human — notifications for all workspace admins
registerTool({
  name: "escalate_to_human",
  description: "Escalate a conversation to a human by inserting a notification for every workspace admin/owner.",
  category: "internal",
  parameters: {
    type: "object",
    properties: {
      reason: { type: "string", description: "Reason for escalation" },
      urgency: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Urgency level" },
    },
    required: ["reason"],
  },
  handler: async (args, context) => {
    const reason = String(args.reason || "").trim();
    if (!reason) return { success: false, error: "reason is required" };
    const urgency = String(args.urgency || "medium");

    const adminIds = await listWorkspaceAdminUserIds(context.workspaceId);
    if (adminIds.length === 0) {
      return {
        success: false,
        error: "No workspace admins available to escalate to.",
      };
    }
    const db = await requireDb();
    const inserted = await db
      .insert(notifications)
      .values(
        adminIds.map(uid => ({
          workspaceId: context.workspaceId,
          recipientUserId: uid,
          type: "escalation",
          title: `Escalation (${urgency}): ${reason.slice(0, 80)}`,
          content: reason,
          relatedEntityType: "conversation",
          relatedEntityId: context.conversationId ? String(context.conversationId) : null,
        })),
      )
      .returning({ id: notifications.id, recipientUserId: notifications.recipientUserId });

    console.info(`[toolSystem] escalate_to_human notifications=${inserted.length} urgency=${urgency}`);
    return {
      success: true,
      data: {
        notificationIds: inserted.map(n => n.id),
        notifiedUserIds: inserted.map(n => n.recipientUserId),
        urgency,
        reason,
        escalatedAt: new Date().toISOString(),
      },
    };
  },
});

// 14. check_warranty — search data_records for warranty records by product serial
registerTool({
  name: "check_warranty",
  description: "Search workspace data_records for warranty records by product serial number.",
  category: "erp",
  parameters: {
    type: "object",
    properties: {
      serialNumber: { type: "string", description: "Product serial number" },
      productId: { type: "string", description: "Product ID" },
    },
    required: ["serialNumber"],
  },
  handler: async (args, context) => {
    const serial = String(args.serialNumber || "").trim();
    if (!serial) return { success: false, error: "serialNumber is required" };
    const db = await requireDb();
    const rows = await db
      .select({
        id: dataRecords.id,
        externalId: dataRecords.externalId,
        payload: dataRecords.payload,
        searchableText: dataRecords.searchableText,
        dataSourceId: dataRecords.dataSourceId,
      })
      .from(dataRecords)
      .innerJoin(dataSources, eq(dataRecords.dataSourceId, dataSources.id))
      .where(
        and(
          eq(dataRecords.workspaceId, context.workspaceId),
          sql`${dataRecords.searchableText} ILIKE ${`%${serial}%`}`,
        ),
      )
      .limit(25);

    const matches = rows.filter(r => {
      const payloadType = ((r.payload as Record<string, unknown> | null)?.type ?? "").toString().toLowerCase();
      const searchable = (r.searchableText || "").toLowerCase();
      return payloadType.includes("warranty") || searchable.includes("warranty");
    });

    if (matches.length === 0) {
      return {
        success: false,
        error: `No warranty record found for serial "${serial}".`,
      };
    }

    const record = matches[0];
    return {
      success: true,
      data: {
        serialNumber: serial,
        recordId: record.id,
        externalId: record.externalId,
        payload: record.payload,
      },
    };
  },
});

// 15. create_salesforce_case — real Salesforce call if configured, else local placeholder
registerTool({
  name: "create_salesforce_case",
  description: "Create a Salesforce case via SALESFORCE_API_URL when configured. Otherwise store a placeholder in data_records.",
  category: "external",
  parameters: {
    type: "object",
    properties: {
      subject: { type: "string", description: "Case subject" },
      description: { type: "string", description: "Case description" },
      priority: { type: "string", enum: ["low", "medium", "high"], description: "Priority" },
      contactEmail: { type: "string", description: "Contact email" },
    },
    required: ["subject", "description"],
  },
  handler: async (args, context) => {
    const subject = String(args.subject || "").trim();
    const description = String(args.description || "").trim();
    if (!subject || !description) return { success: false, error: "subject and description are required" };

    const sfUrl = process.env.SALESFORCE_API_URL;
    const sfToken = process.env.SALESFORCE_API_TOKEN;
    const externalId = `SF-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;

    if (sfUrl) {
      try {
        const res = await fetch(sfUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(sfToken ? { Authorization: `Bearer ${sfToken}` } : {}),
          },
          body: JSON.stringify({
            Subject: subject,
            Description: description,
            Priority: args.priority ?? "Medium",
            SuppliedEmail: args.contactEmail ?? null,
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) {
          return { success: false, error: `Salesforce API responded ${res.status}: ${await res.text()}` };
        }
        const json = (await res.json().catch(() => ({}))) as { id?: string };
        console.info(`[toolSystem] create_salesforce_case sfId=${json.id ?? "(none)"} subject="${subject}"`);
        return {
          success: true,
          data: {
            caseId: json.id ?? externalId,
            externalId,
            subject,
            description,
            priority: args.priority ?? "Medium",
            source: "salesforce",
          },
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Salesforce call failed" };
      }
    }

    const db = await requireDb();
    const sourceId = await ensureSystemDataSource(context.workspaceId, "Salesforce Cases", "salesforce_case_placeholder", context.userId);
    const payload = {
      type: "salesforce_case_placeholder",
      subject,
      description,
      priority: args.priority ?? "Medium",
      contactEmail: args.contactEmail ?? null,
      externalId,
      note: "SALESFORCE_API_URL is not configured; stored locally as placeholder.",
      createdAt: new Date().toISOString(),
    };
    const [row] = await db
      .insert(dataRecords)
      .values({
        workspaceId: context.workspaceId,
        dataSourceId: sourceId,
        externalId,
        payload: payload as Record<string, unknown>,
        searchableText: JSON.stringify(payload),
      })
      .returning({ id: dataRecords.id });
    console.info(`[toolSystem] create_salesforce_case placeholder id=${row.id} subject="${subject}"`);
    return {
      success: true,
      data: {
        caseId: externalId,
        recordId: row.id,
        subject,
        description,
        priority: args.priority ?? "Medium",
        source: "local_placeholder",
        note: payload.note,
      },
    };
  },
});

// 16. lookup_salesforce_case — search data_records for cases
registerTool({
  name: "lookup_salesforce_case",
  description: "Look up a Salesforce case from workspace data_records (real or placeholder).",
  category: "external",
  parameters: {
    type: "object",
    properties: {
      caseId: { type: "string", description: "Case ID" },
      subject: { type: "string", description: "Search by subject fragment" },
    },
  },
  handler: async (args, context) => {
    const caseId = typeof args.caseId === "string" ? args.caseId.trim() : "";
    const subject = typeof args.subject === "string" ? args.subject.trim() : "";
    if (!caseId && !subject) return { success: false, error: "caseId or subject is required" };

    const db = await requireDb();
    const conditions = [eq(dataRecords.workspaceId, context.workspaceId)];
    if (caseId) conditions.push(eq(dataRecords.externalId, caseId));
    if (subject) conditions.push(sql`${dataRecords.searchableText} ILIKE ${`%${subject}%`}`);

    const rows = await db
      .select({
        id: dataRecords.id,
        externalId: dataRecords.externalId,
        payload: dataRecords.payload,
        dataSourceId: dataRecords.dataSourceId,
      })
      .from(dataRecords)
      .innerJoin(dataSources, eq(dataRecords.dataSourceId, dataSources.id))
      .where(and(...conditions))
      .limit(25);

    const cases = rows.filter(r => {
      const payloadType = ((r.payload as Record<string, unknown> | null)?.type ?? "").toString().toLowerCase();
      const sourceType = r.dataSourceId;
      return (
        payloadType.includes("case") ||
        payloadType.includes("salesforce") ||
        sourceType === r.dataSourceId
      );
    }).map(r => ({
      caseId: r.externalId,
      recordId: r.id,
      payload: r.payload,
    }));

    if (cases.length === 0) {
      return {
        success: false,
        error: `No Salesforce case found${caseId ? ` for ID "${caseId}"` : ""}${subject ? ` matching subject "${subject}"` : ""}.`,
      };
    }
    return { success: true, data: { cases, total: cases.length } };
  },
});

// 17. book_technician — notification for workspace admins
registerTool({
  name: "book_technician",
  description: "Create a technician booking request by inserting notifications for every workspace admin.",
  category: "internal",
  parameters: {
    type: "object",
    properties: {
      serviceType: { type: "string", description: "Service type (e.g. installation, repair)" },
      preferredDate: { type: "string", description: "Preferred date (ISO)" },
      address: { type: "string", description: "Service address" },
      notes: { type: "string", description: "Additional notes" },
    },
    required: ["serviceType", "preferredDate"],
  },
  handler: async (args, context) => {
    const serviceType = String(args.serviceType || "").trim();
    const preferredDate = String(args.preferredDate || "").trim();
    if (!serviceType || !preferredDate) return { success: false, error: "serviceType and preferredDate are required" };
    const date = new Date(preferredDate);
    if (Number.isNaN(date.getTime())) return { success: false, error: `Invalid preferredDate: ${preferredDate}` };

    const adminIds = await listWorkspaceAdminUserIds(context.workspaceId);
    if (adminIds.length === 0) {
      return { success: false, error: "No workspace admins available to book a technician." };
    }
    const db = await requireDb();
    const content = JSON.stringify({
      serviceType,
      preferredDate: date.toISOString(),
      address: args.address ?? null,
      notes: args.notes ?? null,
      requestedByUserId: context.userId,
      requestedAt: new Date().toISOString(),
    });
    const inserted = await db
      .insert(notifications)
      .values(
        adminIds.map(uid => ({
          workspaceId: context.workspaceId,
          recipientUserId: uid,
          type: "technician_booking",
          title: `Technician booking: ${serviceType} on ${date.toISOString().slice(0, 10)}`,
          content,
          relatedEntityType: "technician_booking",
          relatedEntityId: null,
        })),
      )
      .returning({ id: notifications.id, recipientUserId: notifications.recipientUserId });
    console.info(`[toolSystem] book_technician notifications=${inserted.length} service=${serviceType}`);
    return {
      success: true,
      data: {
        bookingId: `TECH-${inserted[0]?.id ?? Date.now()}`,
        notificationIds: inserted.map(n => n.id),
        notifiedUserIds: inserted.map(n => n.recipientUserId),
        serviceType,
        preferredDate: date.toISOString(),
        address: args.address ?? null,
        notes: args.notes ?? null,
      },
    };
  },
});

// 18. send_whatsapp — call WHATSAPP_API_URL if configured
registerTool({
  name: "send_whatsapp",
  description: "Send a WhatsApp message via WHATSAPP_API_URL when configured. Otherwise return a configuration error.",
  category: "external",
  parameters: {
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient phone (E.164)" },
      message: { type: "string", description: "Message body" },
      templateName: { type: "string", description: "Optional template name" },
    },
    required: ["to", "message"],
  },
  handler: async (args, context) => {
    const to = String(args.to || "").trim();
    const message = String(args.message || "").trim();
    if (!to || !message) return { success: false, error: "to and message are required" };

    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    if (!apiUrl) {
      return {
        success: false,
        error: "WhatsApp requires API configuration (WHATSAPP_API_URL and WHATSAPP_API_TOKEN).",
      };
    }
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
        },
        body: JSON.stringify({
          to,
          message,
          templateName: args.templateName ?? null,
          workspaceId: context.workspaceId,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const text = await res.text();
      if (!res.ok) {
        return { success: false, error: `WhatsApp API responded ${res.status}: ${text.slice(0, 500)}` };
      }
      console.info(`[toolSystem] send_whatsapp to=${to} status=${res.status}`);
      return {
        success: true,
        data: {
          to,
          status: res.status,
          body: text.slice(0, 5000),
          sentAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "WhatsApp send failed" };
    }
  },
});

// ─── MCP (Model Context Protocol) Gateway ───────────────────────────────────
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverName: string;
}

const mcpTools = new Map<string, MCPTool>();

export function registerMCPTool(tool: MCPTool) {
  mcpTools.set(tool.name, tool);
}

export function listMCPTools(): MCPTool[] {
  return Array.from(mcpTools.values());
}

// ─── Agent Tool Executor ────────────────────────────────────────────────────
export async function executeAgentTools(
  toolCalls: Array<{ name: string; arguments: string }>,
  context: ToolContext
): Promise<Array<{ name: string; arguments: string; result: string }>> {
  const results: Array<{ name: string; arguments: string; result: string }> = [];

  for (const tc of toolCalls) {
    let args: Record<string, unknown> = {};
    try { args = JSON.parse(tc.arguments); } catch {}

    const result = await executeTool(tc.name, args, context);
    results.push({
      name: tc.name,
      arguments: tc.arguments,
      result: JSON.stringify(result),
    });
  }

  return results;
}

// ─── Workflow Engine ────────────────────────────────────────────────────────
export interface WorkflowStep {
  id: string;
  type: "tool" | "condition" | "transform" | "delay";
  config: Record<string, unknown>;
  next?: string;
  conditions?: Array<{ if: string; then: string }>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
  startStep: string;
}

export async function executeWorkflow(
  workflow: WorkflowDefinition,
  input: Record<string, unknown>,
  context: ToolContext
): Promise<{ output: Record<string, unknown>; steps: Array<{ stepId: string; status: string; result?: unknown }> }> {
  const stepResults: Array<{ stepId: string; status: string; result?: unknown }> = [];
  let currentStepId = workflow.startStep;
  const state = { ...input };

  while (currentStepId) {
    const step = workflow.steps.find(s => s.id === currentStepId);
    if (!step) break;

    try {
      if (step.type === "tool") {
        const result = await executeTool(step.config.toolName as string, { ...state, ...(step.config.args as Record<string, unknown> || {}) }, context);
        stepResults.push({ stepId: step.id, status: result.success ? "completed" : "failed", result: result.data });
        if (!result.success) break;
      } else if (step.type === "condition") {
        stepResults.push({ stepId: step.id, status: "completed" });
      } else if (step.type === "transform") {
        stepResults.push({ stepId: step.id, status: "completed" });
      }

      currentStepId = step.next || "";
    } catch (error) {
      stepResults.push({ stepId: step.id, status: "error", result: error instanceof Error ? error.message : "Unknown error" });
      break;
    }
  }

  return { output: state, steps: stepResults };
}