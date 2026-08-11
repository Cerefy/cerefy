import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  Layers,
  Brain,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

export const AgentsRosterView: React.FC = () => {
  const { agents, runAgentTask,  } = useAgentStore();
  const navigate = useNavigate();
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const departments = ['ALL', 'Executive', 'Engineering', 'Product', 'Finance', 'Security', 'Operations', 'Sales'];

  const filteredAgents = agents.filter((a) => {
    const matchesDept = selectedDept === 'ALL' || a.department === selectedDept;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  const activeAgent = agents.find((a) => a.id === selectedAgentId) || filteredAgents[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-slate-panel border border-slate-panel-raised p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-signal-strong font-mono text-xs font-bold uppercase mb-1">
            <Bot className="h-4 w-4" /> Multi-Department AI Workforce Directory
          </div>
          <h2 className="text-xl font-bold text-dark-text-bright tracking-tight">AI Agents Roster (40+ Persona Fleet)</h2>
          <p className="text-xs text-slate-muted-strong font-mono">
            Autonomous specialized agents trained on pgvector knowledge graphs with strict RLS execution rules.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 bg-slate-deep border border-slate-panel-raised rounded-xl text-slate-text-muted">
            Active Roster: <span className="text-emerald-signal-strong font-bold">{agents.length} Personas</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-deep border border-slate-panel-raised rounded-xl text-slate-text-muted">
            Engine: <span className="text-cyan-signal-strong font-bold">LangGraph v2</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-panel/80 p-4 rounded-xl border border-slate-panel-raised font-mono text-xs">
        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                selectedDept === dept
                  ? 'bg-indigo-signal-deep text-dark-text-bright font-bold'
                  : 'bg-slate-deep text-slate-muted-strong hover:text-dark-text-bright border border-slate-panel-raised'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex items-center bg-slate-deep border border-slate-panel-raised rounded-lg px-3 py-1.5 w-64">
          <Search className="h-4 w-4 text-slate-muted me-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agent skills..."
            className="bg-transparent text-dark-text-bright outline-none w-full text-xs placeholder:text-slate-muted"
          />
        </div>
      </div>

      {/* Grid View: Cards List + Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents Cards List */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredAgents.map((agent) => {
            const isSelected = activeAgent?.id === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`bg-slate-panel/90 p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'border-indigo-signal bg-indigo-signal-ink/20 shadow-lg shadow-indigo-signal/10'
                    : 'border-slate-panel-raised hover:border-slate-panel-soft'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-2xl ${agent.avatarColor} flex items-center justify-center text-dark-text-bright font-bold text-base shadow-md font-mono shrink-0`}>
                      {agent.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-dark-text-bright">{agent.name}</h4>
                      <p className="text-xs text-indigo-signal-strong font-mono font-medium">{agent.role}</p>
                      <span className="text-[10px] text-slate-muted font-mono">{agent.department} Dept</span>
                    </div>
                  </div>

                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      agent.status === 'busy' ? 'bg-amber-signal-strong animate-ping' : 'bg-emerald-signal-strong'
                    }`}
                  />
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="text-slate-muted-strong truncate">
                    <strong className="text-slate-text-muted">Task:</strong> {agent.currentTask}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {agent.skills.slice(0, 3).map((skill, sIdx) => (
                      <span key={sIdx} className="px-1.5 py-0.5 bg-slate-deep text-slate-muted-strong rounded border border-slate-panel-raised text-[10px]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-panel-raised flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-muted">Perf: <strong className="text-emerald-signal-strong">{agent.performanceScore}%</strong></span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runAgentTask(agent.id);
                      navigate('/workspace/orchestrator');
                    }}
                    className="px-2.5 py-1 bg-indigo-signal-deep hover:bg-indigo-signal text-dark-text-bright rounded text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    ▶ Launch Task
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Agent Deep Inspector */}
        {activeAgent && (
          <div className="bg-slate-panel border border-slate-panel-raised rounded-2xl p-6 space-y-5 font-mono text-xs">
            <div className="flex items-center gap-3 border-b border-slate-panel-raised pb-4">
              <div className={`h-12 w-12 rounded-2xl ${activeAgent.avatarColor} flex items-center justify-center text-dark-text-bright font-bold text-lg shadow-md shrink-0`}>
                {activeAgent.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-dark-text-bright">{activeAgent.name}</h3>
                <p className="text-xs text-indigo-signal-strong">{activeAgent.role}</p>
                <p className="text-[10px] text-slate-muted">{activeAgent.department} Department</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-muted uppercase text-[10px] block mb-1">Current Active Task</span>
                <div className="p-3 bg-slate-deep rounded-xl border border-slate-panel-raised text-slate-text">
                  {activeAgent.currentTask}
                </div>
              </div>

              <div>
                <span className="text-slate-muted uppercase text-[10px] block mb-1">Specialized Skills &amp; Tools</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeAgent.skills.map((s, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-deep text-cyan-signal-soft border border-slate-panel-raised rounded-lg text-[10px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-deep rounded-xl border border-slate-panel-raised">
                  <span className="text-[10px] text-slate-muted block">Performance</span>
                  <span className="text-base font-bold text-emerald-signal-strong">{activeAgent.performanceScore}%</span>
                </div>
                <div className="p-3 bg-slate-deep rounded-xl border border-slate-panel-raised">
                  <span className="text-[10px] text-slate-muted block">Monthly Token Cost</span>
                  <span className="text-base font-bold text-cyan-signal-strong">${activeAgent.monthlyCost}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    runAgentTask(activeAgent.id);
                    navigate('/workspace/orchestrator');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-signal-deep to-cyan-signal-deep hover:from-indigo-signal hover:to-cyan-signal text-dark-text-bright font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  <span>Dispatch Agent Task (LangGraph)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
