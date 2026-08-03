// src/lib/healthCheck.ts
// Comprehensive health check and readiness probe endpoints

import { Request, Response } from 'express';

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

async function checkDatabase(): Promise<ComponentHealth> {
  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    return { status: 'down', message: 'DATABASE_URL not configured' };
  }
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
    const start = Date.now();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    await pool.end();
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
    // Check if any firebase apps have been initialized
    const apps = (adminApp as any).apps;
    if (apps && apps.length > 0) {
      return { status: 'up', message: 'Firebase Admin initialized' };
    }
    return { status: 'unknown', message: 'Firebase Admin not yet initialized' };
  } catch {
    return { status: 'down', message: 'Firebase Admin unavailable' };
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

  // Run all checks in parallel
  const [db, gemini, firebase] = await Promise.all([checkDatabase(), checkGemini(), checkFirebase()]);

  checks.database = db;
  checks.gemini = gemini;
  checks.firebase = firebase;

  // Determine overall status
  if (db.status === 'down') overallStatus = 'degraded';

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
  };

  const statusCode = overallStatus !== 'healthy' ? 503 : 200;
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
