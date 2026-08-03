// src/lib/logger.ts
// Structured production logger using Winston

import { createLogger, format, transports } from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = format;

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: isDevelopment
    ? combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), simple())
    : combine(timestamp(), errors({ stack: true }), json()),
  defaultMeta: {
    service: 'cerefy-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new transports.Console(),
    // In production, also write to files
    ...(isDevelopment
      ? []
      : [
          new transports.File({ filename: 'logs/error.log', level: 'error' }),
          new transports.File({ filename: 'logs/combined.log' }),
        ]),
  ],
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
});

// HTTP request logger middleware
export function httpLogger(req: any, res: any, next: () => void) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      tenantId: req.headers['x-tenant-id'],
    });
  });
  next();
}
