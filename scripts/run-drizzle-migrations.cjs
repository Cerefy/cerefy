const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');

(async () => {
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DRIZZLE_RUNTIME_ERROR: DATABASE_URL is required');
  process.exit(1);
}

const timeoutMs = Number.parseInt(process.env.MIGRATION_TIMEOUT_MS || '120000', 10);
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  console.error(`DRIZZLE_RUNTIME_ERROR: invalid MIGRATION_TIMEOUT_MS: ${process.env.MIGRATION_TIMEOUT_MS}`);
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 2,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 10_000,
});
const db = drizzle(pool);
let lockClient;
let timer;
const lockKey = 'cerefy.release.database-migration';

try {
  console.log(`DRIZZLE_RUNTIME_START migrationsFolder=${process.env.MIGRATIONS_FOLDER || './drizzle'}`);
  lockClient = await pool.connect();
  await lockClient.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', [lockKey]);
  console.log(`DRIZZLE_RUNTIME_LOCK_ACQUIRED key=${lockKey}`);
  timer = setTimeout(() => {
    console.error(`DRIZZLE_RUNTIME_ERROR: migration timed out after ${timeoutMs}ms`);
    process.exit(124);
  }, timeoutMs);
  await migrate(db, { migrationsFolder: process.env.MIGRATIONS_FOLDER || './drizzle' });
  console.log('DRIZZLE_RUNTIME_SUCCESS migrations applied successfully');
} catch (error) {
  console.error('DRIZZLE_RUNTIME_ERROR: migration failed');
  console.error(error && error.stack ? error.stack : error);
  if (error && typeof error === 'object') {
    console.error(`DRIZZLE_RUNTIME_DETAILS: code=${error.code || 'unknown'} severity=${error.severity || 'unknown'} detail=${error.detail || 'none'} hint=${error.hint || 'none'}`);
    if (error.cause) console.error('DRIZZLE_RUNTIME_CAUSE', error.cause.stack || error.cause);
  }
  process.exitCode = 1;
} finally {
  if (timer) clearTimeout(timer);
  if (lockClient) {
    try { await lockClient.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [lockKey]); console.log(`DRIZZLE_RUNTIME_LOCK_RELEASED key=${lockKey}`); } catch (error) { console.error('DRIZZLE_RUNTIME_LOCK_RELEASE_ERROR', error); }
    lockClient.release();
  }
  await pool.end().catch((error) => console.error('DRIZZLE_RUNTIME_POOL_CLOSE_ERROR', error));
}
})().catch((error) => {
  console.error('DRIZZLE_RUNTIME_FATAL_ERROR');
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
