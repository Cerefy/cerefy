type SentryLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

interface SentryDsnParts {
  protocol: string;
  publicKey: string;
  secretKey?: string;
  host: string;
  projectId: string;
}

function parseSentryDsn(dsn: string): SentryDsnParts | null {
  try {
    const url = new URL(dsn);
    const [publicKey, secretKey] = url.username ? [url.username, url.password || undefined] : [undefined, undefined];
    if (!publicKey) return null;
    const protocol = url.protocol.replace(':', '');
    const projectId = url.pathname.replace(/^\//, '').split('/')[0];
    if (!projectId) return null;
    return {
      protocol,
      publicKey,
      secretKey,
      host: url.host,
      projectId,
    };
  } catch {
    return null;
  }
}

function buildAuthHeader(parts: SentryDsnParts, timestamp: string): string {
  const pieces = [
    'Sentry sentry_version=7',
    `sentry_client=cerefy/1.0`,
    `sentry_key=${parts.publicKey}`,
    `sentry_timestamp=${timestamp}`,
  ];
  if (parts.secretKey) {
    pieces.push(`sentry_secret=${parts.secretKey}`);
  }
  return pieces.join(', ');
}

function createEventId(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function getSentryDsn(): string | null {
  return process.env.SENTRY_DSN || null;
}

export async function captureSentryException(error: unknown, context: Record<string, unknown> = {}): Promise<void> {
  const dsn = getSentryDsn();
  if (!dsn) return;

  const parts = parseSentryDsn(dsn);
  if (!parts) return;

  const timestamp = new Date().toISOString();
  const eventId = createEventId();
  const payload = {
    event_id: eventId,
    timestamp,
    platform: 'node',
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    level: (context.level as SentryLevel) || 'error',
    message: error instanceof Error ? error.message : String(error),
    exception: error instanceof Error
      ? {
          values: [
            {
              type: error.name,
              value: error.message,
              stacktrace: error.stack ? { frames: [{ function: 'unknown', filename: 'server.ts', lineno: 1 }] } : undefined,
            },
          ],
        }
      : undefined,
    tags: context.tags || {},
    extra: context,
  };

  const endpoint = `${parts.protocol}://${parts.host}/api/${parts.projectId}/store/`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sentry-Auth': buildAuthHeader(parts, timestamp),
    },
    body: JSON.stringify(payload),
  }).catch(() => null);

  if (response && !response.ok) {
    return;
  }
}

export async function captureSentryMessage(message: string, level: SentryLevel = 'info', context: Record<string, unknown> = {}): Promise<void> {
  await captureSentryException(new Error(message), { level, ...context });
}
