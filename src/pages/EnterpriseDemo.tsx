import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, Badge } from "@/components/common/primitives";
import { toast } from "sonner";
import type { ElementType } from "react";
import {
  Loader2,
  Play,
  Building2,
  TrendingUp,
  Shield,
  Lightbulb,
  Activity,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  EnterpriseDemoService,
  type DemoProblem,
  type DemoRecommendation,
  type DemoStepResult,
} from "@/services/enterprise-demo.service";

const DEMO_STEPS = [
  {
    key: "problem",
    label: "1. Detect Problems",
    icon: AlertTriangle,
    description: "Surface revenue, compliance, and cash-flow risks",
  },
  {
    key: "analysis",
    label: "2. AI Analysis",
    icon: BarChart3,
    description: "Read the company knowledge graph and metrics",
  },
  {
    key: "executive",
    label: "3. Executive Team",
    icon: Building2,
    description: "CEO → CFO → COO → Risk agents reason together",
  },
  {
    key: "recommendations",
    label: "4. Recommendations",
    icon: Lightbulb,
    description: "Generate prioritized, actionable insights",
  },
  {
    key: "impact",
    label: "5. Business Impact",
    icon: TrendingUp,
    description: "Quantify time saved and decisions improved",
  },
];

export function EnterpriseDemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [stepData, setStepData] = useState<Record<string, DemoStepResult>>({});
  const [demoStarted, setDemoStarted] = useState(false);
  const [status, setStatus] = useState<{ nodes_count: number; vector_count: number } | null>(null);

  useEffect(() => {
    EnterpriseDemoService.getStatus()
      .then((s) => {
        setSeeded(s.is_seeded);
        setStatus({ nodes_count: s.nodes_count, vector_count: s.vector_count });
      })
      .catch(() => {
        // Ignore status errors; the demo will seed on start.
      });
  }, []);

  const runStep = async (step: string) => {
    setLoading(true);
    try {
      const data = await EnterpriseDemoService.runStep(step);
      setStepData((prev) => ({ ...prev, [step]: data }));
      setCurrentStep(DEMO_STEPS.findIndex((s) => s.key === step));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Demo step failed");
    } finally {
      setLoading(false);
    }
  };

  const startDemo = async () => {
    setDemoStarted(true);
    setStepData({});
    setCurrentStep(0);
    setLoading(true);

    try {
      await EnterpriseDemoService.seedDemo();
      setSeeded(true);
      const freshStatus = await EnterpriseDemoService.getStatus();
      setStatus({ nodes_count: freshStatus.nodes_count, vector_count: freshStatus.vector_count });
    } catch {
      // Continue even if seed fails; fallback data exists on the backend.
    }

    for (let i = 0; i < DEMO_STEPS.length; i++) {
      setCurrentStep(i);
      await runStep(DEMO_STEPS[i].key);
      await new Promise((r) => setTimeout(r, 600));
    }

    setCurrentStep(DEMO_STEPS.length);
    toast.success("Demo complete — NovaPay intelligence pipeline finished");
  };

  const resetDemo = () => {
    setDemoStarted(false);
    setStepData({});
    setCurrentStep(0);
  };

  const progress = demoStarted
    ? Math.min(100, Math.round((Object.keys(stepData).length / DEMO_STEPS.length) * 100))
    : 0;

  return (
    <AppShell
      title="Hub71 AI Demo — NovaPay"
      subtitle="End-to-end business intelligence in under 5 minutes"
    >
      {/* Hero */}
      <div className="mb-8 rounded-xl border border-border bg-gradient-to-br from-secondary/30 to-background p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-primary-brand" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary-brand">
                Hub71 AI Demo Day
              </span>
            </div>
            <h1 className="text-2xl font-display text-white mb-2">
              See EyeX analyze a real company in real time
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Watch our multi-agent system ingest NovaPay’s business data, detect risks, run a
              virtual CEO/CFO/COO/Risk team, and deliver prioritized recommendations — all in one
              continuous flow.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!demoStarted ? (
              <button
                onClick={startDemo}
                disabled={loading}
                className="bg-white text-black text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-md flex items-center gap-2 hover:bg-white/90 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                Start Demo
              </button>
            ) : (
              <button
                onClick={resetDemo}
                disabled={loading}
                className="border border-border text-white text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-md flex items-center gap-2 hover:bg-secondary/40 transition disabled:opacity-50"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        {demoStarted && (
          <div className="mt-6">
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              <span>Pipeline progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-brand transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-1">
          <Card title="Demo Pipeline">
            <div className="p-5 space-y-1">
              {DEMO_STEPS.map((step, i) => {
                const completed = !!stepData[step.key];
                const active = currentStep === i && loading && demoStarted;
                const Icon = step.icon;
                return (
                  <div
                    key={step.key}
                    className={`flex items-start gap-3 px-3 py-3 rounded-md transition-all ${
                      completed ? "bg-white/5" : ""
                    } ${active ? "border border-white/10" : ""}`}
                  >
                    <div className="mt-0.5">
                      {completed ? (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                      ) : active ? (
                        <Loader2 size={18} className="animate-spin text-white shrink-0" />
                      ) : (
                        <Icon size={18} className="text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-white font-medium">{step.label}</div>
                      <div className="text-[10px] text-muted-foreground">{step.description}</div>
                    </div>
                    {completed && i < DEMO_STEPS.length - 1 && (
                      <ChevronRight size={14} className="text-muted-foreground ml-auto" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-5 pb-5">
              <div className="rounded-md border border-border/50 bg-secondary/20 p-3 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Scenario
                </div>
                <div className="text-xs text-white">NovaPay Technologies</div>
                <div className="text-[10px] text-muted-foreground">
                  Fintech / Series A / 45 employees / 7 markets
                </div>
                {status && (
                  <div className="pt-2 mt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground">
                    <div>{status.nodes_count} KG nodes</div>
                    <div>{status.vector_count} vectors</div>
                  </div>
                )}
                {seeded && (
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1">
                    <CheckCircle2 size={10} /> Data seeded
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Output */}
        <div className="lg:col-span-2 space-y-6">
          {!demoStarted && (
            <Card title="Ready to start">
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Play size={28} className="text-white" />
                </div>
                <p className="text-sm text-white mb-2">Click “Start Demo” to run the pipeline</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  The demo takes ~60 seconds and will surface real problems, run the AI executive
                  team, and quantify business impact using the NovaPay scenario.
                </p>
              </div>
            </Card>
          )}

          {demoStarted && DEMO_STEPS.map((step) => renderStepCard(step, stepData[step.key]))}

          {demoStarted && progress === 100 && (
            <Card title="Demo complete">
              <div className="p-6 text-center">
                <p className="text-sm text-white mb-4">
                  NovaPay intelligence pipeline finished. {Object.keys(stepData).length} of{" "}
                  {DEMO_STEPS.length} steps completed.
                </p>
                <button
                  onClick={resetDemo}
                  className="border border-border text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-md hover:bg-secondary/40 transition"
                >
                  Run Again
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function renderStepCard(step: (typeof DEMO_STEPS)[number], data: DemoStepResult | undefined) {
  if (!data) {
    return (
      <Card key={step.key} title={step.label}>
        <div className="p-6 flex items-center gap-3 text-muted-foreground text-sm">
          <Loader2 size={16} className="animate-spin" />
          <span>Running {step.label.toLowerCase()}...</span>
        </div>
      </Card>
    );
  }

  const title = "company" in data && data.company ? `${data.company} — ${step.label}` : step.label;

  return (
    <Card key={step.key} title={title}>
      <div className="p-5">
        {data.step === "problem" && "problems" in data && data.problems && (
          <div className="space-y-3">
            {data.problems.map((p: DemoProblem, i: number) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border border-border rounded-lg p-4"
              >
                <Badge tone="danger">{p.area}</Badge>
                <div className="flex-1">
                  <div className="text-xs text-white font-medium">{p.problem}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Impact: {p.impact}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.step === "analysis" && "metrics" in data && (
          <div className="space-y-4">
            {data.metrics && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(data.metrics).map(([k, v]) => (
                  <div key={k} className="border border-border rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      {k.replace(/_/g, " ")}
                    </div>
                    <div className="text-sm text-white font-mono">{String(v)}</div>
                  </div>
                ))}
              </div>
            )}
            {"context" in data && data.context && (
              <div className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3">
                {data.context}
              </div>
            )}
          </div>
        )}

        {data.step === "executive" && "ceo" in data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ExecutiveCard
              role="CEO"
              tone="info"
              text={data.ceo?.strategic_vision}
              icon={Building2}
            />
            <ExecutiveCard
              role="CFO"
              tone="success"
              text={data.cfo?.financial_health_assessment}
              icon={BarChart3}
            />
            <ExecutiveCard
              role="COO"
              tone="warn"
              text={data.coo?.operational_efficiency}
              icon={Activity}
            />
            <ExecutiveCard
              role="Risk"
              tone="danger"
              text={
                data.risk?.overall_risk_score !== undefined
                  ? `Overall risk score: ${(data.risk.overall_risk_score * 100).toFixed(0)}%`
                  : undefined
              }
              subtext={data.risk?.key_risks?.join(" • ")}
              icon={Shield}
            />
          </div>
        )}

        {data.step === "recommendations" && "insights" in data && data.insights && (
          <div className="space-y-3">
            {data.insights.map((ins: DemoRecommendation, i: number) => (
              <div key={i} className="flex items-start gap-3 border border-border rounded-lg p-4">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    ins.severity === "critical" || ins.severity === "high"
                      ? "bg-red-400"
                      : ins.severity === "medium"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                  }`}
                />
                <div>
                  <div className="text-xs text-white font-medium">{ins.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{ins.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.step === "impact" && "analytics" in data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <ImpactMetric
                value={String(
                  (data.analytics as Record<string, { total?: number }>)?.problems_detected
                    ?.total ?? 0,
                )}
                label="Problems Detected"
              />
              <ImpactMetric
                value={String(
                  (data.analytics as Record<string, { total?: number }>)?.recommendations_generated
                    ?.total ?? 0,
                )}
                label="Recommendations"
              />
              <ImpactMetric
                value={`${(data.analytics as Record<string, number>)?.estimated_time_saved_hours ?? 0}h`}
                label="Time Saved"
              />
              <ImpactMetric
                value={`${(data.analytics as Record<string, number>)?.business_impact_score ?? 0}%`}
                label="Impact Score"
              />
            </div>
            {"message" in data && data.message && <div className="text-xs text-muted-foreground">{data.message}</div>}
          </div>
        )}
      </div>
    </Card>
  );
}

function ExecutiveCard({
  role,
  text,
  subtext,
  icon: Icon,
  tone,
}: {
  role: string;
  text?: string;
  subtext?: string;
  icon: ElementType;
  tone: "info" | "success" | "warn" | "danger";
}) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-primary-brand" />
        <span className="text-xs font-bold uppercase tracking-wider text-primary-brand">
          {role}
        </span>
        <div className="ml-auto">
          <Badge tone={tone}>{role}</Badge>
        </div>
      </div>
      <div className="text-xs text-white min-h-[3rem]">{text || "No output available"}</div>
      {subtext && <div className="text-[10px] text-muted-foreground mt-2">{subtext}</div>}
    </div>
  );
}

function ImpactMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-border rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
