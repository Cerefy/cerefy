import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { useNavigate } from 'react-router-dom';
import {
  Workflow,
  Search,
  Plus,
  Save,
  RotateCcw,
  Bot,
  Sliders,
  ShieldCheck,
  Database,
  Send,
  Sparkles,
  Layers,
  ChevronRight,
  Play,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export const AIStudioWorkflowView: React.FC = () => {
  const { agents, workflows, setIsExecuting } = useAgentStore();
  const navigate = useNavigate();

  // Mode switcher: 'AGENT_STUDIO' or 'WORKFLOW_BUILDER'
  const [viewMode, setViewMode] = useState<'AGENT_STUDIO' | 'WORKFLOW_BUILDER'>('AGENT_STUDIO');

  // Agent Studio State
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || 'agent_ceo');
  const [agentSearch, setAgentSearch] = useState('');
  const [subTab, setSubTab] = useState<'Identity' | 'Knowledge' | 'Tools' | 'Guardrails'>('Identity');

  // Selected Agent Editable Fields
  const activeAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const [agentName, setAgentName] = useState(activeAgent.name);
  const [objective, setObjective] = useState(
    'You are the Chief Executive Officer of a multi-billion dollar enterprise. Your goal is to coordinate cross-departmental intelligence, approve strategic investments, and maintain operational security.'
  );
  const [temperature, setTemperature] = useState(0.2);
  const [selfCorrectionLevel, setSelfCorrectionLevel] = useState(4);
  const [privacyTier, setPrivacyTier] = useState('ENTERPRISE SHIELD');
  const [model, setModel] = useState('Cerefy-Elite-X');

  // Live Chat Preview Simulator
  const [chatMessages, setChatMessages] = useState<
    { sender: 'agent' | 'user'; text: string; time: string }[]
  >([
    {
      sender: 'agent',
      text: 'Hello. I am the Cerefy CEO Agent. I have initialized my strategic parameters. How can I assist with your executive operations today?',
      time: '14:20',
    },
    {
      sender: 'user',
      text: 'Review the Q3 performance reports and flag any departments that are exceeding budget by more than 15%.',
      time: '14:21',
    },
    {
      sender: 'agent',
      text: 'Analysis complete. The Marketing Department is currently +18.4% over projected Q3 spend due to unforecasted acquisition campaigns in LATAM. Engineering and Ops remain within tolerance (<2% variance). Should I initiate a budget realignment proposal?',
      time: '14:21',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendTestMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const agentReply = {
        sender: 'agent' as const,
        text: `[${agentName} Response]: Executed reasoning cycle with Temperature=${temperature} and Model=${model}. Context verified against Enterprise Knowledge Graph. Strategy approved.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, agentReply]);
    }, 1000);
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
      a.role.toLowerCase().includes(agentSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-zinc-300 selection:bg-indigo-500/30">
      {/* Top Bar with Mode Switcher & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight font-sans">
              Agent Studio &amp; Workflow Automations
            </h2>
            <p className="text-xs text-zinc-500 font-sans">
              Configure autonomous agent personas, inference power, and multi-node execution graphs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-950 p-1 rounded-xl font-mono text-xs border border-zinc-800">
            <button
              onClick={() => setViewMode('AGENT_STUDIO')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-sans ${
                viewMode === 'AGENT_STUDIO'
                  ? 'bg-zinc-800 font-bold text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Agent Studio
            </button>
            <button
              onClick={() => setViewMode('WORKFLOW_BUILDER')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-sans ${
                viewMode === 'WORKFLOW_BUILDER'
                  ? 'bg-zinc-800 font-bold text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Workflow Automations
            </button>
          </div>

          <button
            onClick={() => alert(`Agent ${agentName} deployed to active production environment!`)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer border border-zinc-700"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Deploy Agent</span>
          </button>
        </div>
      </div>

      {viewMode === 'AGENT_STUDIO' ? (
        /* 3-Column Agent Studio Layout (Image 4) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Agents List (3 cols) */}
          <div className="lg:col-span-3 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 shadow-sm space-y-4 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
                Agents
              </h3>
              <button
                onClick={() => alert('New agent draft created.')}
                className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                title="Create New Agent"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                placeholder="Search agents..."
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-zinc-200 font-sans"
              />
            </div>

            <div className="space-y-1">
              {filteredAgents.map((ag) => {
                const isSelected = ag.id === selectedAgentId;
                return (
                  <div
                    key={ag.id}
                    onClick={() => {
                      setSelectedAgentId(ag.id);
                      setAgentName(ag.name);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/20'
                        : 'bg-transparent border-transparent hover:bg-zinc-800/50 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`font-bold text-xs font-sans ${isSelected ? 'text-indigo-400' : 'text-zinc-200'}`}>{ag.name}</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div className="text-[10px] text-zinc-500 font-sans mt-0.5">{ag.role}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Agent Configuration / Persona Editor (5 cols) */}
          <div className="lg:col-span-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-6 backdrop-blur-sm">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-sans">{agentName}</h3>
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 font-mono text-[10px] rounded font-bold border border-zinc-700">
                  DRAFT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Agent configuration saved successfully.')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
              </div>
            </div>

            {/* Sub-navigation tabs */}
            <div className="flex border-b border-zinc-800 text-xs font-sans">
              {(['Identity', 'Knowledge', 'Tools', 'Guardrails'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSubTab(tab)}
                  className={`px-4 py-2 font-semibold border-b-2 transition-colors cursor-pointer ${
                    subTab === tab
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Core Persona Form */}
            <div className="space-y-4 text-xs font-sans text-zinc-300">
              <h4 className="font-bold text-zinc-500 uppercase tracking-wider font-mono text-[11px]">
                Core Persona
              </h4>

              <div>
                <label className="block text-zinc-500 mb-1 font-semibold">AGENT NAME</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-semibold">OPERATIONAL OBJECTIVE</label>
                <textarea
                  rows={4}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 text-xs leading-relaxed outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              {/* Inference Power Card */}
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-300">Inference Power</span>
                  <span className="font-mono text-xs font-bold text-indigo-400">Score: 98.4</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Optimized for high-level decision logic with server-side Gemini 2.5 Pro architecture.
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-zinc-500">
                  <span>MODEL:</span>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-zinc-200 font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="Cerefy-Elite-X">Cerefy-Elite-X</option>
                    <option value="Gemini-2.5-Pro">Gemini-2.5-Pro</option>
                    <option value="Cerefy-Large-v4.2">Cerefy-Large-v4.2</option>
                  </select>
                </div>
              </div>

              {/* Controls Grid */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-zinc-500 font-semibold mb-1">
                    <span>TEMPERATURE ({temperature})</span>
                    <span className="font-mono text-[10px] text-zinc-600">
                      {temperature < 0.4 ? 'CONSERVATIVE' : 'CREATIVE'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                    <div className="text-[10px] font-mono text-zinc-600 font-bold uppercase">
                      SELF-CORRECTION
                    </div>
                    <div className="text-xs font-bold text-zinc-200">LEVEL {selfCorrectionLevel}</div>
                    <div className="text-[9px] text-zinc-500">Frequency of internal passes</div>
                  </div>

                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                    <div className="text-[10px] font-mono text-zinc-600 font-bold uppercase">
                      PRIVACY TIER
                    </div>
                    <div className="text-xs font-bold text-indigo-400">{privacyTier}</div>
                    <div className="text-[9px] text-zinc-500">PII masking enabled</div>
                  </div>
                </div>
              </div>

              {/* Knowledge Sources Card */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-xs text-white">Knowledge Sources</div>
                  <div className="text-[10px] text-zinc-500">Connect enterprise docs, CRM data, real-time APIs...</div>
                </div>
                <button
                  onClick={() => navigate('/workspace/memory')}
                  className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                >
                  Manage Data
                </button>
              </div>
            </div>
          </div>

          {/* Column 3: Live Preview Interactive Chat Simulator (4 cols) */}
          <div className="lg:col-span-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[640px] backdrop-blur-sm">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <h3 className="text-sm font-bold text-white font-sans">LIVE PREVIEW</h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Simulated Sandbox</span>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col space-y-1 ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed font-sans shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs shadow-[0_0_15px_rgba(79,70,229,0.2)]'
                          : 'bg-zinc-800 text-zinc-200 rounded-bl-xs border border-zinc-700/80'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono px-1">{msg.time}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-2xl text-zinc-400 text-xs w-28">
                    <span className="animate-pulse">Reasoning...</span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSendTestMessage} className="pt-3 border-t border-zinc-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Test the agent..."
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500 font-sans"
              />
              <button
                type="submit"
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.3)]"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Workflow Automations Visual Node Mode (Image 7) */
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-6 backdrop-blur-sm">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Visual Workflow Automations Pipeline
              </h3>
              <p className="text-xs text-zinc-500 font-sans">
                Multi-step node graphs connecting triggers, Gemini reasoning, and webhook execution.
              </p>
            </div>
            <button
              onClick={() => {
                setIsExecuting(true);
                setTimeout(() => setIsExecuting(false), 1200);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Run Pipeline Simulation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4 hover:border-zinc-700 transition-all shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-mono font-bold rounded uppercase border border-indigo-500/20">
                    {wf.triggerType}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">{wf.nodes.length} Nodes</span>
                </div>
                <h4 className="text-sm font-bold text-white font-sans">{wf.name}</h4>
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  {wf.nodes.map((n, i) => (
                    <div
                      key={n.id}
                      className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-sans flex items-center justify-between hover:bg-zinc-800 transition-colors"
                    >
                      <span className="font-semibold text-zinc-200">
                        {i + 1}. {n.label}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        {n.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
