import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || 'postgres://cerefy:cerefy_password@localhost:5432/cerefy';
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : true,
  connectionTimeoutMillis: 3000,
  max: 10,
});

export { pool };

export const db = drizzle(pool, { schema });

// Memoized reachability probe: lets DB-backed supporting services (agent
// registry, execution records) degrade gracefully when Postgres is not
// reachable, instead of crashing the request path with an unhandled
// rejection. The probe itself is cheap; the memo holds for the process
// lifetime, which is correct for the cases that use it (dev fallback,
// CI unit-mode, degraded pilot).
let dbReachable: boolean | null = null;

export async function isDatabaseReachable(): Promise<boolean> {
  if (dbReachable !== null) return dbReachable;
  try {
    await pool.query('SELECT 1');
    dbReachable = true;
  } catch {
    dbReachable = false;
  }
  return dbReachable;
}

// Helper to execute queries with RLS context
export async function withTenantContext<T>(tenantId: string, operation: (tx: any) => Promise<T>): Promise<T> {
  // Using an explicit transaction to set the local tenant configuration
  return await db.transaction(async (tx) => {
    // Escape single quotes in tenantId for safety
    const safeTenantId = tenantId.replace(/'/g, "''");
    // Set RLS context for the transaction
    await tx.execute(`SET LOCAL app.current_tenant = '${safeTenantId}'`);
    return await operation(tx);
  });
}
