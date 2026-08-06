// src/lib/securityMiddleware.ts
// Security headers, CORS, and request hardening

import { Request, Response, NextFunction } from 'express';

const isDevelopment = process.env.NODE_ENV !== 'production';

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:3002',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
];

/**
 * CORS middleware - strict production policy
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;

  if (origin && (isDevelopment || ALLOWED_ORIGINS.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (isDevelopment && !origin) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id, x-request-id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24h preflight cache

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

/**
 * Comprehensive security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Remove server fingerprint
  res.removeHeader('X-Powered-By');

  // HTTPS enforcement (only in production with valid HTTPS)
  if (!isDevelopment) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  const scriptSrc = isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com"
    : "script-src 'self' 'unsafe-inline' https://www.gstatic.com";

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' ws: wss: https:",
    "frame-ancestors 'none'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  // Permissions policy - limit browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  next();
}

/**
 * Request ID middleware for distributed tracing
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);
  next();
}

/**
 * Body size limiter
 */
export function requestSizeLimiter(req: Request, res: Response, next: NextFunction): void {
  const MAX_SIZE = parseInt(process.env.MAX_REQUEST_BODY_MB || '10') * 1024 * 1024;
  const contentLength = parseInt(req.headers['content-length'] || '0');

  if (contentLength > MAX_SIZE) {
    res.status(413).json({ error: 'Request entity too large', maxSizeMB: MAX_SIZE / 1024 / 1024 });
    return;
  }

  next();
}
