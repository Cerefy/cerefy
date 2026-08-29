import { z } from "zod";
import { type Tool, invokeLLM } from "../_core/llm";
import { requireDb, writeAuditLog } from "../db";
import { and, eq, isNull } from "drizzle-orm";
import { agents, agentRuns } from "../../drizzle/schema";

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
    await writeAuditLog({
      workspaceId: context.workspaceId,
      actorUserId: context.userId,
      action: "tool.executed",
      resourceType: "tool",
      metadata: { toolName: name, success: result.success, args },
    });
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Tool execution failed";
    return { success: false, error: msg };
  }
}

// ─── Built-in Tools ─────────────────────────────────────────────────────────

// 1. create_ticket
registerTool({
  name: "create_ticket",
  description: "Create a support ticket in the system",
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
    // In production, this would call an internal ticketing API
    return {
      success: true,
      data: {
        ticketId: `TK-${Date.now()}`,
        title: args.title,
        description: args.description,
        priority: args.priority || "medium",
        status: "open",
        createdAt: new Date().toISOString(),
      },
    };
  },
});

// 2. lookup_customer
registerTool({
  name: "lookup_customer",
  description: "Look up customer information by email, name, or ID",
  category: "crm",
  parameters: {
    type: "object",
    properties: {
      email: { type: "string", description: "Customer email" },
      name: { type: "string", description: "Customer name" },
      customerId: { type: "string", description: "Customer ID" },
    },
  },
  handler: async (args, context) => {
    return {
      success: true,
      data: {
        id: args.customerId || `CUST-${Date.now()}`,
        name: args.name || "Unknown Customer",
        email: args.email,
        segment: "enterprise",
        totalOrders: 14,
        totalSpent: 12450.00,
        lastContact: new Date().toISOString(),
      },
    };
  },
});

// 3. check_order
registerTool({
  name: "check_order",
  description: "Check the status of an order",
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
    return {
      success: true,
      data: {
        orderId: args.orderId,
        status: "shipped",
        eta: "2026-09-01",
        total: 149.00,
        currency: "EUR",
        items: [{ name: "Product A", quantity: 1, price: 149.00 }],
        tracking: { carrier: "DHL", trackingNumber: "DHL123456789" },
      },
    };
  },
});

// 4. book_meeting
registerTool({
  name: "book_meeting",
  description: "Book a meeting in the calendar",
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
    return {
      success: true,
      data: {
        meetingId: `MTG-${Date.now()}`,
        title: args.title,
        date: args.date,
        duration: args.duration || 30,
        attendees: args.attendees || [],
        status: "confirmed",
        meetingLink: `https://meet.sopranova.io/${Date.now()}`,
      },
    };
  },
});

// 5. send_email
registerTool({
  name: "send_email",
  description: "Send an email to a recipient",
  category: "external",
  parameters: {
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient email" },
      subject: { type: "string", description: "Email subject" },
      body: { type: "string", description: "Email body (HTML)" },
      cc: { type: "array", items: { type: "string" }, description: "CC recipients" },
    },
    required: ["to", "subject", "body"],
  },
  handler: async (args, context) => {
    return {
      success: true,
      data: {
        messageId: `MSG-${Date.now()}`,
        to: args.to,
        subject: args.subject,
        status: "sent",
        sentAt: new Date().toISOString(),
      },
    };
  },
});

// 6. search_products
registerTool({
  name: "search_products",
  description: "Search products in the catalog",
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
    return {
      success: true,
      data: {
        products: [
          { id: "P001", name: "LG Washing Machine X", price: 599.00, currency: "EUR", category: "Appliances", inStock: true },
          { id: "P002", name: "Samsung Galaxy S26", price: 899.00, currency: "EUR", category: "Electronics", inStock: true },
        ],
        total: 2,
        query: args.query,
      },
    };
  },
});

// 7. get_invoice
registerTool({
  name: "get_invoice",
  description: "Retrieve invoice details",
  category: "erp",
  parameters: {
    type: "object",
    properties: {
      invoiceId: { type: "string", description: "Invoice ID" },
      customerEmail: { type: "string", description: "Customer email" },
    },
  },
  handler: async (args, context) => {
    return {
      success: true,
      data: {
        invoiceId: args.invoiceId || `INV-${Date.now()}`,
        status: "paid",
        total: 149.00,
        currency: "EUR",
        issuedAt: "2026-08-15",
        dueAt: "2026-09-15",
        items: [{ description: "Product A", quantity: 1, unitPrice: 149.00, total: 149.00 }],
        pdfUrl: "https://storage.sopranova.io/invoices/INV-001.pdf",
      },
    };
  },
});

// 8. create_lead
registerTool({
  name: "create_lead",
  description: "Create a new sales lead in CRM",
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
    return {
      success: true,
      data: {
        leadId: `LEAD-${Date.now()}`,
        name: args.name,
        email: args.email,
        company: args.company,
        source: args.source || "chat",
        status: "new",
        createdAt: new Date().toISOString(),
      },
    };
  },
});

// 9. update_crm
registerTool({
  name: "update_crm",
  description: "Update customer record in CRM",
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
    return {
      success: true,
      data: {
        customerId: args.customerId,
        updated: Object.keys(args.fields as object),
        updatedAt: new Date().toISOString(),
      },
    };
  },
});

// 10. web_search
registerTool({
  name: "web_search",
  description: "Search the web for information",
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
    return {
      success: true,
      data: {
        results: [
          { title: "Search Result 1", url: "https://example.com/1", snippet: "Result snippet..." },
        ],
        query: args.query,
      },
    };
  },
});

// 11. execute_sql
registerTool({
  name: "execute_sql",
  description: "Execute a read-only SQL query against the database",
  category: "database",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "SQL query (SELECT only)" },
    },
    required: ["query"],
  },
  handler: async (args, context) => {
    const query = String(args.query || "");
    if (!query.trim().toUpperCase().startsWith("SELECT")) {
      return { success: false, error: "Only SELECT queries are allowed" };
    }
    // In production, execute against the database
    return { success: true, data: { rows: [], rowCount: 0 } };
  },
});

// 12. webhook_call
registerTool({
  name: "webhook_call",
  description: "Call an external webhook/API endpoint",
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
    try {
      const response = await fetch(String(args.url), {
        method: String(args.method || "GET"),
        headers: { "Content-Type": "application/json", ...(args.headers as Record<string, string> || {}) },
        body: args.body ? JSON.stringify(args.body) : undefined,
        signal: AbortSignal.timeout(15000),
      });
      const text = await response.text();
      return {
        success: response.ok,
        data: { status: response.status, body: text.slice(0, 5000) },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Webhook failed" };
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
