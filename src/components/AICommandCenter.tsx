import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../store/useAgentStore';
import { LogoIcon } from './LogoIcon';
import {
  Sparkles,
  Search,
  PlusCircle,
  TrendingUp,
  FileText,
  Workflow,
  Bot,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  Activity,
  Play,
  Scale,
  BrainCircuit,
  MessageSquare,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react';

export const AICommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const {
    agents,
    decisions,
    projects,
    tasks,
    runDecisionSimulation,
    approveDecision,
    setExecutionPlan,
    setIsExecuting,
    addLog,
  } = useAgentStore();

  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleAskAI = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setAiResponse(null);

    setTimeout(() => {
      setIsSearching(false);
      setAiResponse(
        `AI Synthesis for "${query}": Found 14 linked projects, 3 active SOC2 documents, and Q2 Financial Ledger ($4.07M revenue). Recommendation: DACH region launch has 94% confidence score and $+4.25M expected ARR.`
      );
      addLog({
        tenantId: 'tenant_acme_101',
        agentId: 'agent_ceo',
        executionTimeMs: 310,
        status: 'SUCCESS',
        inputPayload: { query },
        outputPayload: { response: 'Search Everything Synthesis Executed' },
      });
    }, 600);
  };

  const handleQuickAction = (actionName: string) => {
    setIsExecuting(true);
    setExecutionPlan({
      id: 'plan_' + Math.random().toString(36).substring(2, 9),
      query: `Executing Quick Action: ${actionName}`,
      tenantId: 'tenant_acme_101',
      sessionId: 'sess_cmd_center',
      status: 'completed',
      currentStepIndex: 3,
      steps: [
        {
          id: 's1',
          agentName: 'CEO Executive AI',
          agentRole: 'Planner',
          status: 'completed',
          timestamp: new Date().toISOString(),
          input: `Action: ${actionName}`,
          output: `Plan generated for ${actionName}`,
        },
        {
          id: 's2',
          agentName: 'CTO Architecture AI',
          agentRole: 'Reasoner',
          status: 'completed',
          timestamp: new Date().toISOString(),
          input: 'Verify RLS and SOC2 compliance',
          output: 'Constraints passed with 100% confidence',
        },
      ],
      finalResponse: `Action "${actionName}" initialized and executed successfully across multi-agent network.`,
      reflectionCount: 1,
    });

    setTimeout(() => {
      setIsExecuting(false);
      if (actionName.includes('Project')) navigate('/workspace/projects');
      else if (actionName.includes('Workflow')) navigate('/workspace/studio');
      else if (actionName.includes('Sales')) navigate('/workspace/analytics');
      else if (actionName.includes('PRD')) navigate('/workspace/knowledge');
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Everything Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#080E38] rounded-xl border border-indigo-900/50 shadow-lg shadow-indigo-600/20">
              <LogoIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Good Morning, Montaser
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                AI Command Center • Universal Enterprise Intelligence Hub
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold rounded-full items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Company Health: 94% Optimal
          </span>
        </div>

        {/* Big Omnipresent Search Input */}
        <form onSubmit={handleAskAI} className="relative">
          <div className="flex items-center bg-slate-950/90 border border-slate-700 focus-within:border-cyan-400 rounded-xl px-4 py-3 shadow-inner transition-all">
            <Search className="h-5 w-5 text-indigo-400 mr-3 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Everything... (e.g. 'Should we launch in Germany?', 'Generate PRD', 'Check SOC2 status')"
              className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-500 font-medium"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="ml-3 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-mono font-medium text-xs rounded-lg transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSearching ? (
                <>
                  <Activity className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  <span>Execute Search</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* AI Answer Stream Box */}
        {aiResponse && (
          <div className="mt-4 p-4 bg-slate-950/80 border border-indigo-500/40 rounded-xl text-xs font-mono text-indigo-200 animate-fade-in flex items-start gap-3">
            <BrainCircuit className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-cyan-300 font-bold block mb-1">AI UNIVERSAL SYNTHESIS RESULT:</span>
              <p className="text-slate-200 leading-relaxed">{aiResponse}</p>
            </div>
          </div>
        )}

        {/* Executive Metrics Overview Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider mb-1">Company Health</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">94%</div>
            <div className="text-[10px] text-emerald-500/80 font-mono">↑ 2.4% vs last week</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider mb-1">Q2 Revenue</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">$4,070,000</div>
            <div className="text-[10px] text-cyan-400/80 font-mono">↑ 12% MoM growth</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider mb-1">Active Projects</div>
            <div className="text-xl font-bold text-indigo-300 font-mono">14 Active</div>
            <div className="text-[10px] text-indigo-400/80 font-mono">3 Lead by CEO Agent</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider mb-1">Open Decisions</div>
            <div className="text-xl font-bold text-amber-300 font-mono">{decisions.filter(d=>d.status==='OPEN').length} Pending</div>
            <div className="text-[10px] text-amber-400/80 font-mono">Germany Expansion #1</div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons Stream */}
      <div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          Quick Actions (Direct Command Launchers)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: '▶ Create Project', action: 'Create Project', icon: PlusCircle, color: 'hover:border-indigo-500 text-indigo-300' },
            { label: '▶ Analyze Sales', action: 'Analyze Sales', icon: TrendingUp, color: 'hover:border-cyan-500 text-cyan-300' },
            { label: '▶ Generate PRD', action: 'Generate PRD', icon: FileText, color: 'hover:border-emerald-500 text-emerald-300' },
            { label: '▶ Ask AI', action: 'Ask AI', icon: Sparkles, color: 'hover:border-amber-500 text-amber-300' },
            { label: '▶ Start Workflow', action: 'Start Workflow', icon: Workflow, color: 'hover:border-purple-500 text-purple-300' },
            { label: '▶ Search Company', action: 'Search Company', icon: Search, color: 'hover:border-blue-500 text-blue-300' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleQuickAction(item.action)}
                className={`bg-slate-900 border border-slate-800 ${item.color} p-3 rounded-xl flex flex-col items-start gap-2 transition-all hover:bg-slate-850 hover:shadow-lg cursor-pointer group text-left`}
              >
                <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-current transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-mono font-bold text-white group-hover:translate-x-0.5 transition-transform">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active AI Agents Grid & Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active AI Agents roster preview */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Active AI Agents Roster
              </h3>
            </div>
            <button
              onClick={() => navigate('/workspace/agents')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 cursor-pointer"
            >
              <span>View All 10 Agents</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {agents.slice(0, 5).map((agent) => (
              <div
                key={agent.id}
                onClick={() => navigate('/workspace/agents')}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group text-center"
              >
                <div className="relative inline-block mb-2">
                  <div className={`h-10 w-10 rounded-xl ${agent.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md mx-auto`}>
                    {agent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-slate-950 ${
                      agent.status === 'busy'
                        ? 'bg-amber-400 animate-ping'
                        : agent.status === 'reflecting'
                        ? 'bg-purple-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                </div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                  {agent.role.replace('Chief ', '').replace(' Officer', '')}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{agent.department}</div>
              </div>
            ))}
          </div>

          {/* AI Suggestions Box */}
          <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 font-bold">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span>AI Executive Suggestions for Montaser:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold font-mono">1.</span>
                <span>DACH Germany Region Data Center decision has a 94% ROI score. Click simulate to view financials.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold font-mono">2.</span>
                <span>pgvector query latency in Engineering project is 115ms (Optimal limit: &lt;150ms).</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Notifications & Recent Activity Column */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Live Notifications
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> SOC2 Compliance
                </span>
                <span className="text-[10px]">10m ago</span>
              </div>
              <p className="text-slate-300 text-[11px]">Vanta automated auditor verified 0 RLS row leaks across all tenant tables.</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-indigo-400 font-bold flex items-center gap-1">
                  <Bot className="h-3.5 w-3.5" /> CTO Agent
                </span>
                <span className="text-[10px]">25m ago</span>
              </div>
              <p className="text-slate-300 text-[11px]">Finished benchmarking 1536-dim embeddings. pgvector IVFFlat index active.</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> OCR Pipeline
                </span>
                <span className="text-[10px]">1h ago</span>
              </div>
              <p className="text-slate-300 text-[11px]">Indexed AWS_Enterprise_Agreement_Frankfurt.Contract into Knowledge Base.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Decisions Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Recent Decisions
            </h3>
          </div>
          <button
            onClick={() => navigate('/workspace/decisions')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 cursor-pointer"
          >
            <span>Open Decision Center</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decisions.slice(0, 3).map((dec) => (
            <div
              key={dec.id}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      dec.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {dec.status}
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    Risk: {dec.riskScore}/100
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1 leading-snug">{dec.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{dec.question}</p>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">{dec.expectedROI}</span>
                {dec.status === 'APPROVED' ? (
                  <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                  </span>
                ) : (
                  <button
                    onClick={() => runDecisionSimulation(dec.id)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Simulate & Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
