import { and, eq } from "drizzle-orm";
import { integrations } from "../../drizzle/schema";
import { requireDb, writeAuditLog } from "../db";
import { type Tool, invokeLLM } from "./llm";
import { chat, type ChatRequest, type ChatResponse } from "./conversationEngine";
import { executeAgentTools, getToolSchemas } from "./toolSystem";
import { sendIntegrationMessage } from "./integrations";

// ─── Channel Types ──────────────────────────────────────────────────────────
export type ChannelType = "web" | "whatsapp" | "slack" | "email" | "teams" | "voice" | "api" | "instagram" | "telegram";

export interface ChannelMessage {
  channel: ChannelType;
  senderId: string;
  senderName?: string;
  content: string;
  attachments?: Array<{ type: string; url: string; name: string }>;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface ChannelResponse {
  channel: ChannelType;
  content: string;
  widgets?: Widget[];
  metadata?: Record<string, unknown>;
}

// ─── Rich UI Widgets ────────────────────────────────────────────────────────
export type WidgetType = "card" | "table" | "form" | "chart" | "product" | "booking" | "invoice" | "approval" | "list" | "action_buttons";

export interface Widget {
  type: WidgetType;
  title?: string;
  data: Record<string, unknown>;
  actions?: WidgetAction[];
}

export interface WidgetAction {
  label: string;
  action: string;
  style?: "primary" | "secondary" | "danger";
  payload?: Record<string, unknown>;
}

// ─── Pre-built Widget Templates ─────────────────────────────────────────────
export function createOrderWidget(order: {
  orderId: string;
  status: string;
  eta: string;
  total: number;
  currency: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}): Widget {
  return {
    type: "card",
    title: `Order ${order.orderId}`,
    data: {
      status: order.status,
      eta: order.eta,
      total: `${order.currency} ${order.total.toFixed(2)}`,
      items: order.items,
    },
    actions: [
      { label: "Track Order", action: "track_order", style: "primary", payload: { orderId: order.orderId } },
      { label: "Contact Support", action: "contact_support", style: "secondary" },
    ],
  };
}

export function createProductWidget(products: Array<{
  id: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  inStock: boolean;
}>): Widget {
  return {
    type: "product",
    title: "Products",
    data: { products },
    actions: [
      { label: "View All", action: "view_products", style: "primary" },
    ],
  };
}

export function createInvoiceWidget(invoice: {
  invoiceId: string;
  status: string;
  total: number;
  currency: string;
  dueDate: string;
  pdfUrl?: string;
}): Widget {
  return {
    type: "invoice",
    title: `Invoice ${invoice.invoiceId}`,
    data: {
      status: invoice.status,
      total: `${invoice.currency} ${invoice.total.toFixed(2)}`,
      dueDate: invoice.dueDate,
    },
    actions: invoice.pdfUrl
      ? [{ label: "Download PDF", action: "download_invoice", style: "primary", payload: { url: invoice.pdfUrl } }]
      : [],
  };
}

export function createBookingWidget(options: {
  availableSlots: Array<{ date: string; time: string; available: boolean }>;
  service: string;
}): Widget {
  return {
    type: "booking",
    title: `Book ${options.service}`,
    data: { slots: options.availableSlots },
    actions: [
      { label: "Confirm Booking", action: "confirm_booking", style: "primary" },
    ],
  };
}

export function createApprovalWidget(request: {
  requestId: string;
  title: string;
  amount?: number;
  requester: string;
  description: string;
}): Widget {
  return {
    type: "approval",
    title: `Approval: ${request.title}`,
    data: {
      requester: request.requester,
      amount: request.amount,
      description: request.description,
    },
    actions: [
      { label: "Approve", action: "approve_request", style: "primary", payload: { requestId: request.requestId, decision: "approved" } },
      { label: "Reject", action: "reject_request", style: "danger", payload: { requestId: request.requestId, decision: "rejected" } },
    ],
  };
}

export function createTableWidget(title: string, columns: string[], rows: unknown[][]): Widget {
  return { type: "table", title, data: { columns, rows } };
}

export function createChartWidget(title: string, chartType: "bar" | "line" | "pie", data: unknown[]): Widget {
  return { type: "chart", title, data: { chartType, series: data } };
}

// ─── Multichannel Router ────────────────────────────────────────────────────
export class MultichannelRouter {
  private channels = new Map<ChannelType, ChannelHandler>();

  registerChannel(channel: ChannelType, handler: ChannelHandler) {
    this.channels.set(channel, handler);
  }

  async routeMessage(message: ChannelMessage, workspaceId: number, userId: number): Promise<ChannelResponse> {
    const handler = this.channels.get(message.channel);
    if (handler) {
      return handler.processMessage(message, workspaceId, userId);
    }
    return this.defaultProcess(message, workspaceId, userId);
  }

  /**
   * Deliver an assistant reply back through the channel that originated the
   * incoming request. Looks up a connected `integrations` row for this workspace
   * and provider, then delegates to `sendIntegrationMessage`.
   */
  async deliverResponse(
    workspaceId: number,
    channel: ChannelType,
    recipient: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<{ delivered: boolean; integrationId?: number; error?: string }> {
    if (channel === "web" || channel === "api") {
      return { delivered: true, error: "No external channel for web/api responses" };
    }

    const providerMap: Partial<Record<ChannelType, string>> = {
      whatsapp: "whatsapp",
      slack: "slack",
      teams: "teams",
      email: "rest_api",
      voice: "rest_api",
      instagram: "rest_api",
      telegram: "rest_api",
    };
    const provider = providerMap[channel];
    if (!provider) return { delivered: false, error: `No provider mapping for channel ${channel}` };

    try {
      const db = await requireDb();
      const rows = await db
        .select()
        .from(integrations)
        .where(and(
          eq(integrations.workspaceId, workspaceId),
          eq(integrations.provider, provider),
          eq(integrations.status, "connected"),
        ))
        .limit(1);
      const integration = rows[0];
      if (!integration) {
        await writeAuditLog({
          workspaceId,
          actorUserId: null,
          action: "multichannel.delivery_skipped",
          resourceType: "integration",
          metadata: { channel, provider, reason: "no_connected_integration" },
        });
        return { delivered: false, error: `No connected ${provider} integration for this workspace` };
      }

      const cfg = (integration.configuration || {}) as Record<string, unknown>;
      const mergedMetadata: Record<string, unknown> = {
        ...cfg,
        ...(metadata || {}),
        ...(recipient ? { to: recipient, recipient } : {}),
      };

      const result = await sendIntegrationMessage(workspaceId, integration.id, content, mergedMetadata);
      if (!result.success) {
        await writeAuditLog({
          workspaceId,
          actorUserId: null,
          action: "multichannel.delivery_failed",
          resourceType: "integration",
          resourceId: String(integration.id),
          metadata: { channel, provider, error: result.error, configured: result.configured ?? false },
        });
        return { delivered: false, integrationId: integration.id, error: result.error };
      }

      await writeAuditLog({
        workspaceId,
        actorUserId: null,
        action: "multichannel.delivered",
        resourceType: "integration",
        resourceId: String(integration.id),
        metadata: { channel, provider, recipient },
      });

      return { delivered: true, integrationId: integration.id };
    } catch (err) {
      return { delivered: false, error: `Delivery error: ${(err as Error).message}` };
    }
  }

  private async defaultProcess(message: ChannelMessage, workspaceId: number, userId: number): Promise<ChannelResponse> {
    const response = await chat({
      workspaceId,
      conversationId: 0,
      userId,
      message: message.content,
    });

    return {
      channel: message.channel,
      content: response.content,
      widgets: this.detectWidgets(response.content),
    };
  }

  private detectWidgets(content: string): Widget[] {
    const widgets: Widget[] = [];

    // Detect order patterns
    if (/order\s*#?\d+/i.test(content)) {
      widgets.push(createOrderWidget({
        orderId: "检测到的订单",
        status: "shipped",
        eta: "明天",
        total: 149,
        currency: "EUR",
        items: [],
      }));
    }

    return widgets;
  }
}

interface ChannelHandler {
  processMessage(message: ChannelMessage, workspaceId: number, userId: number): Promise<ChannelResponse>;
}

// ─── WhatsApp Channel Handler ───────────────────────────────────────────────
export class WhatsAppChannel implements ChannelHandler {
  async processMessage(message: ChannelMessage, workspaceId: number, userId: number): Promise<ChannelResponse> {
    const response = await chat({
      workspaceId,
      conversationId: 0,
      userId,
      message: message.content,
    });

    return {
      channel: "whatsapp",
      content: response.content,
      metadata: { waTo: message.senderId },
    };
  }
}

// ─── Slack Channel Handler ──────────────────────────────────────────────────
export class SlackChannel implements ChannelHandler {
  async processMessage(message: ChannelMessage, workspaceId: number, userId: number): Promise<ChannelResponse> {
    const response = await chat({
      workspaceId,
      conversationId: 0,
      userId,
      message: message.content,
    });

    return {
      channel: "slack",
      content: response.content,
      metadata: { slackChannel: message.metadata?.channel },
    };
  }
}

// ─── Email Channel Handler ──────────────────────────────────────────────────
export class EmailChannel implements ChannelHandler {
  async processMessage(message: ChannelMessage, workspaceId: number, userId: number): Promise<ChannelResponse> {
    const response = await chat({
      workspaceId,
      conversationId: 0,
      userId,
      message: message.content,
    });

    return {
      channel: "email",
      content: response.content,
      metadata: { to: message.senderId, subject: message.metadata?.subject },
    };
  }
}

// ─── Initialize Default Channels ────────────────────────────────────────────
export const channelRouter = new MultichannelRouter();
channelRouter.registerChannel("whatsapp", new WhatsAppChannel());
channelRouter.registerChannel("slack", new SlackChannel());
channelRouter.registerChannel("email", new EmailChannel());
