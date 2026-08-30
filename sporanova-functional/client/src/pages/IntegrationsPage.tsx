import { useWorkspace } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Plug, MessageSquare, ShoppingCart, Calendar, Mail, Webhook, Plus, XCircle } from "lucide-react";
import { useState } from "react";

const INTEGRATIONS = [
  { id: "whatsapp", name: "WhatsApp Business", icon: MessageSquare, category: "Messaging", description: "Connect WhatsApp for customer support and notifications", color: "#25D366" },
  { id: "slack", name: "Slack", icon: MessageSquare, category: "Messaging", description: "Send alerts and interact with agents via Slack", color: "#4A154B" },
  { id: "teams", name: "Microsoft Teams", icon: MessageSquare, category: "Messaging", description: "Enterprise team collaboration integration", color: "#6264A7" },
  { id: "hubspot", name: "HubSpot", icon: Plug, category: "CRM", description: "Sync contacts, deals, and customer data", color: "#FF7A59" },
  { id: "salesforce", name: "Salesforce", icon: Plug, category: "CRM", description: "Enterprise CRM integration for leads and opportunities", color: "#00A1E0" },
  { id: "zendesk", name: "Zendesk", icon: Plug, category: "Support", description: "Manage support tickets and customer inquiries", color: "#03363D" },
  { id: "shopify", name: "Shopify", icon: ShoppingCart, category: "E-Commerce", description: "Product catalog and order management", color: "#96BF48" },
  { id: "google_calendar", name: "Google Calendar", icon: Calendar, category: "Productivity", description: "Book meetings and manage schedules", color: "#4285F4" },
  { id: "webhook", name: "Webhook", icon: Webhook, category: "Developer", description: "Custom HTTP webhook integration", color: "#6B6660" },
  { id: "email", name: "Email (SMTP)", icon: Mail, category: "Communication", description: "Send and receive emails via SMTP", color: "#EA4335" },
];

export default function IntegrationsPage() {
  const { workspaceId } = useWorkspace();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({ apiKey: "", settings: "" });
  const [integrationName, setIntegrationName] = useState("");

  const { data: integrationsList, refetch: refetchIntegrations } = trpc.integrations.list.useQuery(
    { workspaceId: workspaceId! },
    { enabled: Boolean(workspaceId) }
  );
  const connectedIds = new Set((integrationsList || []).map((i: any) => i.provider));
  const integrationIdMap: Record<string, number> = {};
  for (const i of (integrationsList || []) as any[]) {
    integrationIdMap[i.provider] = i.id;
  }

  const connect = trpc.integrations.connect.useMutation({
    onSuccess: () => {
      refetchIntegrations();
      setConnecting(null);
      setCredentials({ apiKey: "", settings: "" });
      setIntegrationName("");
    },
  });

  const disconnect = trpc.integrations.disconnect.useMutation({
    onSuccess: () => {
      refetchIntegrations();
      setDisconnecting(null);
    },
  });

  const categories = ["all", ...Array.from(new Set(INTEGRATIONS.map(i => i.category)))];
  const filtered = selectedCategory === "all" ? INTEGRATIONS : INTEGRATIONS.filter(i => i.category === selectedCategory);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sn-label mb-1">Integrations</p>
          <h1 className="text-xl font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>Connect Your Stack</h1>
          <p className="mt-1 text-sm text-[#8C887F]">Connect tools and services to power your AI agents.</p>
        </div>
      </div>

      <div className="mb-4 inline-flex flex-wrap gap-2 rounded-xl bg-[#E8E6E2] p-1">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${selectedCategory === cat ? "bg-[#FAFAF8] text-[#1A1F3C] shadow-sm" : "text-[#8C887F]"}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(integration => {
          const Icon = integration.icon;
          return (
            <div key={integration.id} className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1A1F3C]/5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: `${integration.color}15` }}>
                  <Icon size={20} style={{ color: integration.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium">{integration.name}</h3>
                  <p className="mt-1 text-xs text-[#8C887F]">{integration.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-[#F4F3F0] px-2.5 py-1 text-[11px] font-medium text-[#8C887F]">{integration.category}</span>
                {connectedIds.has(integration.id) ? (
                  <button
                    onClick={() => {
                      const integrationId = integrationIdMap[integration.id];
                      if (workspaceId && integrationId) {
                        setDisconnecting(integration.id);
                        disconnect.mutate({ workspaceId, integrationId });
                      }
                    }}
                    disabled={disconnect.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    <XCircle size={12} />Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIntegrationName(integration.name);
                      setConnecting(integration.id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1A1F3C] px-3 py-2 text-xs font-medium text-[#F8F6F2] hover:bg-[#252B4A]"
                  >
                    <Plus size={12} />Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Regional Integrations */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>Regional Integrations</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-5">
            <h3 className="text-sm font-medium">🇮🇹 Italy</h3>
            <div className="mt-3 space-y-2">
              {["Zucchetti ERP", "TeamSystem", "PEC Email", "Shopify Italy"].map(name => (
                <div key={name} className="flex items-center justify-between rounded-xl bg-[#F4F3F0] px-3 py-2">
                  <span className="text-xs">{name}</span>
                  <button className="text-[11px] font-medium text-[#6B7FBF]">Configure →</button>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-5">
            <h3 className="text-sm font-medium">🇦🇪 Gulf</h3>
            <div className="mt-3 space-y-2">
              {["WhatsApp Business Gulf", "Noon Marketplace", "Salla", "Zid", "Shopify Gulf"].map(name => (
                <div key={name} className="flex items-center justify-between rounded-xl bg-[#F4F3F0] px-3 py-2">
                  <span className="text-xs">{name}</span>
                  <button className="text-[11px] font-medium text-[#6B7FBF]">Configure →</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Connect Modal */}
      {connecting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1A1F3C]/35 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#FAFAF8] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Connect {INTEGRATIONS.find(i => i.id === connecting)?.name}</h2>
              <button onClick={() => setConnecting(null)} className="rounded-lg p-2 text-[#8C887F] hover:text-[#1A1F3C]">✕</button>
            </div>
            <p className="mt-3 text-sm text-[#8C887F]">Enter your credentials to connect this integration. Credentials are encrypted at rest.</p>
            <div className="mt-5 space-y-3">
              <div>
                <label className="sn-label mb-1 block">Connection Name</label>
                <input
                  value={integrationName}
                  onChange={(e) => setIntegrationName(e.target.value)}
                  className="w-full rounded-xl bg-[#F4F3F0] px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-[#6B7FBF]"
                  placeholder="e.g. Production WhatsApp"
                />
              </div>
              <div>
                <label className="sn-label mb-1 block">API Key / Token</label>
                <input
                  type="password"
                  value={credentials.apiKey}
                  onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full rounded-xl bg-[#F4F3F0] px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-[#6B7FBF]"
                  placeholder="Enter your API key"
                />
              </div>
              <div>
                <label className="sn-label mb-1 block">Additional Settings</label>
                <input
                  value={credentials.settings}
                  onChange={(e) => setCredentials(prev => ({ ...prev, settings: e.target.value }))}
                  className="w-full rounded-xl bg-[#F4F3F0] px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-[#6B7FBF]"
                  placeholder="Webhook URL (optional)"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => { setConnecting(null); setCredentials({ apiKey: "", settings: "" }); }} className="flex-1 rounded-xl bg-[#F4F3F0] py-2.5 text-sm font-medium text-[#6B6660]">Cancel</button>
              <button
                onClick={() => {
                  if (!workspaceId) return;
                  connect.mutate({
                    workspaceId,
                    provider: connecting!,
                    name: integrationName || (INTEGRATIONS.find(i => i.id === connecting)?.name ?? ""),
                    credentials: { apiKey: credentials.apiKey, settings: credentials.settings },
                  });
                }}
                disabled={connect.isPending || !credentials.apiKey}
                className="flex-1 rounded-xl bg-[#1A1F3C] py-2.5 text-sm font-medium text-[#F8F6F2] disabled:opacity-50"
              >
                {connect.isPending ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
