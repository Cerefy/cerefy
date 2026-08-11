import { ApiError, ErrorCode } from './envelope';

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface CursorMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

type Ordered = Record<string, unknown>;

export function encodeCursor<T extends Ordered>(item: T, keys: (keyof T)[]): string {
  const payload = keys.map((k) => String(item[k] ?? '')) as string[];
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeCursor(cursor: string | null | undefined): string[] {
  if (!cursor) return [];
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some((v) => typeof v !== 'string')) {
      throw new Error('malformed cursor payload');
    }
    return parsed;
  } catch {
    throw new ApiError(ErrorCode.INVALID_CURSOR, 'Cursor is invalid or tampered with', 400);
  }
}

export function uint64Cursor(seq: number): string {
  return Buffer.from(String(seq)).toString('base64url');
}

export function decodeUint64Cursor(cursor: string | null | undefined): number | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const seq = Number(raw);
    if (!Number.isSafeInteger(seq) || seq < 0) throw new Error('invalid seq');
    return seq;
  } catch {
    throw new ApiError(ErrorCode.INVALID_CURSOR, 'Cursor is malformed or tampered', 400);
  }
}

export function paginate<T extends Ordered>(options: {
  items: T[];
  nextCursor: string | null | undefined;
  limit: number;
  orderKey: keyof T;
}): CursorPage<T> {
  const { items, limit, orderKey } = options;
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const decoded = decodeCursor(options.nextCursor);
  const fromValue = decoded.length > 0 ? decoded[0] : null;
  const ordered = [...items].sort((a, b) => String(b[orderKey]).localeCompare(String(a[orderKey])));
  const startIndex = fromValue === null ? 0 : Math.max(0, ordered.findIndex((it) => String(it[orderKey]) === fromValue) + 1);
  const slice = ordered.slice(startIndex, startIndex + safeLimit);
  const hasMore = startIndex + safeLimit < ordered.length;
  return {
    items: slice,
    nextCursor: hasMore && slice.length > 0 ? encodeCursor(slice[slice.length - 1], [orderKey]) : null,
    hasMore,
    limit: safeLimit,
  };
}

export function paginateOrdered<T extends Ordered>(options: {
  items: T[];
  cursor: string | null | undefined;
  limit: number;
  orderKey: keyof T;
  orderDir?: 'asc' | 'desc';
}): CursorPage<T> {
  const { cursor, orderKey, orderDir = 'desc' } = options;
  const safeLimit = Math.min(Math.max(options.limit, 1), 100);
  const decoded = decodeCursor(cursor);
  const fromValue = decoded.length > 0 ? decoded[0] : null;
  const sorted = [...options.items].sort((a, b) => {
    const av = String(a[orderKey] ?? '');
    const bv = String(b[orderKey] ?? '');
    const cmp = av.localeCompare(bv);
    return orderDir === 'desc' ? -cmp : cmp;
  });
  const start = fromValue === null ? 0 : sorted.findIndex((it) => String(it[orderKey]) === fromValue) + 1;
  const startIndex = start < 0 ? 0 : start;
  const slice = sorted.slice(startIndex, startIndex + safeLimit);
  const hasMore = startIndex + safeLimit < sorted.length;
  return {
    items: slice,
    nextCursor: hasMore && slice.length > 0 ? encodeCursor(slice[slice.length - 1], [orderKey]) : null,
    hasMore,
    limit: safeLimit,
  };
}