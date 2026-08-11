// src/lib/featureFlags.ts
// ─────────────────────────────────────────────────────────────────────────────
// Feature flags — the §7 mechanism for shipping incomplete code to production
// WITHOUT silently changing what customers see. This is DISTINCT from
// capabilities.ts (which is the static anti-fabrication audit of "what is real
// vs planned"). Flags are runtime-switchable rollout controls:
//   - read from env (global default) merged with a per-tenant override store
//   - known-unknown default: a flag that has never been declared can never be
//     force-enabled by config — typos fail closed, not open
// ─────────────────────────────────────────────────────────────────────────────

export interface FlagDefinition {
  /** Long-lived rollout control, independent of capabilities.ts. */
  name: string;
  default: boolean;
  description: string;
}

export const FEATURE_FLAGS: FlagDefinition[] = [
  {
    name: 'reconstruction_endpoint',
    default: false,
    description: '§12 answer-provenance reconstruction API — ships to staging first, prod via flag.',
  },
  {
    name: 'outcome_linking',
    default: false,
    description: '§11.5 outcome-confirmation endpoints — pilot tenants only during Phase 1.',
  },
];

function envDefault(name: string, fallback: boolean): boolean {
  const raw = process.env[`FLAG_${name.toUpperCase()}`];
  if (raw === undefined) return fallback;
  return raw === '1' || raw.toLowerCase() === 'true' || raw.toLowerCase() === 'on';
}

export const FLAG_DEFAULTS: Record<string, boolean> = Object.fromEntries(
  FEATURE_FLAGS.map((f) => [f.name, envDefault(f.name, f.default)]),
);

export class FeatureFlagStore {
  private readonly overrides = new Map<string, Map<string, boolean>>();

  constructor(private readonly defaults: Record<string, boolean> = FLAG_DEFAULTS) {}

  /** Per-tenant override, usually populated from a config table in production. */
  setOverride(tenantId: string, flagName: string, enabled: boolean): void {
    if (!(flagName in this.defaults)) {
      throw new Error(`Unknown feature flag '${flagName}' — fail-closed, typo`);
    }
    if (!this.overrides.has(tenantId)) this.overrides.set(tenantId, new Map());
    this.overrides.get(tenantId)!.set(flagName, enabled);
  }

  clearOverrides(tenantId?: string): void {
    if (tenantId) this.overrides.delete(tenantId);
    else this.overrides.clear();
  }

  isEnabled(flagName: string, tenantId?: string): boolean {
    if (!(flagName in this.defaults)) return false; // fail closed on typo/undeclared
    if (tenantId) {
      const tenant = this.overrides.get(tenantId);
      if (tenant?.has(flagName)) return tenant.get(flagName)!;
    }
    return this.defaults[flagName];
  }

  enabledFlags(tenantId?: string): string[] {
    return Object.keys(this.defaults).filter((name) => this.isEnabled(name, tenantId));
  }
}

export const featureFlags = new FeatureFlagStore();