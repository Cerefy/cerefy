import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

if (process.env.NODE_ENV !== "development") throw new Error("The development seed is disabled outside NODE_ENV=development.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for development seed data.");

const email = (process.env.DEV_SEED_EMAIL ?? "developer@example.test").toLowerCase();
const password = process.env.DEV_SEED_PASSWORD ?? "ChangeThisDevelopmentPassword!2026";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [existingUsers] = await connection.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
let userId = existingUsers[0]?.id;
if (!userId) {
  const passwordHash = await bcrypt.hash(password, 12);
  const [created] = await connection.execute("INSERT INTO users (openId, name, email, passwordHash, loginMethod, authProvider, role) VALUES (?, ?, ?, ?, 'credentials', 'credentials', 'user')", [`dev-${Date.now()}`, "Development Owner", email, passwordHash]);
  userId = created.insertId;
}
const [organizationRows] = await connection.execute("SELECT id FROM organizations WHERE slug = 'development' LIMIT 1");
let organizationId = organizationRows[0]?.id;
if (!organizationId) { const [created] = await connection.execute("INSERT INTO organizations (name, slug, createdById) VALUES ('Development Organization', 'development', ?)", [userId]); organizationId = created.insertId; }
const [workspaceRows] = await connection.execute("SELECT id FROM workspaces WHERE organizationId = ? AND slug = 'development' LIMIT 1", [organizationId]);
let workspaceId = workspaceRows[0]?.id;
if (!workspaceId) { const [created] = await connection.execute("INSERT INTO workspaces (organizationId, name, slug, isDefault, createdById) VALUES (?, 'Development Workspace', 'development', true, ?)", [organizationId, userId]); workspaceId = created.insertId; }
await connection.execute("INSERT INTO memberships (workspaceId, userId, role, isActive) VALUES (?, ?, 'owner', true) ON DUPLICATE KEY UPDATE role = 'owner', isActive = true", [workspaceId, userId]);
await connection.execute("INSERT INTO agents (workspaceId, name, purpose, status, createdById) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE purpose = VALUES(purpose), status = VALUES(status)", [workspaceId, "Development Analyst", "Produces non-production development analysis from seeded metrics.", "idle", userId]);
await connection.execute("INSERT INTO data_sources (workspaceId, name, type, status, createdById) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)", [workspaceId, "Development Metrics", "Development fixture", "connected", userId]);
const metricDate = new Date(); metricDate.setUTCHours(0, 0, 0, 0); const metricTimestamp = metricDate.toISOString().slice(0, 19).replace("T", " ");
for (const [metricKey, value] of [["revenue", 125000], ["mrr", 10500], ["nrr", 112], ["cac", 3200], ["acv", 42000]]) await connection.execute("INSERT INTO business_metrics (workspaceId, metricDate, metricKey, segment, metricValue) VALUES (?, ?, ?, 'all', ?) ON DUPLICATE KEY UPDATE metricValue = VALUES(metricValue)", [workspaceId, metricTimestamp, metricKey, value]);
await connection.end();
console.log(`Development seed completed for ${email}.`);
