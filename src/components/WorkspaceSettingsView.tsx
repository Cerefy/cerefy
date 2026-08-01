import React from 'react';
import { useAgentStore } from '../store/useAgentStore';
import {
  Settings,
  Shield,
  Lock,
  UserCheck,
  Building2,
  CheckCircle2,
  Database,
} from 'lucide-react';

export const WorkspaceSettingsView: React.FC = () => {
  const { activeTenantId, activeRole, tenants } = useAgentStore();
  const currentTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase mb-1">
            <Settings className="h-4 w-4" /> Workspace Configuration &amp; Governance
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Workspace Settings &amp; Security Policy</h2>
          <p className="text-xs text-slate-400 font-mono">
            Manage tenant domain, access controls, database isolation, and active role scopes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        {/* Tenant Profile */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-400" /> Active Tenant Profile
          </h3>
          <div className="space-y-2">
            <div>
              <label className="text-slate-400 text-[10px]">Tenant Name</label>
              <input readOnly value={currentTenant.name} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-bold outline-none mt-1" />
            </div>
            <div>
              <label className="text-slate-400 text-[10px]">Domain</label>
              <input readOnly value={currentTenant.domain} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none mt-1" />
            </div>
            <div>
              <label className="text-slate-400 text-[10px]">Subscription Plan</label>
              <input readOnly value={currentTenant.tier} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-emerald-400 font-bold outline-none mt-1" />
            </div>
          </div>
        </div>

        {/* Security & RLS Status */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" /> PostgreSQL Row Level Security (RLS)
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
              <span>Active User Role</span>
              <span className="text-indigo-400 font-bold">{activeRole}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
              <span>Postgres RLS Policy</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Enforced
              </span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
              <span>Encryption KMS</span>
              <span className="text-cyan-400 font-bold">AES-256-GCM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
