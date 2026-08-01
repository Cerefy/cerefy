import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { useNavigate } from 'react-router-dom';
import {
  Terminal,
  Key,
  Copy,
  Plus,
  Play,
  Check,
  Cpu,
  Activity,
  Download,
  ShieldAlert,
  Code2,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';

export const SystemTelemetryView: React.FC = () => {
  const { telemetry, addTelemetrySpan } = useAgentStore();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTabCode, setActiveTabCode] = useState<'nodejs' | 'python'>('nodejs');
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<string | null>(null);
  const [resourceToggle, setResourceToggle] = useState<'compute' | 'memory'>('compute');

  const [apiKeys, setApiKeys] = useState([
    { id: 'key_1', name: 'Production_Main', key: 'sk_live_••••••••4f29', type: 'LIVE' },
    { id: 'key_2', name: 'Development_Staging', key: 'sk_test_••••••••1a88', type: 'DEV' },
  ]);

  const handleCopy = (keyStr: string, id: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleCreateApiKey = () => {
    const newKeyName = prompt('Enter API Key Label (e.g. Analytics_Service):', 'New_API_Service');
    if (newKeyName) {
      setApiKeys((prev) => [
        ...prev,
        {
          id: 'key_' + Math.random().toString(36).substring(2, 7),
          name: newKeyName,
          key: 'sk_live_••••••••' + Math.floor(Math.random() * 8999 + 1000),
          type: 'LIVE',
        },
      ]);
    }
  };

  const handleRunSandbox = () => {
    setIsSandboxRunning(true);
    setSandboxResult(null);

    setTimeout(() => {
      setIsSandboxRunning(false);
      setSandboxResult(
        `[Cerefy SDK Sandbox Executed Successfully]\n` +
          `Status: 200 OK\n` +
          `Session ID: sess_${Math.random().toString(36).substring(2, 8)}\n` +
          `Response: "Cerefy OS verified client connection. P99 Latency: 42ms. Active Agent Clusters: 4."`
      );

      addTelemetrySpan({
        service: 'DeveloperPortal',
        name: 'SDK_Sandbox_Run',
        startTime: new Date().toISOString(),
        durationMs: 42,
        status: 'OK',
        attributes: { client: activeTabCode },
      });
    }, 900);
  };

  const systemLogs = [
    {
      time: '14:22:10',
      type: 'INFO',
      msg: "Agent 'Neural-9' successfully initialized and reached ready state. (ms: 124)",
      color: 'text-gray-700',
    },
    {
      time: '14:21:45',
      type: 'WARN',
      msg: "Latency threshold exceeded for 'Vector-Search-DB' in cluster node 04. (ms: 890)",
      color: 'text-amber-600',
    },
    {
      time: '14:18:02',
      type: 'INFO',
      msg: 'Compliance audit snapshot captured for session #4829-X. (ms: 45)',
      color: 'text-gray-700',
    },
    {
      time: '14:15:22',
      type: 'ERR',
      msg: 'Failed to authenticate incoming request (invalid_bearer_token). (ms: 12)',
      color: 'text-red-600',
    },
  ];

  const jsCode = `const { CerefyClient } = require('@cerefy/sdk');

const cerefy = new CerefyClient({
  apiKey: process.env.CEREFY_API_KEY,
  tenantId: 'tenant_acme_101',
});

async function main() {
  const agent = await cerefy.agents.get('agent_ceo');
  const response = await agent.run({
    prompt: 'Query Q3 Financial Summary and generate executive briefing.',
  });
  console.log(response.output);
}

main();`;

  const pythonCode = `from cerefy import CerefyClient
import os

cerefy = CerefyClient(
    api_key=os.getenv("CEREFY_API_KEY"),
    tenant_id="tenant_acme_101"
)

agent = cerefy.agents.get("agent_ceo")
response = agent.run(
    prompt="Query Q3 Financial Summary and generate executive briefing."
)
print(response.output)`;

  return (
    <div className="space-y-6 font-sans text-zinc-300 selection:bg-indigo-500/30">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold rounded-md border border-zinc-700">
              DEVELOPER PORTAL
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold rounded-full flex items-center gap-1 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> System Operational
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight font-sans mt-1">
            Technical Overview &amp; System Telemetry
          </h2>
          <p className="text-xs text-zinc-500 font-sans">
            Manage production environments, API keys, and monitor real-time orchestration health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Exporting raw system telemetry logs (JSON format)...')}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-zinc-700"
          >
            <Download className="h-3.5 w-3.5" /> Export Logs
          </button>
          <button
            onClick={handleCreateApiKey}
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-indigo-600" />
            <span>New API Key</span>
          </button>
        </div>
      </div>

      {/* Top Grid: System Health Logs & Active API Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health Logs */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-bold text-white font-sans">System Health Logs</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">LAST 24H • US-EAST-1</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs max-h-56 overflow-y-auto pr-1">
            {systemLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl leading-relaxed space-y-0.5"
              >
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-zinc-500">{log.time}</span>
                  <span className={`font-bold ${log.color.replace('text-gray-700', 'text-zinc-300').replace('text-amber-600', 'text-amber-400').replace('text-red-600', 'text-red-400')}`}>[{log.type}]</span>
                </div>
                <div className="text-zinc-300 text-[11px] font-sans">{log.msg}</div>
              </div>
            ))}
          </div>

          <div className="pt-1 border-t border-zinc-800 text-right">
            <button
              onClick={() => alert('Opening raw streaming socket logs...')}
              className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              VIEW FULL STREAM &rarr;
            </button>
          </div>
        </div>

        {/* Active API Keys */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-sans">Active API Keys</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{apiKeys.length} Keys Active</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-100 font-sans">{k.name}</span>
                      <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-[9px] rounded font-bold border border-zinc-700">
                        {k.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{k.key}</div>
                  </div>

                  <button
                    onClick={() => handleCopy(k.key, k.id)}
                    className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors cursor-pointer"
                    title="Copy API Key"
                  >
                    {copiedKey === k.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security Note */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-amber-200 font-sans flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Security Note: Keep your API keys private. Cerefy will never ask for them via email.</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Resource Allocation & SDK Snippet Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Allocation */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white font-sans">Resource Allocation</h3>
            <div className="flex bg-zinc-950 p-1 rounded-xl font-mono text-xs border border-zinc-800">
              <button
                onClick={() => setResourceToggle('compute')}
                className={`px-3 py-1 rounded-lg cursor-pointer ${
                  resourceToggle === 'compute' ? 'bg-zinc-800 font-bold text-white shadow-sm' : 'text-zinc-500'
                }`}
              >
                Compute
              </button>
              <button
                onClick={() => setResourceToggle('memory')}
                className={`px-3 py-1 rounded-lg cursor-pointer ${
                  resourceToggle === 'memory' ? 'bg-zinc-800 font-bold text-white shadow-sm' : 'text-zinc-500'
                }`}
              >
                Memory
              </button>
            </div>
          </div>

          {/* Daily Bar Chart */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-zinc-800">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
              const height = [45, 60, 75, 50, 90, 40, 30][i];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className="w-full bg-indigo-600/60 rounded-t hover:bg-indigo-500 transition-all border-t border-x border-indigo-500/30"
                    style={{ height: `${height}%` }}
                    title={`${day}: ${height}% Allocation`}
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">{day}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs font-sans text-zinc-500 pt-1">
            <span>AVG LATENCY: <strong className="text-zinc-300 font-mono">42ms</strong></span>
            <span>TOKEN USAGE: <strong className="text-zinc-300 font-mono">1.2M</strong></span>
          </div>
        </div>

        {/* SDK Code Snippet Sandbox */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between backdrop-blur-sm">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-sans">SDK Integration</h3>
              </div>

              <div className="flex bg-zinc-950 p-1 rounded-xl font-mono text-xs border border-zinc-800">
                <button
                  onClick={() => setActiveTabCode('nodejs')}
                  className={`px-3 py-1 rounded-lg cursor-pointer ${
                    activeTabCode === 'nodejs' ? 'bg-zinc-800 font-bold text-white shadow-sm' : 'text-zinc-500'
                  }`}
                >
                  Node.js
                </button>
                <button
                  onClick={() => setActiveTabCode('python')}
                  className={`px-3 py-1 rounded-lg cursor-pointer ${
                    activeTabCode === 'python' ? 'bg-zinc-800 font-bold text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            <div className="bg-[#08080a] text-emerald-400 rounded-xl p-4 font-mono text-xs overflow-x-auto shadow-inner border border-zinc-800 leading-relaxed">
              <pre>{activeTabCode === 'nodejs' ? jsCode : pythonCode}</pre>
            </div>
          </div>

          {sandboxResult && (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl font-mono text-[11px] text-emerald-400 whitespace-pre-wrap">
              {sandboxResult}
            </div>
          )}

          <button
            onClick={handleRunSandbox}
            disabled={isSandboxRunning}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>{isSandboxRunning ? 'Executing Sandbox...' : 'Run Sandbox'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
