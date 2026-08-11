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
    <div className="space-y-6 font-sans text-dark-text-muted selection:bg-indigo-signal/30">
      {/* Top Bar with Mode Switcher & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-signal/10 text-indigo-signal-strong rounded-xl border border-indigo-signal/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-dark-text-bright tracking-tight font-sans">
              Agent Studio &amp; Workflow Automations
            </h2>
            <p className="text-xs text-dark-muted font-sans">
              Configure autonomous agent personas, inference power, and multi-node execution graphs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-dark-panel-deep p-1 rounded-xl font-mono text-xs border border-dark-panel-raised">
            <button
              onClick={() => setViewMode('AGENT_STUDIO')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-sans ${
                viewMode === 'AGENT_STUDIO'
                  ? 'bg-dark-panel-raised font-bold text-dark-text-bright shadow-sm'
                  : 'text-dark-muted hover:text-dark-text-muted'
              }`}
            >
              Agent Studio
            </button>
            <button
              onClick={() => setViewMode('WORKFLOW_BUILDER')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-sans ${
                viewMode === 'WORKFLOW_BUILDER'
                  ? 'bg-dark-panel-raised font-bold text-dark-text-bright shadow-sm'
                  : 'text-dark-muted hover:text-dark-text-muted'
              }`}
            >
              Workflow Automations
            </button>
          </div>

          <button
            onClick={() => alert(`Agent ${agentName} deployed to active production environment!`)}
            className="px-4 py-2 bg-dark-panel-raised hover:bg-dark-panel-soft text-dark-text-bright text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer border border-dark-panel-soft"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-signal-strong" />
            <span>Deploy Agent</span>
          </button>
        </div>
      </div>

      {viewMode === 'AGENT_STUDIO' ? (
        /* 3-Column Agent Studio Layout (Image 4) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Agents List (3 cols) */}
          <div className="lg:col-span-3 bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-4 shadow-sm space-y-4 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-dark-muted font-mono">
                Agents
              </h3>
              <button
                onClick={() => alert('New agent draft created.')}
                className="p-1 bg-dark-panel-raised hover:bg-dark-panel-soft text-dark-text-muted rounded-lg transition-colors cursor-pointer"
                title="Create New Agent"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dark-muted" />
              <input
                type="text"
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                placeholder="Search agents..."
                className="w-full ps-9 pe-3 py-1.5 bg-dark-panel-deep border border-dark-panel-raised rounded-xl text-xs outline-none focus:border-indigo-signal text-dark-text font-sans"
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
                    className={`p-3 rounded-xl border text-start transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-signal/10 border-indigo-signal/50 ring-1 ring-indigo-signal/20'
                        : 'bg-transparent border-transparent hover:bg-dark-panel-raised/50 hover:border-dark-panel-raised'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`font-bold text-xs font-sans ${isSelected ? 'text-indigo-signal-strong' : 'text-dark-text'}`}>{ag.name}</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-signal shadow-glow-emerald-xs" />
                    </div>
                    <div className="text-[10px] text-dark-muted font-sans mt-0.5">{ag.role}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Agent Configuration / Persona Editor (5 cols) */}
          <div className="lg:col-span-5 bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-6 backdrop-blur-sm">
            <div className="flex justify-between items-center border-b border-dark-panel-raised pb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-dark-text-bright font-sans">{agentName}</h3>
                <span className="px-2 py-0.5 bg-dark-panel-raised text-dark-muted-strong font-mono text-[10px] rounded font-bold border border-dark-panel-soft">
                  DRAFT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Agent configuration saved successfully.')}
                  className="px-3 py-1.5 bg-indigo-signal-deep hover:bg-indigo-signal text-dark-text-bright text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
              </div>
            </div>

            {/* Sub-navigation tabs */}
            <div className="flex border-b border-dark-panel-raised text-xs font-sans">
              {(['Identity', 'Knowledge', 'Tools', 'Guardrails'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSubTab(tab)}
                  className={`px-4 py-2 font-semibold border-b-2 transition-colors cursor-pointer ${
                    subTab === tab
                      ? 'border-indigo-signal text-indigo-signal-strong'
                      : 'border-transparent text-dark-muted hover:text-dark-text-muted'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Core Persona Form */}
            <div className="space-y-4 text-xs font-sans text-dark-text-muted">
              <h4 className="font-bold text-dark-muted uppercase tracking-wider font-mono text-[11px]">
                Core Persona
              </h4>

              <div>
                <label className="block text-dark-muted mb-1 font-semibold">AGENT NAME</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full p-2.5 bg-dark-panel-deep border border-dark-panel-raised rounded-xl text-dark-text-bright font-semibold outline-none focus:border-indigo-signal"
                />
              </div>

              <div>
                <label className="block text-dark-muted mb-1 font-semibold">OPERATIONAL OBJECTIVE</label>
                <textarea
                  rows={4}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full p-2.5 bg-dark-panel-deep border border-dark-panel-raised rounded-xl text-dark-text-muted text-xs leading-relaxed outline-none focus:border-indigo-signal font-sans"
                />
              </div>

              {/* Inference Power Card */}
              <div className="p-4 bg-indigo-signal/10 border border-indigo-signal/20 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-signal-soft">Inference Power</span>
                  <span className="font-mono text-xs font-bold text-indigo-signal-strong">Score: 98.4</span>
                </div>
                <p className="text-[11px] text-dark-muted-strong leading-snug">
                  Optimized for high-level decision logic with server-side Gemini 2.5 Pro architecture.
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-dark-muted">
                  <span>MODEL:</span>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="bg-dark-panel border border-dark-panel-raised rounded px-2 py-0.5 text-dark-text font-semibold outline-none focus:border-indigo-signal"
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
                  <div className="flex justify-between text-dark-muted font-semibold mb-1">
                    <span>TEMPERATURE ({temperature})</span>
                    <span className="font-mono text-[10px] text-dark-border">
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
                    className="w-full accent-indigo-signal cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-dark-panel-deep border border-dark-panel-raised rounded-xl space-y-1">
                    <div className="text-[10px] font-mono text-dark-border font-bold uppercase">
                      SELF-CORRECTION
                    </div>
                    <div className="text-xs font-bold text-dark-text">LEVEL {selfCorrectionLevel}</div>
                    <div className="text-[9px] text-dark-muted">Frequency of internal passes</div>
                  </div>

                  <div className="p-3 bg-dark-panel-deep border border-dark-panel-raised rounded-xl space-y-1">
                    <div className="text-[10px] font-mono text-dark-border font-bold uppercase">
                      PRIVACY TIER
                    </div>
                    <div className="text-xs font-bold text-indigo-signal-strong">{privacyTier}</div>
                    <div className="text-[9px] text-dark-muted">PII masking enabled</div>
                  </div>
                </div>
              </div>

              {/* Knowledge Sources Card */}
              <div className="p-4 bg-dark-panel-deep border border-dark-panel-raised rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-xs text-dark-text-bright">Knowledge Sources</div>
                  <div className="text-[10px] text-dark-muted">Connect enterprise docs, CRM data, real-time APIs...</div>
                </div>
                <button
                  onClick={() => navigate('/workspace/memory')}
                  className="px-3 py-1.5 bg-dark-panel-raised border border-dark-panel-soft hover:bg-dark-panel-soft text-dark-text font-semibold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                >
                  Manage Data
                </button>
              </div>
            </div>
          </div>

          {/* Column 3: Live Preview Interactive Chat Simulator (4 cols) */}
          <div className="lg:col-span-4 bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[640px] backdrop-blur-sm">
            <div>
              <div className="flex items-center justify-between border-b border-dark-panel-raised pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-signal animate-pulse shadow-glow-emerald-xs" />
                  <h3 className="text-sm font-bold text-dark-text-bright font-sans">LIVE PREVIEW</h3>
                </div>
                <span className="text-[10px] font-mono text-dark-muted">Simulated Sandbox</span>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pe-1 custom-scrollbar">
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
                          ? 'bg-indigo-signal-deep text-dark-text-bright rounded-br-xs shadow-glow-indigo'
                          : 'bg-dark-panel-raised text-dark-text rounded-bl-xs border border-dark-panel-soft/80'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-dark-muted font-mono px-1">{msg.time}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 p-3 bg-dark-panel-raised rounded-2xl text-dark-muted-strong text-xs w-28">
                    <span className="animate-pulse">Reasoning...</span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSendTestMessage} className="pt-3 border-t border-dark-panel-raised flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Test the agent..."
                className="flex-1 px-3 py-2 bg-dark-panel-deep border border-dark-panel-raised rounded-xl text-xs text-dark-text-bright outline-none focus:border-indigo-signal font-sans"
              />
              <button
                type="submit"
                className="p-2.5 bg-indigo-signal-deep hover:bg-indigo-signal text-dark-text-bright rounded-xl transition-colors cursor-pointer shadow-glow-indigo-sm"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Workflow Automations Visual Node Mode (Image 7) */
        <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-6 shadow-sm space-y-6 backdrop-blur-sm">
          <div className="flex justify-between items-center border-b border-dark-panel-raised pb-4">
            <div>
              <h3 className="text-base font-bold text-dark-text-bright font-sans">
                Visual Workflow Automations Pipeline
              </h3>
              <p className="text-xs text-dark-muted font-sans">
                Multi-step node graphs connecting triggers, Gemini reasoning, and webhook execution.
              </p>
            </div>
            <button
              onClick={() => {
                setIsExecuting(true);
                setTimeout(() => setIsExecuting(false), 1200);
              }}
              className="px-4 py-2 bg-emerald-signal-deep hover:bg-emerald-signal text-dark-text-bright font-semibold text-xs rounded-xl shadow-glow-emerald transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Run Pipeline Simulation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="p-5 bg-dark-panel-deep border border-dark-panel-raised rounded-2xl space-y-4 hover:border-dark-panel-soft transition-all shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 bg-indigo-signal/10 text-indigo-signal-strong text-[9px] font-mono font-bold rounded uppercase border border-indigo-signal/20">
                    {wf.triggerType}
                  </span>
                  <span className="text-xs font-mono text-dark-muted">{wf.nodes.length} Nodes</span>
                </div>
                <h4 className="text-sm font-bold text-dark-text-bright font-sans">{wf.name}</h4>
                <div className="space-y-2 pt-2 border-t border-dark-panel-raised">
                  {wf.nodes.map((n, i) => (
                    <div
                      key={n.id}
                      className="p-2.5 bg-dark-panel border border-dark-panel-raised rounded-xl text-xs font-sans flex items-center justify-between hover:bg-dark-panel-raised transition-colors"
                    >
                      <span className="font-semibold text-dark-text">
                        {i + 1}. {n.label}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-signal-strong bg-indigo-signal/10 px-1.5 py-0.5 rounded border border-indigo-signal/20">
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
