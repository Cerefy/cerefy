import { randomUUID } from 'crypto';

export interface ApiMeta {
  requestId: string;
  tenantId?: string;
  pagination?: unknown;
  [key: string]: unknown;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;

  constructor(code: string, message: string, status = 400, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
  INVALID_CURSOR: 'INVALID_CURSOR',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

const STATUS_BY_CODE: Record<ErrorCodeValue, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INTERNAL]: 500,
  [ErrorCode.INVALID_CURSOR]: 400,
  [ErrorCode.IDEMPOTENCY_CONFLICT]: 409,
};

export function ok<T>(data: T, meta: Partial<ApiMeta> = {}): ApiEnvelope<T> {
  return {
    data,
    meta: {
      requestId: meta.requestId || randomUUID(),
      tenantId: meta.tenantId,
      pagination: meta.pagination,
    },
  };
}

export function fail(
  code: ErrorCodeValue,
  message: string,
  opts: { requestId?: string; status?: number } = {},
): { body: ApiErrorBody; status: number } {
  const status = opts.status || STATUS_BY_CODE[code];
  return {
    status,
    body: {
      error: {
        code,
        message,
        requestId: opts.requestId,
      },
    },
  };
}

export function toApiError(responseBody: ApiErrorBody | ApiEnvelope<unknown>): ApiError | null {
  if (responseBody && typeof responseBody === 'object' && 'error' in responseBody) {
    const err = (responseBody as ApiErrorBody).error;
    return new ApiError(err.code, err.message, 400, err.requestId);
  }
  return null;
}