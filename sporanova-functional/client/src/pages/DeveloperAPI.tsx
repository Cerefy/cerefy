import { useWorkspace } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Code, Key, Copy, Download, ExternalLink, Puzzle, Search, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function DeveloperAPI() {
  const { workspaceId } = useWorkspace();
  const [activeTab, setActiveTab] = useState<"keys" | "api" | "sdk" | "mcp">("keys");
  const [copied, setCopied] = useState(false);

  const sdk = trpc.developerApi.sdk.useQuery(undefined, { enabled: Boolean(workspaceId) && activeTab === "sdk" });
  const mcpTools = trpc.developerApi.mcpMarketplace.useQuery({ query: "" }, { enabled: Boolean(workspaceId) && activeTab === "mcp" });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sn-label mb-1">Developer Platform</p>
          <h1 className="text-xl font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>API & SDK</h1>
        </div>
      </div>

      <div className="mb-4 inline-flex gap-2 rounded-xl bg-[#E8E6E2] p-1">
        {(["keys", "api", "sdk", "mcp"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-lg px-4 py-2 text-xs font-medium capitalize transition ${activeTab === tab ? "bg-[#FAFAF8] text-[#1A1F3C] shadow-sm" : "text-[#8C887F]"}`}>
            {tab === "keys" ? "API Keys" : tab === "api" ? "REST API" : tab === "sdk" ? "SDK" : "MCP Marketplace"}
          </button>
        ))}
      </div>

      {activeTab === "keys" && (
        <div className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">API Keys</h2>
              <p className="mt-1 text-xs text-[#8C887F]">Manage API keys for programmatic access to SOPRANOVA.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-[#1A1F3C] px-3 py-2 text-xs font-medium text-[#F8F6F2] hover:bg-[#252B4A]">
              <Plus size={14} />Create Key
            </button>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-[#F4F3F0] px-4 py-3">
              <div className="flex items-center gap-3">
                <Key size={14} className="text-[#6B7FBF]" />
                <div>
                  <p className="text-sm font-medium">Production Key</p>
                  <p className="text-[11px] text-[#8C887F]">sk_live_•••••••••••••••• • Created Aug 15, 2026</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-[#EEF6F6] px-2 py-0.5 text-[10px] font-medium text-[#4A8B8C]">active</span>
                <button className="rounded-lg p-2 text-[#B8675A] hover:bg-[#FDF0EE]"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#F4F3F0] px-4 py-3">
              <div className="flex items-center gap-3">
                <Key size={14} className="text-[#8C887F]" />
                <div>
                  <p className="text-sm font-medium">Development Key</p>
                  <p className="text-[11px] text-[#8C887F]">sk_test_•••••••••••••••• • Created Aug 20, 2026</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-[#EEF6F6] px-2 py-0.5 text-[10px] font-medium text-[#4A8B8C]">active</span>
                <button className="rounded-lg p-2 text-[#B8675A] hover:bg-[#FDF0EE]"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "api" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6">
            <h2 className="text-sm font-medium">REST API Endpoints</h2>
            <p className="mt-1 text-xs text-[#8C887F]">Use these endpoints to integrate SOPRANOVA into your applications.</p>
            <div className="mt-5 space-y-3">
              {[
                { method: "GET", path: "/api/v1/agents", description: "List all agents in workspace" },
                { method: "POST", path: "/api/v1/agents", description: "Create a new agent" },
                { method: "POST", path: "/api/v1/agents/:id/chat", description: "Send a message to an agent" },
                { method: "GET", path: "/api/v1/conversations", description: "List conversations" },
                { method: "GET", path: "/api/v1/analytics/dashboard", description: "Get analytics dashboard data" },
                { method: "GET", path: "/api/v1/traces", description: "List observability traces" },
                { method: "POST", path: "/api/v1/knowledge/search", description: "Search knowledge base" },
              ].map(ep => (
                <div key={ep.path} className="flex items-center gap-3 rounded-xl bg-[#F4F3F0] px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${ep.method === "GET" ? "bg-[#4A8B8C]/10 text-[#4A8B8C]" : "bg-[#6B7FBF]/10 text-[#6B7FBF]"}`}>{ep.method}</span>
                  <code className="flex-1 text-xs font-mono">{ep.path}</code>
                  <span className="text-[11px] text-[#8C887F]">{ep.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "sdk" && (
        <div className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">JavaScript/TypeScript SDK</h2>
              <p className="mt-1 text-xs text-[#8C887F]">Use the SOPRANOVA SDK to integrate with your applications.</p>
            </div>
            <button onClick={() => sdk.data && copyToClipboard(sdk.data)} className="inline-flex items-center gap-2 rounded-xl bg-[#1A1F3C] px-3 py-2 text-xs font-medium text-[#F8F6F2] hover:bg-[#252B4A]">
              <Copy size={14} />{copied ? "Copied!" : "Copy SDK"}
            </button>
          </div>
          <pre className="mt-5 max-h-96 overflow-auto rounded-xl bg-[#1A1F3C] p-5 text-xs text-[#F8F6F2]">
            <code>{sdk.data || "Loading SDK..."}</code>
          </pre>
        </div>
      )}

      {activeTab === "mcp" && (
        <div className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">MCP Marketplace</h2>
              <p className="mt-1 text-xs text-[#8C887F]">Discover and install Model Context Protocol tools for your agents.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {mcpTools.data?.map(tool => (
              <div key={tool.name} className="rounded-xl border border-[#E8E6E2] bg-[#F4F3F0] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Puzzle size={14} className="text-[#6B7FBF]" />
                      <h3 className="text-sm font-medium">{tool.name}</h3>
                    </div>
                    <p className="mt-1 text-xs text-[#8C887F]">{tool.description}</p>
                  </div>
                  <span className="rounded-full bg-[#F0EFF8] px-2 py-0.5 text-[10px] font-medium text-[#5B6FA8]">{tool.category}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-[#8C887F]">
                  <span>by {tool.author} • v{tool.version}</span>
                  <span>{tool.downloads.toLocaleString()} downloads</span>
                </div>
                <button className="mt-3 w-full rounded-xl bg-[#1A1F3C] py-2 text-xs font-medium text-[#F8F6F2] hover:bg-[#252B4A]">Install</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
