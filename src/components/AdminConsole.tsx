import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import {
  ShieldCheck,
  Building2,
  Cpu,
  Key,
  BarChart2,
  Users,
  Lock,
  CreditCard,
  Activity,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Layers,
  Sliders,
} from 'lucide-react';

export const AdminConsole: React.FC = () => {
  const { tenants, activeTenantId, setActiveTenantId, addLog, logs } = useAgentStore();
  const [selectedAdminTab, setSelectedAdminTab] = useState<
    | 'organizations'
    | 'users'
    | 'permissions'
    | 'billing'
    | 'monitoring'
    | 'models'
    | 'apikeys'
    | 'auditlogs'
    | 'security'
  >('organizations');

  const [apiKey, setApiKey] = useState('sk-prod-94028401824-gemini-v2-active');
  const [savedModel, setSavedModel] = useState('gemini-2.5-flash');

  const handleSaveModel = (m: string) => {
    setSavedModel(m);
    addLog({
      tenantId: activeTenantId,
      agentId: 'agent_admin',
      executionTimeMs: 120,
      status: 'SUCCESS',
      inputPayload: { model: m },
      outputPayload: { message: `Global AI Model updated to ${m}` },
    });
  };

  const adminTabsList = [
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'permissions', label: 'Permissions', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'models', label: 'AI Models', icon: Cpu },
    { id: 'apikeys', label: 'API Keys', icon: Key },
    { id: 'auditlogs', label: 'Audit Logs', icon: FileText },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ] as const;

  return (
    <div className="space-y-6 font-sans text-dark-text-bright">
      {/* Top Banner */}
      <div className="bg-dark-panel/90 border border-dark-panel-raised p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-signal-strong font-mono text-xs font-bold uppercase mb-1">
            <ShieldCheck className="h-4 w-4 text-emerald-signal-strong" /> Platform Governance Console
          </div>
          <h2 className="text-xl font-bold text-dark-text-bright tracking-tight font-sans">
            Global Admin &amp; Organization Operations
          </h2>
          <p className="text-xs text-dark-muted-strong font-mono">
            Manage multi-tenant permissions, API keys, billing tiers, and RLS enforcement logs.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 bg-dark-panel-deep border border-dark-panel-raised rounded-full text-dark-text-muted">
            Active Orgs: <span className="text-emerald-signal-strong font-bold">{tenants.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-dark-panel-deep border border-dark-panel-raised rounded-full text-dark-text-muted">
            Monthly Billing: <span className="text-cyan-signal-strong font-bold">$12,840</span>
          </div>
        </div>
      </div>

      {/* Admin Horizontal Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-dark-panel-raised font-mono text-xs custom-scrollbar">
        {adminTabsList.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedAdminTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-full flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-dark-text-bright text-dark-panel-deep font-bold shadow-md'
                  : 'text-dark-muted-strong hover:text-dark-text-bright hover:bg-dark-panel border border-transparent'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {selectedAdminTab === 'organizations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          {tenants.map((t) => (
            <div key={t.id} className="bg-dark-panel/80 p-5 rounded-2xl border border-dark-panel-raised space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-dark-muted">{t.id}</span>
                <span className="px-2 py-0.5 bg-emerald-signal/10 text-emerald-signal-strong border border-emerald-signal/30 rounded text-[10px] font-bold">
                  {t.tier || 'Enterprise'}
                </span>
              </div>
              <h3 className="text-base font-bold text-dark-text-bright font-sans">{t.name}</h3>
              <p className="text-dark-muted-strong text-[11px]">Domain: {t.domain}</p>
              <div className="pt-3 border-t border-dark-panel-raised flex items-center justify-between">
                <span className="text-dark-muted-strong">RLS Isolated: <span className="text-emerald-signal-strong">Yes</span></span>
                <button
                  onClick={() => setActiveTenantId(t.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                    activeTenantId === t.id ? 'bg-indigo-signal-deep text-dark-text-bright' : 'bg-dark-panel-raised text-dark-text-muted hover:bg-dark-panel-soft'
                  }`}
                >
                  {activeTenantId === t.id ? 'Selected' : 'Switch Org'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAdminTab === 'users' && (
        <div className="bg-dark-panel/80 p-6 rounded-2xl border border-dark-panel-raised space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-dark-text-bright uppercase">User Roster &amp; Identity Management</h3>
          <div className="space-y-2">
            {[
              { email: 'montaser@acme.corp', role: 'SUPER_ADMIN', status: 'ACTIVE' },
              { email: 'sarah.cto@acme.corp', role: 'TENANT_ADMIN', status: 'ACTIVE' },
              { email: 'alex.analyst@globex.com', role: 'ANALYST', status: 'ACTIVE' },
            ].map((u, i) => (
              <div key={i} className="p-3 bg-dark-panel-deep rounded-xl border border-dark-panel-raised flex items-center justify-between">
                <div>
                  <div className="font-bold text-dark-text-bright">{u.email}</div>
                  <div className="text-dark-muted text-[10px]">Role: {u.role}</div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-signal/10 text-emerald-signal-strong rounded text-[10px] font-bold">
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedAdminTab === 'permissions' && (
        <div className="bg-dark-panel/80 p-6 rounded-2xl border border-dark-panel-raised space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-dark-text-bright uppercase">ABAC &amp; RLS Permissions Grid</h3>
          <p className="text-dark-muted-strong text-xs">
            Fine-grained Attribute-Based Access Control policies linked to PostgreSQL Row Level Security.
          </p>
          <div className="space-y-2">
            {[
              { resource: 'vector_embeddings', action: 'READ', role: 'ALL_TENANTS', status: 'RLS ENFORCED' },
              { resource: 'decision_simulations', action: 'EXECUTE', role: 'TENANT_ADMIN', status: 'RLS ENFORCED' },
              { resource: 'kms_encryption_keys', action: 'WRITE', role: 'SUPER_ADMIN', status: 'SUPER_ADMIN ONLY' },
            ].map((p, i) => (
              <div key={i} className="p-3 bg-dark-panel-deep rounded-xl border border-dark-panel-raised flex justify-between items-center">
                <div>
                  <span className="text-indigo-signal-strong font-bold me-2">{p.resource}</span>
                  <span className="text-dark-muted-strong">[{p.action}]</span>
                </div>
                <span className="text-emerald-signal-strong text-[10px]">{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedAdminTab === 'billing' && (
        <div className="bg-dark-panel/80 p-6 rounded-2xl border border-dark-panel-raised space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-dark-text-bright uppercase">Enterprise Subscription &amp; Invoices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-dark-panel-deep rounded-2xl border border-dark-panel-raised space-y-2">
              <div className="text-dark-muted-strong">Current Billing Cycle</div>
              <div className="text-2xl font-black text-dark-text-bright">$12,840.00</div>
              <div className="text-emerald-signal-strong text-[10px]">Autopay Active • Visa ending in 4019</div>
            </div>
            <div className="p-4 bg-dark-panel-deep rounded-2xl border border-dark-panel-raised space-y-2">
              <div className="text-dark-muted-strong">Included Tokens</div>
              <div className="text-2xl font-black text-cyan-signal-strong">10M / 15M Tokens</div>
              <div className="text-dark-muted text-[10px]">Resets in 14 days</div>
            </div>
          </div>
        </div>
      )}

      {selectedAdminTab === 'monitoring' && (
        <div className="bg-dark-panel/80 p-6 rounded-2xl border border-dark-panel-raised space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-dark-text-bright uppercase">System Telemetry &amp; Latency</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-dark-panel-deep rounded-2xl border border-dark-panel-raised">
              <div className="text-dark-muted text-[10px]">P99 Latency</div>
              <div className="text-lg font-bold text-emerald-signal-strong">24ms</div>
            </div>
            <div className="p-4 bg-dark-panel-deep rounded-2xl border border-dark-panel-raised">
              <div className="text-dark-muted text-[10px]">API Gateway Health</div>
              <div className="text-lg font-bold text-cyan-signal-strong">100%</div>
            </div>
            <div className="p-4 bg-dark-panel-deep rounded-2xl border border-dark-panel-raised">
              <div className="text-dark-muted text-[10px]">Agent Error Rate</div>
              <div className="text-lg font-bold text-indigo-signal-strong">0.02%</div>
            </div>
          </div>
        </div>
      )}

      {selectedAdminTab === 'models' && (
        <div className="bg-dark-panel/80 p-6 rounded-2xl border border-dark-panel-raised space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-dark-text-bright uppercase">Primary AI Model Selection</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Sub-300ms speed for instant multi-agent orchestration' },
              { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Complex reasoning, legal analysis & multi-file coding' },
            ].map((m) => (
              <div
                key={m.id}
                onClick={() => handleSaveModel(m.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  savedModel === m.id ? 'bg-dark-panel-raised border-indigo-signal text-dark-text-bright' : 'bg-dark-panel-deep border-dark-panel-raised text-dark-muted-strong'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-dark-text-bright">{m.name}</span>
                  {savedModel === m.id && <CheckCircle2 className="h-4 w-4 text-emerald-signal-strong" />}
                </div>
                <p className="text-dark-muted-strong text-[11px]">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedAdminTab === 'apikeys' && (
        <div className="bg-dark-panel/80 p-6 rounded-2xl border border-dark-panel-raised space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-dark-text-bright uppercase">Master API Credentials</h3>
          <div className="space-y-2">
            <label className="text-dark-muted-strong">Gemini Platform API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 bg-dark-panel-deep border border-dark-panel-raised rounded-xl p-2.5 text-dark-text-bright outline-none"
              />
              <button className="px-5 py-2 bg-dark-text-bright text-dark-panel-deep font-bold rounded-xl cursor-pointer hover:bg-dark-text">
                Rotate Key
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAdminTab === 'auditlogs' && (
        <div className="bg-dark-panel/80 p-6 rounded-2xl border border-dark-panel-raised space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-dark-text-bright uppercase">Real-Time Security &amp; Audit Logs</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-2.5 bg-dark-panel-deep border border-dark-panel-raised/80 rounded-xl flex justify-between text-[11px]">
                <span className="text-dark-muted-strong">{log.createdAt.split('T')[1]?.substring(0, 8)}</span>
                <span className="text-indigo-signal-soft font-bold">{log.agentId}</span>
                <span className="text-emerald-signal-strong">{log.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedAdminTab === 'security' && (
        <div className="bg-dark-panel/80 p-6 rounded-2xl border border-dark-panel-raised space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-dark-text-bright uppercase">Sovereign Encryption &amp; KMS Governance</h3>
          <p className="text-dark-text-muted text-xs">
            Frankfurt AWS Region Sovereign KMS keys enabled with strict multi-tenant isolate guarantees.
          </p>
          <div className="p-4 bg-dark-panel-deep border border-dark-panel-raised rounded-2xl text-emerald-signal-strong font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> 100% Zero-Trust Compliance Active
          </div>
        </div>
      )}
    </div>
  );
};
