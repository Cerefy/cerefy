// src/lib/healthCheck.ts
// Comprehensive health check and readiness probe endpoints

import { Request, Response } from 'express';
import { getNeo4jDriver } from './neo4j';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: Record<string, ComponentHealth>;
}

interface ComponentHealth {
  status: 'up' | 'down' | 'unknown';
  latencyMs?: number;
  message?: string;
}

const startTime = Date.now();

function envConfigured(...keys: string[]): boolean {
  return keys.every((key) => Boolean(process.env[key]));
}

async function checkDatabase(): Promise<ComponentHealth> {
  if (!process.env.DATABASE_URL) {
    return { status: 'down', message: 'DATABASE_URL not configured' };
  }

  try {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
    const start = Date.now();
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
      await pool.end();
    }
    return { status: 'up', latencyMs: Date.now() - start };
  } catch (err: any) {
    return { status: 'down', message: err.message };
  }
}

async function checkGemini(): Promise<ComponentHealth> {
  if (!process.env.GEMINI_API_KEY) {
    return { status: 'unknown', message: 'GEMINI_API_KEY not configured' };
  }
  return { status: 'up', message: 'API key configured' };
}

async function checkFirebase(): Promise<ComponentHealth> {
  try {
    const adminModule = await import('firebase-admin');
    const adminApp = adminModule.default;
    const apps = (adminApp as any).apps;
    if (apps && apps.length > 0) {
      return { status: 'up', message: 'Firebase Admin initialized' };
    }
    return { status: 'unknown', message: 'Firebase Admin not yet initialized' };
  } catch {
    return { status: 'down', message: 'Firebase Admin unavailable' };
  }
}

async function checkNeo4j(): Promise<ComponentHealth> {
  if (!process.env.NEO4J_URI) {
    return { status: 'unknown', message: 'NEO4J_URI not configured' };
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session();
    const start = Date.now();
    try {
      await session.run('RETURN 1 AS ok');
    } finally {
      await session.close();
    }
    return { status: 'up', latencyMs: Date.now() - start };
  } catch (err: any) {
    return { status: 'down', message: err.message };
  }
}

function checkIntegrationPresence(): Record<string, ComponentHealth> {
  return {
    langsmith: envConfigured('LANGSMITH_API_KEY')
      ? { status: 'up', message: 'LangSmith configured' }
      : { status: 'unknown', message: 'LANGSMITH_API_KEY not configured' },
    github: envConfigured('GITHUB_TOKEN')
      ? { status: 'up', message: 'GitHub automation configured' }
      : { status: 'unknown', message: 'GITHUB_TOKEN not configured' },
    qdrant: envConfigured('QDRANT_URL')
      ? { status: 'up', message: 'Qdrant configured' }
      : { status: 'unknown', message: 'QDRANT_URL not configured' },
    sentry: envConfigured('SENTRY_DSN')
      ? { status: 'up', message: 'Sentry configured' }
      : { status: 'unknown', message: 'SENTRY_DSN not configured' },
    cloudflare: envConfigured('CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_ZONE_ID')
      ? { status: 'up', message: 'Cloudflare configured' }
      : { status: 'unknown', message: 'Cloudflare credentials not fully configured' },
    temporal: envConfigured('TEMPORAL_ADDRESS', 'TEMPORAL_NAMESPACE', 'TEMPORAL_TASK_QUEUE')
      ? { status: 'up', message: 'Temporal configured' }
      : { status: 'unknown', message: 'Temporal not configured' },
  };
}

/**
 * Liveness probe - used by Docker/K8s to know if the process is alive
 */
export async function livenessCheck(req: Request, res: Response): Promise<void> {
  res.json({
    status: 'alive',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Readiness probe - used by load balancer to know if app can serve traffic
 */
export async function readinessCheck(req: Request, res: Response): Promise<void> {
  const checks: Record<string, ComponentHealth> = {};
  let overallStatus: HealthStatus['status'] = 'healthy';

  const [db, neo4j, gemini, firebase] = await Promise.all([checkDatabase(), checkNeo4j(), checkGemini(), checkFirebase()]);

  checks.database = db;
  checks.neo4j = neo4j;
  checks.gemini = gemini;
  checks.firebase = firebase;
  Object.assign(checks, checkIntegrationPresence());

  if (db.status === 'down' || neo4j.status === 'down') {
    overallStatus = 'degraded';
  }
  if (db.status === 'down' && neo4j.status === 'down') {
    overallStatus = 'unhealthy';
  }

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 503 : 500;
  res.status(statusCode).json(health);
}

/**
 * Simple health endpoint (legacy compat)
 */
export async function simpleHealthCheck(req: Request, res: Response): Promise<void> {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    integrations: {
      langsmithConfigured: !!process.env.LANGSMITH_API_KEY,
      qdrantConfigured: !!process.env.QDRANT_URL,
      temporalConfigured: envConfigured('TEMPORAL_ADDRESS', 'TEMPORAL_NAMESPACE', 'TEMPORAL_TASK_QUEUE'),
      sentryConfigured: !!process.env.SENTRY_DSN,
      cloudflareConfigured: envConfigured('CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_ZONE_ID'),
      githubConfigured: !!process.env.GITHUB_TOKEN,
    },
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}
