import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  connect_timeout: 30,
  statement_timeout: 60000,
});

async function main() {
  console.log("🔗 Connecting to database...");

  // List existing tables
  const tables = await sql.unsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log(`📋 Existing tables: ${tables.length}`);
  tables.forEach((t: any) => console.log(`   - ${t.table_name}`));

  // Apply migration 0001
  const m1Path = join(import.meta.dirname, "../drizzle/0001_enhanced_sopranova.sql");
  const m1 = readFileSync(m1Path, "utf8");
  console.log("\n🔧 Applying migration 0001_enhanced_sopranova...");
  try {
    await sql.unsafe(m1);
    console.log("   ✅ Migration 0001 applied successfully");
  } catch (e: any) {
    if (e.message.includes("already exists")) {
      console.log("   ⚠️  Some objects already exist, continuing...");
    } else {
      console.error(`   ❌ Migration 0001 failed: ${e.message}`);
    }
  }

  // Apply migration 0002
  const m2Path = join(import.meta.dirname, "../drizzle/0002_architecture_v1.sql");
  const m2 = readFileSync(m2Path, "utf8");
  console.log("\n🔧 Applying migration 0002_architecture_v1...");
  try {
    await sql.unsafe(m2);
    console.log("   ✅ Migration 0002 applied successfully");
  } catch (e: any) {
    if (e.message.includes("already exists")) {
      console.log("   ⚠️  Some objects already exist, continuing...");
    } else {
      console.error(`   ❌ Migration 0002 failed: ${e.message}`);
    }
  }

  // Verify tables
  const tablesAfter = await sql.unsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log(`\n📋 Tables after migrations: ${tablesAfter.length}`);
  tablesAfter.forEach((t: any) => console.log(`   - ${t.table_name}`));

  // Check specifically for new tables
  const expected = [
    "memory_entries", "traces", "trace_spans", "eval_runs",
    "api_keys", "widget_templates",
    "knowledge_bases", "embeddings", "agent_configurations",
    "business_rules", "workflow_edges", "tool_definitions",
    "agent_tool_assignments", "country_configs", "channel_configs"
  ];
  const existing = tablesAfter.map((t: any) => t.table_name);
  const missing = expected.filter(t => !existing.includes(t));
  if (missing.length > 0) {
    console.log(`\n⚠️  Missing tables: ${missing.join(", ")}`);
  } else {
    console.log("\n✅ All expected tables exist!");
  }

  await sql.end();
  console.log("\n🎉 Done!");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
