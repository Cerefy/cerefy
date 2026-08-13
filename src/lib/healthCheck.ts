// src/lib/healthCheck.ts
// Comprehensive health check and readiness probe endpoints

import { Request, Response } from 'express';
import { getNeo4jDriver } from './neo4j';
import { pool as dbPool } from '../db';
import { GeminiProvider } from './llm/gemini';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: Record<string, ComponentHealth>;
}

interface ComponentHealth {
  status: 'up' | 'down' | 'unknown' | 'not_configured';
  latencyMs?: number;
  message?: string;
}

const startTime = Date.now();

async function checkDatabase(): Promise<ComponentHealth> {
  if (!process.env.DATABASE_URL) {
    return { status: 'down', message: 'DATABASE_URL not configured' };
  }

  try {
    const start = Date.now();
    const client = await dbPool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
    return { status: 'up', latencyMs: Date.now() - start };
  } catch (err: any) {
    return { status: 'down', message: err.message };
  }
}

let geminiProbe: { checkedAt: number; result: ComponentHealth } | null = null;
const GEMINI_PROBE_CACHE_MS = 30_000;
const GEMINI_PROBE_TIMEOUT_MS = 8_000;

async function checkGemini(): Promise<ComponentHealth> {
  if (!process.env.GEMINI_API_KEY) {
    return { status: 'not_configured', message: 'GEMINI_API_KEY not configured' };
  }
  if (geminiProbe && Date.now() - geminiProbe.checkedAt < GEMINI_PROBE_CACHE_MS) {
    return geminiProbe.result;
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_PROBE_TIMEOUT_MS);
  try {
    const provider = new GeminiProvider(process.env.GEMINI_API_KEY);
    await Promise.race([
      provider.complete({
        modelId: 'gemini-3.6-flash',
        messages: [{ role: 'user', content: 'Reply with the single word OK.' }],
        temperature: 0,
        maxTokens: 1,
      }),
      new Promise<never>((_, reject) => controller.signal.addEventListener('abort', () => reject(new Error('Gemini readiness probe timed out')), { once: true })),
    ]);
    const result = { status: 'up' as const, latencyMs: Date.now() - startedAt, message: 'Live Gemini API request succeeded' };
    geminiProbe = { checkedAt: Date.now(), result };
    return result;
  } catch (err: any) {
    const result = { status: 'down' as const, latencyMs: Date.now() - startedAt, message: err?.message || 'Gemini API request failed' };
    geminiProbe = { checkedAt: Date.now(), result };
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkFirebase(): Promise<ComponentHealth> {
  try {
    const adminModule = await import('firebase-admin');
    const adminApp = adminModule.default;
    const apps = (adminApp as any).apps;
    if (apps && apps.length > 0) {
      return { status: 'up', message: 'Firebase Admin initialized' };
    }
    return { status: 'not_configured', message: 'Firebase Admin not configured for the pilot' };
  } catch {
    return { status: 'down', message: 'Firebase Admin unavailable' };
  }
}

async function checkNeo4j(): Promise<ComponentHealth> {
  if (!process.env.NEO4J_URI) {
    return { status: 'not_configured', message: 'NEO4J_URI not configured for the pilot' };
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

  // Pilot readiness requires both the database and Gemini. Neo4j and Firebase
  // remain informational integrations and never block pilot readiness.
  const databaseDown = db.status === 'down';
  const geminiUnavailable = gemini.status === 'down' || gemini.status === 'not_configured';
  if (databaseDown || geminiUnavailable) {
    overallStatus = databaseDown && geminiUnavailable ? 'unhealthy' : 'degraded';
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
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}
