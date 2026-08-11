export interface SloTarget {
  api: number;
  latencyP95Ms: number;
  auth: number;
  rpoSeconds: number;
}

export interface SloWindow {
  startMs: number;
  endMs: number;
  successful: number;
  errors: number;
  latenciesMs: number[];
  authFailures: number;
  authAttempts: number;
}

export function deploymentTargets(phase: 'pilot' | 'scale'): SloTarget {
  return phase === 'pilot'
    ? { api: 0.995, latencyP95Ms: 15000, auth: 0.999, rpoSeconds: 3600 }
    : { api: 0.999, latencyP95Ms: 8000, auth: 0.9995, rpoSeconds: 900 };
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
  return sorted[rank - 1];
}

export type SloStatus = 'meeting' | 'at_risk' | 'breaching';

export interface SloReport {
  apiAvailability: { target: number; actual: number | null; status: SliStatus };
  latencyP95Ms: { target: number; actual: number | null; status: SliStatus };
  authAvailability: { target: number; actual: number | null; status: SliStatus };
  rpoSeconds: number;
  overall: SliStatus;
  windowMs: number;
  samples: number;
  observations: {
    total: number;
    successful: number;
    errors: number;
    latencies: number[];
  };
}

type SliStatus = 'meeting' | 'at_risk' | 'breaching';

function sliStatus(actual: number | null, target: number): SliStatus {
  if (actual === null) return 'meeting';
  if (actual >= target) return 'meeting';
  if (actual >= target * 0.95) return 'at_risk';
  return 'breaching';
}

export function emptyWindow(): SloWindow {
  return {
    startMs: Date.now(),
    endMs: Date.now(),
    successful: 0,
    errors: 0,
    latenciesMs: [],
    authFailures: 0,
    authAttempts: 0,
  };
}

export function buildSloReport(phase: 'pilot' | 'scale', window: SloWindow): SloReport {
  const targets = deploymentTargets(phase);
  const total = window.successful + window.errors;
  const apiActual = total === 0 ? null : window.successful / total;
  const authTotal = window.authAttempts;
  const authActual = authTotal === 0 ? null : (authTotal - window.authFailures) / authTotal;
  const p95 = window.latenciesMs.length > 0 ? percentile(window.latenciesMs, 95) : null;
  const latencyTolerance = targets.latencyP95Ms * 1.2;

  const latencyStatus: SliStatus =
    p95 === null ? 'meeting' : p95 <= targets.latencyP95Ms ? 'meeting' : p95 <= latencyTolerance ? 'at_risk' : 'breaching';

  const apiVerdict = reliability(targets.api, apiActual);
  const authVerdict = reliability(targets.auth, authActual);

  const statuses = [apiVerdict.status, authVerdict.status, latencyStatus];
  const overall: SliStatus = statuses.includes('breaching')
    ? 'breaching'
    : statuses.includes('at_risk')
      ? 'at_risk'
      : 'meeting';

  return {
    apiAvailability: apiVerdict,
    latencyP95Ms: { target: targets.latencyP95Ms, actual: p95, status: latencyStatus },
    authAvailability: authVerdict,
    rpoSeconds: targets.rpoSeconds,
    overall,
    windowMs: window.endMs - window.startMs,
    samples: total,
    observations: {
      total,
      successful: window.successful,
      errors: window.errors,
      latencies: [...window.latenciesMs],
    },
  };
}

function reliability(target: number, actual: number | null): { target: number; actual: number | null; status: SliStatus } {
  return { target, actual, status: sliStatus(actual, target) };
}

export function burnRate(phase: 'pilot' | 'scale', window: SloWindow): number {
  const targets = deploymentTargets(phase);
  const total = window.successful + window.errors;
  if (total === 0) return 0;
  const errorRate = 1 - window.successful / total;
  const budget = 1 - targets.api;
  return errorRate / budget;
}