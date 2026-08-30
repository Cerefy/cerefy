import "dotenv/config";
import { createHash } from "crypto";
import postgres from "postgres";
import {
  agents,
  agentConfigurations,
  knowledgeBases,
  businessRules,
  workflows,
  workflowNodes,
  workflowEdges,
  countryConfigs,
  channelConfigs,
  apiKeys,
  dataSources,
  dataRecords,
} from "../drizzle/schema.js";

const WORKSPACE_ID = 1;
const USER_ID = 1;

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

async function main() {
  console.log("Seeding Haier demo data...");

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const sql = postgres(url, { prepare: false });

  const existingAgent = await sql`SELECT id FROM agents WHERE "workspaceId" = ${WORKSPACE_ID} AND name = 'Haier After-Sales AI' LIMIT 1`;
  let agentId: number;

  if (existingAgent.length > 0) {
    agentId = existingAgent[0].id;
    console.log(`Agent already exists (id=${agentId}), skipping creation`);
  } else {
    const [agent] = await sql`
      INSERT INTO agents ("workspaceId", name, description, purpose, status, "createdById", "createdAt", "updatedAt")
      VALUES (${WORKSPACE_ID}, 'Haier After-Sales AI', 'AI assistant for Haier Europe after-sales support', 'Handle after-sales support for Haier Europe products', 'idle', ${USER_ID}, NOW(), NOW())
      RETURNING id
    `;
    agentId = agent.id;
    console.log(`Created agent id=${agentId}`);
  }

  try {
    const sysPrompt = `You are an AI assistant for Haier Europe after-sales support. You help customers with:
- Product troubleshooting and technical support
- Warranty verification and claims
- Spare parts ordering
- Technician scheduling and home visits
- Product registration and documentation

Always be professional, empathetic, and solution-oriented. When you cannot resolve an issue remotely, create a case for human technicians.
Respond in the customer's language when possible.`;
    await sql.unsafe(
      `INSERT INTO agent_configurations ("agentId", "workspaceId", model, temperature, "maxTokens", "systemInstructions", tone, "primaryLanguage", "supportedLanguages", "createdAt", "updatedAt")
       VALUES ($1, $2, 'gpt-4o', 0.3, 2048, $3, 'technical', 'it', ARRAY['it','en','ar']::text[], NOW(), NOW())
       ON CONFLICT ("agentId") DO UPDATE SET
         model = EXCLUDED.model, temperature = EXCLUDED.temperature, "maxTokens" = EXCLUDED."maxTokens",
         "systemInstructions" = EXCLUDED."systemInstructions", tone = EXCLUDED.tone,
         "primaryLanguage" = EXCLUDED."primaryLanguage", "supportedLanguages" = EXCLUDED."supportedLanguages",
         "updatedAt" = NOW()`,
      [agentId, WORKSPACE_ID, sysPrompt]
    );
    console.log("Agent configuration upserted");
  } catch (e) {
    console.error("Failed to seed agent configuration:", e);
  }

  try {
    await sql`
      INSERT INTO knowledge_bases ("workspaceId", name, description, type, language, configuration, "isPublic", "createdById", "createdAt", "updatedAt")
      VALUES (
        ${WORKSPACE_ID},
        'Haier Product Manuals',
        'Technical manuals, warranty policies, and troubleshooting guides for Haier Europe products',
        'documents',
        'it',
        ${JSON.stringify({ productCategories: ["washers", "dryers", "refrigerators", "dishwashers", "ovens", "air_conditioners"] })},
        false,
        ${USER_ID},
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING
    `;
    console.log("Knowledge base seeded");
  } catch (e) {
    console.error("Failed to seed knowledge base:", e);
  }

  try {
    const rules = [
      {
        name: "Escalate unresolved technical issues",
        description: "IF issue_type=technical AND remote_resolution=false THEN escalate to technician",
        priority: 10,
        condition: { issue_type: "technical", remote_resolution: false },
        actions: { escalate_to: "technician", create_case: true, priority: "high" },
      },
      {
        name: "Inform expired warranty",
        description: "IF warranty_status=expired THEN set response_template=warranty_expired and log",
        priority: 20,
        condition: { warranty_status: "expired" },
        actions: { response_template: "warranty_expired", log_event: true },
      },
      {
        name: "Route VIP customers",
        description: "IF customer_tier=vip THEN assign to senior_agent and priority=high",
        priority: 5,
        condition: { customer_tier: "vip" },
        actions: { assign_to: "senior_agent", priority: "high" },
      },
      {
        name: "Auto-categorize by product",
        description: "IF product_category IS SET THEN set category_label accordingly",
        priority: 50,
        condition: { product_category: { exists: true } },
        actions: { set_category_label: true },
      },
      {
        name: "After-hours routing",
        description: "IF current_time NOT IN business_hours THEN set response=outside_hours_message",
        priority: 30,
        condition: { current_time: { not_in: "business_hours" } },
        actions: { response: "outside_hours_message", log_event: true },
      },
    ];

    for (const rule of rules) {
      await sql`
        INSERT INTO business_rules ("workspaceId", "agentId", name, description, priority, enabled, condition, actions, "createdById", "createdAt", "updatedAt")
        VALUES (
          ${WORKSPACE_ID},
          ${agentId},
          ${rule.name},
          ${rule.description},
          ${rule.priority},
          true,
          ${JSON.stringify(rule.condition)},
          ${JSON.stringify(rule.actions)},
          ${USER_ID},
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
      `;
    }
    console.log("Business rules seeded");
  } catch (e) {
    console.error("Failed to seed business rules:", e);
  }

  try {
    const [workflow] = await sql`
      INSERT INTO workflows ("workspaceId", name, description, status, "createdById", "createdAt", "updatedAt")
      VALUES (${WORKSPACE_ID}, 'Haier After-Sales Flow', 'Customer support workflow: Product ID → Diagnosis → Resolution', 'active', ${USER_ID}, NOW(), NOW())
      ON CONFLICT ("workspaceId", name) DO UPDATE SET status = 'active', "updatedAt" = NOW()
      RETURNING id
    `;
    const workflowId = workflow.id;

    const nodes = [
      { key: "start", type: "trigger", label: "Start", x: 100, y: 300, order: 0 },
      { key: "product_id", type: "intelligence", label: "Product Identification", x: 300, y: 300, order: 1 },
      { key: "remote_diag", type: "intelligence", label: "Remote Diagnosis", x: 500, y: 300, order: 2 },
      { key: "can_resolve", type: "condition", label: "Can Resolve?", x: 700, y: 300, order: 3 },
      { key: "guide_customer", type: "action", label: "Guide Customer", x: 900, y: 200, order: 4 },
      { key: "create_case", type: "action", label: "Create Case", x: 900, y: 400, order: 5 },
      { key: "book_tech", type: "action", label: "Book Technician", x: 1100, y: 400, order: 6 },
      { key: "end", type: "action", label: "End", x: 1300, y: 300, order: 7 },
    ];

    const nodeIds: Record<string, number> = {};
    for (const n of nodes) {
      const [row] = await sql`
        INSERT INTO workflow_nodes ("workflowId", "nodeKey", "nodeType", label, "positionX", "positionY", "sortOrder", "createdAt", "updatedAt")
        VALUES (${workflowId}, ${n.key}, ${n.type}, ${n.label}, ${n.x}, ${n.y}, ${n.order}, NOW(), NOW())
        ON CONFLICT ("workflowId", "nodeKey") DO UPDATE SET label = EXCLUDED.label, "positionX" = EXCLUDED."positionX", "positionY" = EXCLUDED."positionY", "updatedAt" = NOW()
        RETURNING id
      `;
      nodeIds[n.key] = row.id;
    }

    const edges = [
      { from: "start", to: "product_id", cond: null },
      { from: "product_id", to: "remote_diag", cond: null },
      { from: "remote_diag", to: "can_resolve", cond: null },
      { from: "can_resolve", to: "guide_customer", cond: "can_resolve == true" },
      { from: "can_resolve", to: "create_case", cond: "can_resolve == false" },
      { from: "create_case", to: "book_tech", cond: null },
      { from: "guide_customer", to: "end", cond: null },
      { from: "book_tech", to: "end", cond: null },
    ];

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      await sql`
        INSERT INTO workflow_edges ("workflowId", "fromNodeId", "toNodeId", condition, priority, "createdAt")
        VALUES (${workflowId}, ${nodeIds[e.from]}, ${nodeIds[e.to]}, ${e.cond}, ${i}, NOW())
        ON CONFLICT DO NOTHING
      `;
    }
    console.log("Workflow and nodes seeded");
  } catch (e) {
    console.error("Failed to seed workflow:", e);
  }

  try {
    const countries = [
      { code: "IT", lang: "it", currency: "EUR", tz: "Europe/Rome", warranty: "2 years", residency: "EU", regs: "{GDPR}", channels: "{chat,voice}" },
      { code: "SA", lang: "ar", currency: "SAR", tz: "Asia/Riyadh", warranty: "2 years", residency: "GCC", regs: "{PDPL}", channels: "{whatsapp,chat}" },
      { code: "EG", lang: "ar", currency: "EGP", tz: "Africa/Cairo", warranty: "2 years", residency: "LOCAL", regs: "{PDPL}", channels: "{whatsapp,chat}" },
      { code: "DE", lang: "de", currency: "EUR", tz: "Europe/Berlin", warranty: "2 years", residency: "EU", regs: "{GDPR}", channels: "{chat,email}" },
    ];

    for (const c of countries) {
      await sql.unsafe(
        `INSERT INTO country_configs ("workspaceId", "agentId", "countryCode", language, currency, timezone, "warrantyPeriod", "dataResidency", regulations, "preferredChannels", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[], $10::text[], NOW(), NOW())
         ON CONFLICT ("workspaceId", "agentId", "countryCode") DO UPDATE SET
           language = EXCLUDED.language, currency = EXCLUDED.currency, timezone = EXCLUDED.timezone,
           "warrantyPeriod" = EXCLUDED."warrantyPeriod", "dataResidency" = EXCLUDED."dataResidency",
           regulations = EXCLUDED.regulations, "preferredChannels" = EXCLUDED."preferredChannels",
           "updatedAt" = NOW()`,
        [WORKSPACE_ID, agentId, c.code, c.lang, c.currency, c.tz, c.warranty, c.residency, c.regs, c.channels]
      );
    }
    console.log("Country configs seeded");
  } catch (e) {
    console.error("Failed to seed country configs:", e);
  }

  try {
    const channels = [
      {
        type: "chat",
        hours: { start: "09:00", end: "18:00", timezone: "Europe/Rome" },
        greeting: "Buongiorno! Sono l'assistente virtuale Haier. Come posso aiutarla oggi?",
        outside: "Grazie per averci contattato. Il nostro ufficio e chiuso. Lasci un messaggio e la ricontatteremo al piu presto.",
        maxConcurrent: 10,
      },
      {
        type: "whatsapp",
        hours: { start: "09:00", end: "18:00", timezone: "Europe/Rome" },
        greeting: "!مرحباً! أنا مساعد هاير الافتراضي. كيف يمكنني مساعدتك اليوم؟",
        outside: "شكراً ل التواصل معنا. مكتبنا مغلق. يرجى ترك رسالة وسنرد عليك في أقرب وقت.",
        maxConcurrent: 5,
      },
      {
        type: "email",
        hours: { start: "09:00", end: "18:00", timezone: "Europe/Rome" },
        greeting: "Grazie per averci contattato. La tua richiesta e stata ricevuta.",
        outside: "La tua email e stata ricevuta. Risponderemo entro 24 ore lavorative.",
        maxConcurrent: 20,
      },
    ];

    for (const ch of channels) {
      await sql.unsafe(
        `INSERT INTO channel_configs ("workspaceId", "agentId", "channelType", enabled, configuration, "businessHours", "greetingMessage", "outsideHoursMessage", "maxConcurrent", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, '{}'::jsonb, $4::jsonb, $5, $6, $7, NOW(), NOW())
         ON CONFLICT ("workspaceId", "agentId", "channelType") DO UPDATE SET
           enabled = true, "businessHours" = EXCLUDED."businessHours",
           "greetingMessage" = EXCLUDED."greetingMessage", "outsideHoursMessage" = EXCLUDED."outsideHoursMessage",
           "maxConcurrent" = EXCLUDED."maxConcurrent", "updatedAt" = NOW()`,
        [WORKSPACE_ID, agentId, ch.type, JSON.stringify(ch.hours), ch.greeting, ch.outside, ch.maxConcurrent]
      );
    }
    console.log("Channel configs seeded");
  } catch (e) {
    console.error("Failed to seed channel configs:", e);
  }

  try {
    const apiKeyRaw = "sk_live_haier_demo_2026_key";
    const keyHash = hashKey(apiKeyRaw);
    const keyPrefix = apiKeyRaw.substring(0, 12);
    const keyId = `ak_haier_demo_${Date.now()}`;

    await sql.unsafe(
      `INSERT INTO api_keys (id, "workspaceId", "userId", name, "keyPrefix", "keyHash", scopes, "rateLimit", "expiresAt", "isActive", "createdAt")
       VALUES ($1, $2, $3, 'Haier Demo Key', $4, $5, '["*"]'::jsonb, 100, '2099-12-31T23:59:59Z', true, NOW())
       ON CONFLICT ("keyHash") DO NOTHING`,
      [keyId, WORKSPACE_ID, USER_ID, keyPrefix, keyHash]
    );
    console.log(`API key seeded (raw: ${apiKeyRaw})`);
  } catch (e) {
    console.error("Failed to seed API key:", e);
  }

  try {
    const [ds] = await sql`
      INSERT INTO data_sources ("workspaceId", name, type, status, "createdById", "createdAt", "updatedAt")
      VALUES (${WORKSPACE_ID}, 'Haier Product Catalog', 'csv', 'connected', ${USER_ID}, NOW(), NOW())
      ON CONFLICT ("workspaceId", name) DO UPDATE SET status = 'connected', "updatedAt" = NOW()
      RETURNING id
    `;
    const dsId = ds.id;

    const products = [
      { ext: "HW-100-B14959SU", payload: { name: "Haier 10kg Washer HW-100-B14959SU", category: "washers", price: 699, warrantyMonths: 24, sku: "HW-100-B14959SU", region: "EU" } },
      { ext: "HD-90-B14959U1", payload: { name: "Haier 9kg Dryer HD-90-B14959U1", category: "dryers", price: 599, warrantyMonths: 24, sku: "HD-90-B14959U1", region: "EU" } },
      { ext: "HB-168-THE2SW8-NZ", payload: { name: "Haier French Door Refrigerator", category: "refrigerators", price: 1299, warrantyMonths: 24, sku: "HB-168-THE2SW8-NZ", region: "EU" } },
      { ext: "DW-15-BK3ABB", payload: { name: "Haier 15-place Dishwasher", category: "dishwashers", price: 449, warrantyMonths: 24, sku: "DW-15-BK3ABB", region: "EU" } },
      { ext: "HO-60-BQ1-679W", payload: { name: "Haier Built-in Oven 60cm", category: "ovens", price: 399, warrantyMonths: 24, sku: "HO-60-BQ1-679W", region: "EU" } },
      { ext: "AS-25T1F2NA-AU", payload: { name: "Haier Air Conditioner Split 2.5kW", category: "air_conditioners", price: 799, warrantyMonths: 24, sku: "AS-25T1F2NA-AU", region: "EU" } },
    ];

    for (const p of products) {
      const searchText = `${p.payload.name} ${p.payload.category} ${p.payload.sku}`;
      await sql`
        INSERT INTO data_records ("workspaceId", "dataSourceId", "externalId", payload, "searchableText", "createdAt", "updatedAt")
        VALUES (${WORKSPACE_ID}, ${dsId}, ${p.ext}, ${JSON.stringify(p.payload)}, ${searchText}, NOW(), NOW())
        ON CONFLICT ("dataSourceId", "externalId") DO UPDATE SET
          payload = EXCLUDED.payload,
          "searchableText" = EXCLUDED."searchableText",
          "updatedAt" = NOW()
      `;
    }
    console.log("Sample product data seeded");
  } catch (e) {
    console.error("Failed to seed sample data:", e);
  }

  await sql.end();
  console.log("Haier demo data seeded successfully!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
