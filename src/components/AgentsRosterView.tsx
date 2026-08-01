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
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase mb-1">
            <Bot className="h-4 w-4" /> Multi-Department AI Workforce Directory
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Agents Roster (40+ Persona Fleet)</h2>
          <p className="text-xs text-slate-400 font-mono">
            Autonomous specialized agents trained on pgvector knowledge graphs with strict RLS execution rules.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300">
            Active Roster: <span className="text-emerald-400 font-bold">{agents.length} Personas</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300">
            Engine: <span className="text-cyan-400 font-bold">LangGraph v2</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 font-mono text-xs">
        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                selectedDept === dept
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 w-64">
          <Search className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agent skills..."
            className="bg-transparent text-white outline-none w-full text-xs placeholder:text-slate-500"
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
                className={`bg-slate-900/90 p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-2xl ${agent.avatarColor} flex items-center justify-center text-white font-bold text-base shadow-md font-mono shrink-0`}>
                      {agent.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{agent.name}</h4>
                      <p className="text-xs text-indigo-400 font-mono font-medium">{agent.role}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{agent.department} Dept</span>
                    </div>
                  </div>

                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      agent.status === 'busy' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                    }`}
                  />
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="text-slate-400 truncate">
                    <strong className="text-slate-300">Task:</strong> {agent.currentTask}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {agent.skills.slice(0, 3).map((skill, sIdx) => (
                      <span key={sIdx} className="px-1.5 py-0.5 bg-slate-950 text-slate-400 rounded border border-slate-800 text-[10px]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Perf: <strong className="text-emerald-400">{agent.performanceScore}%</strong></span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runAgentTask(agent.id);
                      navigate('/workspace/orchestrator');
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 font-mono text-xs">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className={`h-12 w-12 rounded-2xl ${activeAgent.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0`}>
                {activeAgent.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{activeAgent.name}</h3>
                <p className="text-xs text-indigo-400">{activeAgent.role}</p>
                <p className="text-[10px] text-slate-500">{activeAgent.department} Department</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-500 uppercase text-[10px] block mb-1">Current Active Task</span>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200">
                  {activeAgent.currentTask}
                </div>
              </div>

              <div>
                <span className="text-slate-500 uppercase text-[10px] block mb-1">Specialized Skills &amp; Tools</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeAgent.skills.map((s, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-950 text-cyan-300 border border-slate-800 rounded-lg text-[10px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Performance</span>
                  <span className="text-base font-bold text-emerald-400">{activeAgent.performanceScore}%</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Monthly Token Cost</span>
                  <span className="text-base font-bold text-cyan-400">${activeAgent.monthlyCost}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    runAgentTask(activeAgent.id);
                    navigate('/workspace/orchestrator');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
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
