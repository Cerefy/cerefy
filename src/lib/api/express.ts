import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiError, ErrorCode, fail, ok } from './envelope';
import { ContractSpec, assertValid } from './validate';

export interface ApiHandler<T = unknown> {
  (req: Request, res: Response): Promise<T> | T;
}

export function contractBody<T extends Record<string, unknown>>(spec: ContractSpec): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = assertValid<T>(spec, req.body as unknown);
      next();
    } catch (err) {
      if (err instanceof ApiError) {
        const { status, body } = fail(err.code as never, err.message, {
          requestId: req.headers['x-request-id'] as string,
        });
        res.status(status).json(body);
        return;
      }
      next(err);
    }
  };
}

export function sendError(res: Response, err: unknown, requestId?: string): void {
  if (err instanceof ApiError) {
    const { status, body } = fail(err.code as never, err.message, { requestId });
    res.status(status).json(body);
    return;
  }
  const { status, body } = fail(ErrorCode.INTERNAL, 'Internal server error', { requestId });
  res.status(status).json(body);
}

export function wrap<T>(requestId: string | undefined, handler: (req: Request, res: Response) => Promise<T> | T): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await handler(req, res);
      if (!res.headersSent) {
        res.status(200).json(ok(data, { requestId: req.headers['x-request-id'] as string }));
      }
    } catch (err) {
      sendError(res, err, requestId);
    }
  };
}