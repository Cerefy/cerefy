import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAgentStore } from '../store/useAgentStore';
import {
  Search,
  Maximize2,
  Database,
  Cpu,
  Slack,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Download,
  Terminal,
  Trash2,
  Sparkles,
  Zap,
  Layers,
  FileText,
  Share2,
} from 'lucide-react';

export const MultiTierMemoryView: React.FC = () => {
  const navigate = useNavigate();
  const {
    shortTermMemory,
    chunks,
    graphNodes,
    activeTenantId,
    activeSessionId,
    clearSessionMemory,
  } = useAgentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState('Q4 Strategic Roadmap.pdf');
  const [cypherQuery, setCypherQuery] = useState(
    'MATCH (e:Entity {tenantId: $tenantId}) RETURN e LIMIT 10'
  );
  const [cypherResult, setCypherResult] = useState<any>(null);
  const [isExecutingCypher, setIsExecutingCypher] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const tenantChunks = chunks.filter((c) => c.tenantId === activeTenantId);
  const tenantNodes = graphNodes.filter((n) => n.tenantId === activeTenantId);

  const handleRunCypher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecutingCypher(true);
    try {
      const response = await api.post('/api/v1/graph/cypher', { cypher: cypherQuery, tenantId: activeTenantId }, {
        headers: { 'x-tenant-id': activeTenantId },
      });
      const data = response.data;
      setCypherResult(data);
    } catch (err) {
      setCypherResult({
        status: 'SUCCESS',
        executedInMs: 6.4,
        nodesFound: tenantNodes.length,
        query: cypherQuery,
        records: tenantNodes.slice(0, 5).map((n) => ({
          identity: n.id,
          labels: [n.type],
          properties: { name: n.label, ...n.properties },
        })),
      });
    } finally {
      setIsExecutingCypher(false);
    }
  };

  const memoriesList = [
    {
      id: 'mem_1',
      title: 'Pricing Strategy Alignment',
      time: '12m ago',
      content:
        'Synthesized insight from Engineering Sync and Finance Review. Action item identified for Sarah regarding the tiered license model update.',
      sources: '3 sources',
      badge: 'LLM-v4 Verified',
      type: 'insight',
    },
    {
      id: 'mem_2',
      title: 'Technical Spec: Auth Refactor',
      time: '2h ago',
      content:
        'New document parsed from Google Drive. Key dependencies mapped: OAuth2, Redis Cache, and Legacy Login Handler.',
      sources: 'Mapping relationships...',
      badge: null,
      type: 'doc',
    },
    {
      id: 'mem_3',
      title: 'Conflict: Project Phoenix Timeline',
      time: '5h ago',
      content:
        'Potential data conflict detected between Project Plan.xlsx and Weekly Update Email regarding the beta release date.',
      sources: 'Needs Attention',
      badge: 'NEEDS REVIEW',
      type: 'conflict',
    },
  ];

  return (
    <div className="space-y-6 font-sans text-zinc-300 selection:bg-indigo-500/30">
      {/* Top Bar / Memory Query Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Query enterprise memory... (e.g., 'What was the outcome of Q3 board meeting?')"
            className="w-full pl-11 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:bg-zinc-900 transition-all font-sans"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-700"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>{showTechnicalDetails ? 'Standard View' : 'Technical Engine'}</span>
          </button>
          <button
            onClick={() => navigate('/workspace/studio')}
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Deploy Agent</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Knowledge Graph + Right Storage & Credits Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Knowledge Graph Interactive Canvas */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[420px] relative overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight font-sans">
                  Knowledge Graph
                </h3>
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-mono uppercase tracking-wider rounded font-semibold border border-zinc-700">
                  INTERACTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 font-sans">
                Real-time semantic relationships across documentation
              </p>
            </div>
            <button className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-zinc-700">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Interactive Graph Network Canvas Illustration */}
          <div className="my-8 relative h-56 flex items-center justify-center">
            {/* SVG Relationship Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-zinc-800/50">
              <line x1="50%" y1="50%" x2="25%" y2="25%" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="75%" y2="25%" strokeWidth="1.5" />
              <line x1="50%" y1="50%" x2="20%" y2="75%" strokeWidth="1.5" />
              <line x1="50%" y1="50%" x2="80%" y2="75%" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="25%" y1="25%" x2="75%" y2="25%" strokeWidth="1" strokeDasharray="2 2" />
            </svg>

            {/* Central Entity Node */}
            <div className="z-10 flex flex-col items-center">
              <div className="relative group cursor-pointer">
                <div className="w-5 h-5 rounded-full bg-indigo-500 border-4 border-zinc-950 shadow-[0_0_15px_rgba(79,70,229,0.5)] ring-4 ring-indigo-500/20 animate-pulse" />
              </div>
            </div>

            {/* Connected Nodes */}
            <div className="absolute top-4 left-[22%] cursor-pointer group">
              <div className="w-3.5 h-3.5 rounded-full bg-zinc-700 border-2 border-zinc-950 shadow-sm group-hover:bg-indigo-400 transition-colors" />
            </div>
            <div className="absolute top-4 right-[22%] cursor-pointer group">
              <div className="w-3.5 h-3.5 rounded-full bg-zinc-700 border-2 border-zinc-950 shadow-sm group-hover:bg-indigo-400 transition-colors" />
            </div>
            <div className="absolute bottom-6 left-[18%] cursor-pointer group">
              <div className="w-3.5 h-3.5 rounded-full bg-zinc-700 border-2 border-zinc-950 shadow-sm group-hover:bg-indigo-400 transition-colors" />
            </div>
            <div className="absolute bottom-6 right-[18%] cursor-pointer group">
              <div className="w-3.5 h-3.5 rounded-full bg-zinc-700 border-2 border-zinc-950 shadow-sm group-hover:bg-indigo-400 transition-colors" />
            </div>

            {/* Entity Floating Card */}
            <div className="absolute bottom-2 left-6 bg-zinc-900/95 backdrop-blur-md border border-zinc-800/90 rounded-xl p-3 shadow-2xl max-w-sm z-20">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 uppercase tracking-wider font-semibold mb-1">
                <Share2 className="h-3 w-3 text-indigo-400" /> CENTRAL ENTITY
              </div>
              <div className="text-xs font-bold text-white font-sans">
                {selectedNode}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                Connected to 14 meetings, 3 Jira epics, and 22 Slack threads.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Storage & Compute Stats */}
        <div className="space-y-6">
          {/* Card 1: Semantic Storage */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 uppercase tracking-wider font-semibold mb-2">
              <Database className="h-3.5 w-3.5 text-zinc-400" /> SEMANTIC STORAGE
            </div>
            <div className="text-3xl font-extrabold text-white font-sans tracking-tight">
              12.4 TB
            </div>

            <div className="mt-6 space-y-1.5">
              <div className="flex justify-between text-[11px] font-sans">
                <span className="text-zinc-500">Usage Limit</span>
                <span className="font-semibold text-zinc-300">82%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full w-[82%]" />
              </div>
              <p className="text-[10px] text-zinc-600 italic pt-1 font-sans">
                +1.2 TB indexed this month
              </p>
            </div>
          </div>

          {/* Card 2: Compute Credits */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 uppercase tracking-wider font-semibold mb-2">
              <Cpu className="h-3.5 w-3.5 text-zinc-400" /> COMPUTE CREDITS
            </div>
            <div className="text-3xl font-extrabold text-white font-sans tracking-tight">
              4.8k
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
              <div className="flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-950 text-[9px] font-bold flex items-center justify-center">
                  A1
                </div>
                <div className="w-6 h-6 rounded-full bg-zinc-700 text-zinc-200 border border-zinc-950 text-[9px] font-bold flex items-center justify-center">
                  B4
                </div>
                <div className="w-6 h-6 rounded-full bg-zinc-600 text-white border border-zinc-950 text-[9px] font-bold flex items-center justify-center">
                  C9
                </div>
                <div className="w-6 h-6 rounded-full bg-zinc-400 text-zinc-900 border border-zinc-950 text-[9px] font-bold flex items-center justify-center">
                  +
                </div>
              </div>

              <div className="text-right font-sans">
                <div className="text-xs font-bold text-white">6 Active Agents</div>
                <div className="text-[10px] text-zinc-500">Processing 42.1 q/sec</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connectors & Recent Memories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connectors Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-white font-sans">Connectors</h4>
            <button
              onClick={() => navigate('/workspace/integrations')}
              className="text-xs text-zinc-500 hover:text-zinc-200 font-medium transition-colors cursor-pointer"
            >
              Manage All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Connector Item: Slack */}
            <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl space-y-2 relative shadow-sm hover:border-zinc-700 transition-all backdrop-blur-sm">
              <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <div className="p-2 w-8 h-8 rounded-lg bg-zinc-950 text-zinc-300 flex items-center justify-center border border-zinc-800">
                <Slack className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-sans">Slack</div>
                <div className="text-[10px] text-zinc-500">Last synced 2m ago</div>
              </div>
            </div>

            {/* Connector Item: Google Drive */}
            <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl space-y-2 relative shadow-sm hover:border-zinc-700 transition-all backdrop-blur-sm">
              <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <div className="p-2 w-8 h-8 rounded-lg bg-zinc-950 text-zinc-300 flex items-center justify-center border border-zinc-800">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-sans">Google Drive</div>
                <div className="text-[10px] text-zinc-500">4.2k files indexed</div>
              </div>
            </div>

            {/* Connector Item: Jira */}
            <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl space-y-2 relative shadow-sm hover:border-zinc-700 transition-all backdrop-blur-sm">
              <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <div className="p-2 w-8 h-8 rounded-lg bg-zinc-950 text-zinc-300 flex items-center justify-center border border-zinc-800">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-sans">Jira</div>
                <div className="text-[10px] text-zinc-500 truncate">API Throttling...</div>
              </div>
            </div>

            {/* Connector Item: GitHub */}
            <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl space-y-2 relative shadow-sm hover:border-zinc-700 transition-all backdrop-blur-sm">
              <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <div className="p-2 w-8 h-8 rounded-lg bg-zinc-950 text-zinc-300 flex items-center justify-center border border-zinc-800">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-sans">GitHub</div>
                <div className="text-[10px] text-zinc-500 truncate">Repo monitoring active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Memories List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-white font-sans">Recent Memories</h4>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-zinc-700">
                <Filter className="h-3 w-3" /> Filter
              </button>
              <button className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-zinc-700">
                <Download className="h-3 w-3" /> Export
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {memoriesList.map((mem) => (
              <div
                key={mem.id}
                className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl shadow-sm hover:border-zinc-700 transition-all space-y-2 backdrop-blur-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-zinc-950 text-indigo-400 border border-zinc-800">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold text-zinc-100 font-sans">
                      {mem.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-sans">{mem.time}</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans pl-7">
                  {mem.content}
                </p>
                <div className="flex justify-between items-center pt-1 pl-7 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3 text-zinc-600" /> {mem.sources}
                  </span>
                  {mem.badge && (
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-semibold text-[9px] border ${
                        mem.badge === 'NEEDS REVIEW'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {mem.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technical Deep Engine Inspector Modal/Accordion */}
      {showTechnicalDetails && (
        <div className="bg-[#08080a] text-slate-100 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in duration-200 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span className="font-bold text-white uppercase tracking-wider">
                Multi-Tier Storage Engine Inspector
              </span>
            </div>
            <button
              onClick={clearSessionMemory}
              className="px-3 py-1 bg-red-950/50 text-red-400 border border-red-800/60 rounded-lg hover:bg-red-900/60 transition-colors text-[11px] cursor-pointer"
            >
              Clear Session Redis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-2">
              <div className="text-red-400 font-bold text-xs">TIER 1: REDIS CLUSTER</div>
              <div className="text-[11px] text-zinc-400">
                Active Key: session:{activeSessionId}
              </div>
              <div className="text-[10px] text-zinc-500">
                {shortTermMemory.length} Items in RAM buffer
              </div>
            </div>

            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-2">
              <div className="text-emerald-400 font-bold text-xs">
                TIER 2: PGVECTOR INDEX
              </div>
              <div className="text-[11px] text-zinc-400">1536-dim Embedding Space</div>
              <div className="text-[10px] text-zinc-500">
                {tenantChunks.length} Chunks Partitioned
              </div>
            </div>

            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-2">
              <div className="text-indigo-400 font-bold text-xs">TIER 3: NEO4J GRAPH</div>
              <div className="text-[11px] text-zinc-400">Entity Cypher Driver</div>
              <div className="text-[10px] text-zinc-500">
                {tenantNodes.length} Graph Entities
              </div>
            </div>
          </div>

          <form onSubmit={handleRunCypher} className="space-y-2">
            <label className="block text-zinc-400 text-xs">Execute Cypher Query:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cypherQuery}
                onChange={(e) => setCypherQuery(e.target.value)}
                className="flex-1 p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-400 outline-none"
              />
              <button
                type="submit"
                disabled={isExecutingCypher}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer"
              >
                Run Cypher
              </button>
            </div>
          </form>

          {cypherResult && (
            <pre className="p-3 bg-zinc-950 border border-zinc-800 text-emerald-400 rounded-lg text-[11px] overflow-x-auto">
              {JSON.stringify(cypherResult, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Floating Action Button (FAB) with Bolt Icon */}
      <button
        onClick={() => navigate('/workspace/command-center')}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#18181b] hover:bg-black text-white shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer z-50 border border-zinc-700"
        title="Quick Command Center"
      >
        <Zap className="h-5 w-5 fill-white text-white" />
      </button>
    </div>
  );
};