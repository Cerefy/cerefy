import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Sliders,
  Settings,
  Users,
  ChevronRight,
  Sparkles,
  FileCheck,
} from 'lucide-react';

export const TenantSecurityView: React.FC = () => {
  const { tenants, activeTenantId,  } = useAgentStore();
  const navigate = useNavigate();
  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  // Toggles for AI Guardrails
  const [piiScrubbing, setPiiScrubbing] = useState(true);
  const [biasDetection, setBiasDetection] = useState(true);
  const [tokenBudgeting, setTokenBudgeting] = useState(true);

  // Search filter for audit logs
  const [logFilter, setLogFilter] = useState('');
  const [selectedDept, setSelectedDept] = useState<'Engineering' | 'Marketing' | 'SecurityOps'>('Engineering');

  const auditLogs = [
    {
      id: 'log_1',
      timestamp: '2024-05-22 14:32:01',
      actor: 'James D. (Admin)',
      action: 'Modified Guardrail Policy',
      target: 'Marketing_Agent_V2',
      status: 'SUCCESS',
    },
    {
      id: 'log_2',
      timestamp: '2024-05-22 14:30:15',
      actor: 'Cerefy_Core_Agent',
      action: 'Encrypted Memo Generation',
      target: 'Vault_Alpha_01',
      status: 'SUCCESS',
    },
    {
      id: 'log_3',
      timestamp: '2024-05-22 14:28:44',
      actor: 'Maria L.',
      action: 'Exported PII Logs',
      target: 'Audit_Repo_Global',
      status: 'DENIED',
    },
    {
      id: 'log_4',
      timestamp: '2024-05-22 14:25:10',
      actor: 'James D. (Admin)',
      action: 'KMS Key Rotation',
      target: 'Root_Master_Key',
      status: 'SUCCESS',
    },
  ];

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.actor.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.target.toLowerCase().includes(logFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-zinc-300 selection:bg-indigo-500/30">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight font-sans">
              Security &amp; Governance
            </h2>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold rounded-full border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
              ACTIVE ENFORCEMENT
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-sans">
            Centralized oversight of enterprise-grade AI safety, data protection, and regulatory alignment.
          </p>
        </div>
        <button
          onClick={() => alert('Downloading SOC2, GDPR, & HIPAA Audit Verification PDF bundle...')}
          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer self-start md:self-auto border border-zinc-700"
        >
          <Download className="h-4 w-4 text-emerald-400" />
          <span>Download Audit Reports</span>
        </button>
      </div>

      {/* Top 2 Cards: Security Posture & Key Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Security Posture */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-sans">Security Posture</h3>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold rounded border border-emerald-500/20">
              CERTIFIED
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-sans">Real-time compliance status across global frameworks.</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-center space-y-1">
              <div className="flex justify-center text-zinc-400">
                <FileCheck className="h-4 w-4" />
              </div>
              <div className="text-xs font-bold text-white">SOC2 Type II</div>
              <div className="text-[10px] font-mono text-emerald-400 font-bold">ACTIVE</div>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-center space-y-1">
              <div className="flex justify-center text-zinc-400">
                <Lock className="h-4 w-4" />
              </div>
              <div className="text-xs font-bold text-white">GDPR</div>
              <div className="text-[10px] font-mono text-emerald-400 font-bold">COMPLIANT</div>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-center space-y-1">
              <div className="flex justify-center text-zinc-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-xs font-bold text-white">HIPAA</div>
              <div className="text-[10px] font-mono text-emerald-400 font-bold">ENABLED</div>
            </div>
          </div>
        </div>

        {/* Card 2: Key Management */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white font-sans">Key Management</h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">AWS KMS / HashiCorp</span>
          </div>
          <p className="text-xs text-zinc-500 font-sans">Hardware security module (HSM) encryption &amp; secrets rotation.</p>

          <div className="space-y-2.5 text-xs font-sans">
            <div className="flex justify-between items-center p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
              <span className="font-semibold text-zinc-300">AES-256 At-Rest</span>
              <span className="text-emerald-400 font-mono text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 shadow-[0_0_8px_rgba(16,185,129,0.3)]" /> Cloud KMS Managed
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
              <span className="font-semibold text-zinc-300">TLS 1.3 In-Transit</span>
              <span className="text-emerald-400 font-mono text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 shadow-[0_0_8px_rgba(16,185,129,0.3)]" /> End-to-End Encrypted
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 cursor-pointer hover:bg-indigo-500/20 transition-colors">
              <span className="font-semibold">Bring Your Own Key (BYOK)</span>
              <span className="font-mono text-[11px] font-bold flex items-center gap-1">
                AWS/Azure/GCP Vault <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Guardrails Section */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-5 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white font-sans">AI Guardrails</h3>
            <p className="text-xs text-zinc-500 font-sans">Automated safety policies and budget control.</p>
          </div>
          <button
            onClick={() => alert('AI Guardrails updated across all active agent instances.')}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-zinc-700"
          >
            Update Policies
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Guardrail 1: PII Scrubbing */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div className="font-bold text-xs text-white">PII Scrubbing</div>
              <button
                onClick={() => setPiiScrubbing(!piiScrubbing)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  piiScrubbing ? 'bg-indigo-600' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    piiScrubbing ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
              Automatically redacts credit cards, SSNs, and private identifiers before agent processing.
            </p>
            <div className="text-[10px] font-mono text-zinc-600 pt-1 border-t border-zinc-800">
              Strictness: <span className="font-bold text-zinc-300">High</span>
            </div>
          </div>

          {/* Guardrail 2: Bias Detection */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div className="font-bold text-xs text-white">Bias Detection</div>
              <button
                onClick={() => setBiasDetection(!biasDetection)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  biasDetection ? 'bg-indigo-600' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    biasDetection ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
              Real-time monitoring for harmful outputs or discriminatory language patterns in LLM responses.
            </p>
            <div className="text-[10px] font-mono text-zinc-600 pt-1 border-t border-zinc-800">
              Sensitivity: <span className="font-bold text-zinc-300">85%</span>
            </div>
          </div>

          {/* Guardrail 3: Token Budgeting */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div className="font-bold text-xs text-white">Token Budgeting</div>
              <button
                onClick={() => setTokenBudgeting(!tokenBudgeting)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  tokenBudgeting ? 'bg-indigo-600' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    tokenBudgeting ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
              Prevents runaway agent execution by setting hard caps on API credit consumption per department.
            </p>
            <div className="text-[10px] font-mono text-zinc-600 pt-1 border-t border-zinc-800">
              Active Cap: <span className="font-bold text-zinc-300">$5,000/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white font-sans">Audit Logs</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              placeholder="Filter actions..."
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs outline-none focus:border-indigo-500 text-white font-sans"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase">
                <th className="pb-2 font-semibold">TIMESTAMP</th>
                <th className="pb-2 font-semibold">ACTOR</th>
                <th className="pb-2 font-semibold">ACTION</th>
                <th className="pb-2 font-semibold">TARGET</th>
                <th className="pb-2 font-semibold text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 font-mono text-zinc-500 text-[11px]">{log.timestamp}</td>
                  <td className="py-3 font-semibold text-zinc-200">{log.actor}</td>
                  <td className="py-3 text-zinc-400">{log.action}</td>
                  <td className="py-3 font-mono text-zinc-500 text-[11px]">{log.target}</td>
                  <td className="py-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Access Control (RBAC) */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-5 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white font-sans">Access Control (RBAC)</h3>
            <p className="text-xs text-zinc-500 font-sans">Departmental permission tiers and role mappings.</p>
          </div>
          <button
            onClick={() => alert('RBAC Manager opened for organizational role provisioning.')}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-zinc-700"
          >
            Manage All Groups
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setSelectedDept('Engineering')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedDept === 'Engineering'
                ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className={`font-bold text-xs font-sans ${selectedDept === 'Engineering' ? 'text-indigo-400' : 'text-white'}`}>Engineering Dept</div>
            <div className="text-[11px] text-zinc-500 mt-1 font-sans">8 Active Members • 12 Agents</div>
            <span className={`inline-block mt-3 px-2 py-0.5 text-[9px] font-mono font-bold rounded border ${
              selectedDept === 'Engineering' 
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              ROLE: EDITOR / ADMIN
            </span>
          </button>

          <button
            onClick={() => setSelectedDept('Marketing')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedDept === 'Marketing'
                ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className={`font-bold text-xs font-sans ${selectedDept === 'Marketing' ? 'text-indigo-400' : 'text-white'}`}>Marketing Dept</div>
            <div className="text-[11px] text-zinc-500 mt-1 font-sans">5 Active Members • 3 Agents</div>
            <span className={`inline-block mt-3 px-2 py-0.5 text-[9px] font-mono font-bold rounded border ${
              selectedDept === 'Marketing' 
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              ROLE: VIEWER
            </span>
          </button>

          <button
            onClick={() => setSelectedDept('SecurityOps')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedDept === 'SecurityOps'
                ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className={`font-bold text-xs font-sans ${selectedDept === 'SecurityOps' ? 'text-indigo-400' : 'text-white'}`}>Security Ops</div>
            <div className="text-[11px] text-zinc-500 mt-1 font-sans">2 Active Members • 1 Agent</div>
            <span className={`inline-block mt-3 px-2 py-0.5 text-[9px] font-mono font-bold rounded border ${
              selectedDept === 'SecurityOps' 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              ROLE: SECURITY OWNER
            </span>
          </button>
        </div>

        {/* Selected Department Permission Matrix */}
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 font-sans text-xs">
          <div className="font-bold text-white font-sans mb-2">
            Department Permission Preview: <span className="text-indigo-400">{selectedDept}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" /> Create New Agents
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              {selectedDept === 'SecurityOps' || selectedDept === 'Engineering' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
              )}
              Delete Knowledge Bases
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              {selectedDept === 'SecurityOps' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
              )}
              Modify Security Guardrails
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" /> View Analytics Reports
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" /> Export Data Logs
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

