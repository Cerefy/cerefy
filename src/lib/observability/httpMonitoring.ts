import type { NextFunction, Request, Response } from 'express';
import { Metrics, registry } from './metrics';

export function createHttpMonitoring(): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const route = req.route?.path ?? req.path;
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      registry.incr(Metrics.httpRequestsTotal, { method: req.method, route });
      if (res.statusCode >= 400) {
        registry.incr(Metrics.httpErrorsTotal, {
          method: req.method,
          route,
          status: String(res.statusCode),
        });
      }
      registry.observe(Metrics.httpDurationSeconds, durationMs / 1000, { route });
    });
    next();
  };
}

export function observeAiTokens(tenantId: string, tokens: number): void {
  registry.observe(Metrics.aiTokensPerQuery, tokens, { tenantId });
}

export function observeAiConfidence(tenantId: string, confidence: number): void {
  registry.observe(Metrics.aiConfidence, confidence, { tenantId });
}

export function observeHumanOverride(tenantId: string, overridden: boolean): void {
  registry.incr(Metrics.aiHumanOverrideRate, { tenantId }, overridden ? 1 : 0);
}

export function observeAiOutcome(tenantId: string, achieved: boolean): void {
  registry.incr(
    achieved ? Metrics.aiOutcomeLinkedConfirmed : Metrics.aiOutcomeLinkedUnconfirmed,
    { tenantId },
  );
}

export function renderPrometheus(): string {
  const { counters, histograms } = registry.snapshot();
  const start = ['# Cerefy API metrics (RED + AI)'];
  const counterLines = counters.map((c) => `${c.name}${renderTags(c.tags)} ${c.value}`);
  const histogramLines: string[] = [];
  for (const h of histograms) {
    for (const v of h.values) {
      histogramLines.push(`${h.name}${renderTags(h.tags)} ${v}`);
    }
  }
  return [...start, ...counterLines, ...histogramLines].join('\n');
}

function renderTags(tags: Record<string, string>): string {
  const keys = Object.keys(tags);
  if (keys.length === 0) return '';
  const inner = keys.map((k) => `${k}="${tags[k]}"`).join(',');
  return `{${inner}}`;
}