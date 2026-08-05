import './instrumentation';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import { Server as SocketIOServer } from 'socket.io';
import { logger, httpLogger } from './src/lib/logger';
import { corsMiddleware, securityHeaders, requestId, requestSizeLimiter } from './src/lib/securityMiddleware';
import { apiRateLimiter } from './src/lib/rateLimiter';

// Nest imports
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './apps/api/src/app.module';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const isDev = process.env.NODE_ENV !== 'production';

async function start() {
  const expressApp = express();

  expressApp.set('trust proxy', 1);
  expressApp.use(requestId);
  expressApp.use(corsMiddleware);
  expressApp.use(securityHeaders);
  expressApp.use(requestSizeLimiter);
  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use(httpLogger);

  // Apply API rate limiter to /api routes (Nest controllers will live under the same express instance)
  expressApp.use('/api', apiRateLimiter);

  // Mount Nest into existing Express app using ExpressAdapter so we have a single unified server
  const adapter = new ExpressAdapter(expressApp);
  const nestApp = await NestFactory.create(AppModule, adapter, { logger: false });
  // Optionally set global prefix if desired — keep as root for compatibility
  // nestApp.setGlobalPrefix('api');
  await nestApp.init();

  // Development: use Vite middleware to serve frontend in dev mode
  if (isDev) {
    const vite = await createViteServer({ server: { middlewareMode: 'ssr' } });
    expressApp.use(vite.middlewares as any);
  } else {
    // Production: serve static frontend from /dist
    const distPath = path.join(process.cwd(), 'dist');
    expressApp.use(express.static(distPath, { maxAge: '1y', etag: false }));

    // SPA fallback
    expressApp.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Create HTTP server and attach Socket.IO
  const httpServer = http.createServer(expressApp);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Attach socket instance to Nest so services may access it via process.env or a shared module if needed in future.
  // For now, expose on process for minimal coupling (services may import a small helper to read this).
  (global as any).__CEREFY_SOCKET_SERVER = io;

  io.on('connection', (socket) => {
    logger.info('[Socket.IO] client connected', { id: socket.id });

    socket.on('disconnect', () => {
      logger.info('[Socket.IO] client disconnected', { id: socket.id });
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Cerefy consolidated backend running`, { port: PORT, env: process.env.NODE_ENV || 'development' });
  });
}

start().catch((err) => {
  logger.error('Failed to start consolidated server', { error: err?.message || err });
  process.exit(1);
});
