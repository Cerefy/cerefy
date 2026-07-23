import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BackendApi,
  type SubscriptionPlanRead,
  type SubscriptionRead,
  type InvoiceRead,
} from "@/services/backend-api.service";
import { AppShell } from "@/components/layout/AppShell";
import { Card, DataTable, Badge } from "@/components/common/primitives";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

// Use InvoiceRead from backend-api.service instead
type Invoice = InvoiceRead;

function PlanCard({
  plan,
  currentPlanId,
  onSelect,
}: {
  plan: SubscriptionPlanRead;
  currentPlanId?: string;
  onSelect: (planId: string, interval: "monthly" | "yearly") => void;
}) {
  const isCurrent = currentPlanId === plan.id;
  return (
    <div
      className={`bento-card rounded-lg p-6 flex flex-col relative ${isCurrent ? "ring-2 ring-white" : ""}`}
    >
      {isCurrent && (
        <div className="absolute top-3 right-3 bg-white text-black text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm">
          Current
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
      <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
      <div className="mb-4">
        <span className="text-3xl font-bold text-white">${plan.price_monthly}</span>
        <span className="text-muted-foreground text-sm">/mo</span>
      </div>
      <ul className="space-y-2 text-xs text-muted-foreground mb-6 flex-1">
        <li className="flex items-center gap-2">
          <Check size={14} className="text-emerald-400" /> {plan.max_users} users
        </li>
        <li className="flex items-center gap-2">
          <Check size={14} className="text-emerald-400" /> {plan.max_agents} agents
        </li>
        <li className="flex items-center gap-2">
          <Check size={14} className="text-emerald-400" />{" "}
          {plan.max_tasks_per_month.toLocaleString()} tasks/mo
        </li>
        {plan.features &&
          Object.entries(plan.features as Record<string, boolean>).map(([key, val]) => (
            <li key={key} className="flex items-center gap-2">
              {val ? <Check size={14} className="text-emerald-400" /> : <span className="w-3.5" />}
              {key.replace(/_/g, " ")}
            </li>
          ))}
      </ul>
      <button
        disabled={isCurrent}
        onClick={() => onSelect(plan.id, "monthly")}
        className={`w-full py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
          isCurrent
            ? "bg-white/5 text-muted-foreground cursor-not-allowed"
            : "bg-white text-black hover:bg-white/90"
        }`}
      >
        {isCurrent ? "Active Plan" : "Select Plan"}
      </button>
    </div>
  );
}

function CurrentSubscription({ sub }: { sub: SubscriptionRead }) {
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString()
    : "—";
  return (
    <Card title="Current Subscription">
      <div className="p-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Plan</span>
          <span className="text-white font-semibold">{sub.plan?.name ?? "Unknown"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge tone={sub.status === "active" ? "success" : "warn"}>{sub.status}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Billing</span>
          <span className="text-white">{sub.billing_interval}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Period End</span>
          <span className="text-white">{periodEnd}</span>
        </div>
        {sub.trial_end && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trial End</span>
            <span className="text-white">{new Date(sub.trial_end).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export function BillingPage() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => BackendApi.listPlans(),
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => BackendApi.getSubscription(),
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => BackendApi.listInvoices(1, 20),
  });

  const createSub = useMutation({
    mutationFn: (data: { plan_id: string; billing_interval: string }) =>
      BackendApi.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Subscription created");
      setSelectedPlan(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to create subscription"),
  });

  const handleSelect = (planId: string, billingInterval: "monthly" | "yearly") => {
    if (subscription) {
      toast.error("You already have an active subscription");
      return;
    }
    createSub.mutate({ plan_id: planId, billing_interval: billingInterval });
  };

  const invoiceColumns = [
    {
      key: "description",
      label: "Description",
      render: (row: Invoice) => <span className="text-white">{row.description ?? "Invoice"}</span>,
    },
    {
      key: "amount",
      label: "Amount",
      render: (row: Invoice) => <span className="font-mono">${row.amount.toFixed(2)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row: Invoice) => (
        <Badge
          tone={row.status === "paid" ? "success" : row.status === "pending" ? "warn" : "neutral"}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Date",
      render: (row: Invoice) => (
        <span className="font-mono text-muted-foreground text-[10px]">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "invoice_url",
      label: "",
      render: (row: Invoice) =>
        row.invoice_url ? (
          <a
            href={row.invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-brand text-[10px] font-mono hover:underline"
          >
            View
          </a>
        ) : null,
    },
  ];

  if (plansLoading) {
    return (
      <AppShell title="Billing" subtitle="Manage your subscription">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Billing" subtitle="Plans, subscription & invoices">
      {subscription && (
        <div className="mb-6">
          <CurrentSubscription sub={subscription} />
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-muted-foreground font-mono mr-2">Billing:</span>
        {(["monthly", "yearly"] as const).map((i) => (
          <button
            key={i}
            onClick={() => setInterval(i)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              interval === i
                ? "bg-white text-black"
                : "text-muted-foreground hover:text-white bg-white/5"
            }`}
          >
            {i.charAt(0).toUpperCase() + i.slice(1)}
          </button>
        ))}
      </div>

      {plans?.plans ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {plans.plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={subscription?.plan_id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground text-sm mb-10">No plans available</div>
      )}

      <Card title="Invoices">
        {invoices?.invoices && invoices.invoices.length > 0 ? (
          <DataTable columns={invoiceColumns} rows={invoices.invoices} />
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">No invoices yet</div>
        )}
      </Card>
    </AppShell>
  );
}
