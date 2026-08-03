import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://cerefy:cerefy_password@localhost:5432/cerefy',
});

export const db = drizzle(pool, { schema });

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
