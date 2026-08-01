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
    <div className="space-y-6 font-sans text-zinc-100">
      {/* Top Banner */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase mb-1">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Platform Governance Console
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight font-sans">
            Global Admin &amp; Organization Operations
          </h2>
          <p className="text-xs text-zinc-400 font-mono">
            Manage multi-tenant permissions, API keys, billing tiers, and RLS enforcement logs.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-full text-zinc-300">
            Active Orgs: <span className="text-emerald-400 font-bold">{tenants.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-full text-zinc-300">
            Monthly Billing: <span className="text-cyan-400 font-bold">$12,840</span>
          </div>
        </div>
      </div>

      {/* Admin Horizontal Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800 font-mono text-xs custom-scrollbar">
        {adminTabsList.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedAdminTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-full flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-zinc-950 font-bold shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
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
            <div key={t.id} className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">{t.id}</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                  {t.tier || 'Enterprise'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white font-sans">{t.name}</h3>
              <p className="text-zinc-400 text-[11px]">Domain: {t.domain}</p>
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">RLS Isolated: <span className="text-emerald-400">Yes</span></span>
                <button
                  onClick={() => setActiveTenantId(t.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                    activeTenantId === t.id ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
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
        <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white uppercase">User Roster &amp; Identity Management</h3>
          <div className="space-y-2">
            {[
              { email: 'montaser@acme.corp', role: 'SUPER_ADMIN', status: 'ACTIVE' },
              { email: 'sarah.cto@acme.corp', role: 'TENANT_ADMIN', status: 'ACTIVE' },
              { email: 'alex.analyst@globex.com', role: 'ANALYST', status: 'ACTIVE' },
            ].map((u, i) => (
              <div key={i} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{u.email}</div>
                  <div className="text-zinc-500 text-[10px]">Role: {u.role}</div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-bold">
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedAdminTab === 'permissions' && (
        <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white uppercase">ABAC &amp; RLS Permissions Grid</h3>
          <p className="text-zinc-400 text-xs">
            Fine-grained Attribute-Based Access Control policies linked to PostgreSQL Row Level Security.
          </p>
          <div className="space-y-2">
            {[
              { resource: 'vector_embeddings', action: 'READ', role: 'ALL_TENANTS', status: 'RLS ENFORCED' },
              { resource: 'decision_simulations', action: 'EXECUTE', role: 'TENANT_ADMIN', status: 'RLS ENFORCED' },
              { resource: 'kms_encryption_keys', action: 'WRITE', role: 'SUPER_ADMIN', status: 'SUPER_ADMIN ONLY' },
            ].map((p, i) => (
              <div key={i} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="text-indigo-400 font-bold mr-2">{p.resource}</span>
                  <span className="text-zinc-400">[{p.action}]</span>
                </div>
                <span className="text-emerald-400 text-[10px]">{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedAdminTab === 'billing' && (
        <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white uppercase">Enterprise Subscription &amp; Invoices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <div className="text-zinc-400">Current Billing Cycle</div>
              <div className="text-2xl font-black text-white">$12,840.00</div>
              <div className="text-emerald-400 text-[10px]">Autopay Active • Visa ending in 4019</div>
            </div>
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <div className="text-zinc-400">Included Tokens</div>
              <div className="text-2xl font-black text-cyan-400">10M / 15M Tokens</div>
              <div className="text-zinc-500 text-[10px]">Resets in 14 days</div>
            </div>
          </div>
        </div>
      )}

      {selectedAdminTab === 'monitoring' && (
        <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white uppercase">System Telemetry &amp; Latency</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="text-zinc-500 text-[10px]">P99 Latency</div>
              <div className="text-lg font-bold text-emerald-400">24ms</div>
            </div>
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="text-zinc-500 text-[10px]">API Gateway Health</div>
              <div className="text-lg font-bold text-cyan-400">100%</div>
            </div>
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="text-zinc-500 text-[10px]">Agent Error Rate</div>
              <div className="text-lg font-bold text-indigo-400">0.02%</div>
            </div>
          </div>
        </div>
      )}

      {selectedAdminTab === 'models' && (
        <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white uppercase">Primary AI Model Selection</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Sub-300ms speed for instant multi-agent orchestration' },
              { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Complex reasoning, legal analysis & multi-file coding' },
            ].map((m) => (
              <div
                key={m.id}
                onClick={() => handleSaveModel(m.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  savedModel === m.id ? 'bg-zinc-800 border-indigo-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">{m.name}</span>
                  {savedModel === m.id && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                </div>
                <p className="text-zinc-400 text-[11px]">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedAdminTab === 'apikeys' && (
        <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white uppercase">Master API Credentials</h3>
          <div className="space-y-2">
            <label className="text-zinc-400">Gemini Platform API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none"
              />
              <button className="px-5 py-2 bg-white text-zinc-950 font-bold rounded-xl cursor-pointer hover:bg-zinc-200">
                Rotate Key
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAdminTab === 'auditlogs' && (
        <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white uppercase">Real-Time Security &amp; Audit Logs</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-2.5 bg-zinc-950 border border-zinc-800/80 rounded-xl flex justify-between text-[11px]">
                <span className="text-zinc-400">{log.createdAt.split('T')[1]?.substring(0, 8)}</span>
                <span className="text-indigo-300 font-bold">{log.agentId}</span>
                <span className="text-emerald-400">{log.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedAdminTab === 'security' && (
        <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white uppercase">Sovereign Encryption &amp; KMS Governance</h3>
          <p className="text-zinc-300 text-xs">
            Frankfurt AWS Region Sovereign KMS keys enabled with strict multi-tenant isolate guarantees.
          </p>
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-emerald-400 font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> 100% Zero-Trust Compliance Active
          </div>
        </div>
      )}
    </div>
  );
};
