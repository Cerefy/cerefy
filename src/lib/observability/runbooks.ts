export interface Runbook {
  id: string;
  alert: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  steps: string[];
}

/**
 * §4.3 — every alert has a runbook link. An alert with no documented response
 * is noise that trains the on-call engineer to ignore pages. The burn-rate
 * alerts (SLO, §4.2/4.3) and the AI-specific pages (cost anomaly §3.2,
 * hallucination-firewall trip §11.1) all point here.
 */
export const RUNBOOKS: Runbook[] = [
  {
    id: 'rb-slo-burn',
    alert: 'SLO_BURN_RATE_HIGH',
    severity: 'critical',
    description: 'SLO error budget burning faster than projectable: either API availability or p95 latency slipping.',
    steps: [
      'Open /api/slo self-report and /api/metrics/render to confirm the slipping service.',
      'Check per-stage trace spans for the AI pipeline (Understand→Retrieve→Plan→Agents→Analyze→Answer).',
      'If Retrieve stage has no span or anomalous duration, treat as fabrication risk — page the AI lead.',
      'Reduce blast radius with feature flag (not capabilities.ts): ramp affected feature to a smaller tenant cohort.',
      'Update incident state in the ops channel with runbook id rb-slo-burn.',
    ],
  },
  {
    id: 'rb-cost-anomaly',
    alert: 'AI_COST_ANOMALY',
    severity: 'high',
    description: 'Tenant daily token cost crossed the anomaly threshold — possible runaway agent loop.',
    steps: [
      'Load ai_queries for the tenant grouped by hour; look for repeated identical query patterns.',
      'Check agent_executions event_log for a loop; terminate the looped execution.',
      'Apply per-tenant rate cap for that tenant until the loop is resolved (§1.3).',
      'Runbook: rb-cost-anomaly. Record in audit log.',
    ],
  },
  {
    id: 'rb-guardrail-trip',
    alert: 'AI_GUARDRAIL_TRIP',
    severity: 'high',
    description: 'Hallucination firewall (or prompt-injection quarantine) blocked or escalated an answer.',
    steps: [
      'Use §12 reconstruction endpoint to replay the answer: retrieved data, model/prompt version, confidence, human follow-up.',
      'Determine whether the block was correct (good) or the verification is over-firing (tune threshold).',
      'Feed the case into the golden set (§2.1) — this is exactly the input the eval suite should have caught.',
      'If prompt-injection was quarantined, add the source document to the ingestion threat list (§5.4/§11.2).',
    ],
  },
  {
    id: 'rb-provider-outage',
    alert: 'AI_PROVIDER_OUTAGE',
    severity: 'high',
    description: 'Primary LLM provider unavailable; fallback path should be serving honest "AI temporarily limited".',
    steps: [
      'Confirm the fallback provider is serving (should return clear degradation, never stale answers).',
      'Run chaos drill §11.6 provider_outage in staging to confirm honest degradation before touching prod.',
      'Coordinate provider status; update RUNBOOKS and the provider-outage status mapping.',
    ],
  },
];

export function runbookFor(alert: string): Runbook | null {
  return RUNBOOKS.find((r) => r.alert === alert) ?? null;
}

export function linkToRunbook(alert: string): string {
  const rb = runbookFor(alert);
  return rb ? `runbook:${rb.id}` : 'runbook:unassigned';
}