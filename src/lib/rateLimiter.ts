// src/lib/rateLimiter.ts
// Rate limiting configuration for production security

import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter (use Redis in production for multi-instance)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

function getClientIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
}) {
  const { windowMs, max, message = 'Too many requests, please try again later.', keyPrefix = 'rl' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${keyPrefix}:${getClientIp(req)}`;
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      res.status(429).json({ error: message, retryAfter: Math.ceil(windowMs / 1000) });
      return;
    }

    next();
  };
}

// Strict limiter for auth endpoints (10 requests per 15 minutes)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyPrefix: 'auth',
});

// Standard API limiter (200 requests per minute)
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 200,
  message: 'API rate limit exceeded. Please slow down your requests.',
  keyPrefix: 'api',
});

// Heavy AI operations limiter (20 per minute)
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'AI execution rate limit reached. Please wait before running more agent tasks.',
  keyPrefix: 'ai',
});

// Clean up expired entries periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 60 * 1000);

cleanupInterval.unref?.();
