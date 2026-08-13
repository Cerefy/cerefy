import { readFileSync } from 'node:fs';

export interface SecretHit {
  detector: string;
  line: number;
  column: number;
  /** A masked preview. Raw credentials are never returned to callers. */
  value: string;
}

export interface SecretScanResult {
  safe: boolean;
  hits: SecretHit[];
}

interface Detector {
  name: string;
  expression: RegExp;
  secretGroup?: number;
}

const DETECTORS: readonly Detector[] = [
  {
    name: 'private_key_block',
    expression: /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/g,
  },
  {
    name: 'stripe_secret_key',
    expression: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
  },
  {
    name: 'github_personal_access_token',
    expression: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  },
  {
    name: 'openai_api_key',
    expression: /\bsk-proj-[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: 'aws_access_key_id',
    expression: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  },
  {
    name: 'sensitive_assignment',
    expression:
      /\b(?:OPENAI_API_KEY|GEMINI_API_KEY|ANTHROPIC_API_KEY|JWT_SECRET|JWT_REFRESH_SECRET|DATABASE_URL|NEO4J_PASSWORD|POSTGRES_PASSWORD|REDIS_PASSWORD)\b\s*[:=]\s*["']?([^\s"'`,;]+)/gi,
    secretGroup: 1,
  },
];

function mask(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= 8) return '********';
  return `${compact.slice(0, 4)}…${compact.slice(-4)}`;
}

function lineAndColumn(text: string, offset: number): { line: number; column: number } {
  const prefix = text.slice(0, offset);
  const line = prefix.split('\n').length;
  const lastNewline = prefix.lastIndexOf('\n');
  return { line, column: offset - lastNewline };
}

/**
 * Scans text for high-confidence secret formats and sensitive assignments.
 * Results contain only masked previews, never the raw matched credential.
 */
export function scanText(text: string): SecretScanResult {
  const hits: SecretHit[] = [];

  for (const detector of DETECTORS) {
    detector.expression.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = detector.expression.exec(text)) !== null) {
      const rawValue = detector.secretGroup === undefined ? match[0] : match[detector.secretGroup];
      if (!rawValue) continue;
      const offset = detector.secretGroup === undefined
        ? match.index
        : match.index + match[0].lastIndexOf(rawValue);
      const { line, column } = lineAndColumn(text, offset);
      hits.push({ detector: detector.name, line, column, value: mask(rawValue) });

      // Avoid an infinite loop if a future detector can match an empty string.
      if (match[0].length === 0) detector.expression.lastIndex += 1;
    }
  }

  return { safe: hits.length === 0, hits };
}

/** Reads UTF-8 text from disk and applies the same masked detection policy. */
export function scanFile(filePath: string): SecretScanResult {
  return scanText(readFileSync(filePath, 'utf8'));
}
