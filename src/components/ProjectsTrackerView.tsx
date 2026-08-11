import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import {
  FolderKanban,
  Plus,
  Calendar,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const ProjectsTrackerView: React.FC = () => {
  const { projects, addProject, addLog } = useAgentStore();
  const [showNewModal, setShowNewModal] = useState(false);
  const [title, setTitle] = useState('');
  const [dept, setDept] = useState('Engineering');
  const [budget, setBudget] = useState('$150,000');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addProject(title, dept, budget);

    addLog({
      tenantId: 'tenant_acme_101',
      agentId: 'agent_pm',
      executionTimeMs: 140,
      status: 'SUCCESS',
      inputPayload: { name: title, department: dept },
      outputPayload: { message: `New project "${title}" created` },
    });

    setShowNewModal(false);
    setTitle('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="bg-slate-panel border border-slate-panel-raised p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-signal-strong font-mono text-xs font-bold uppercase mb-1">
            <FolderKanban className="h-4 w-4" /> Enterprise Roadmaps &amp; Portfolio Management
          </div>
          <h2 className="text-xl font-bold text-dark-text-bright tracking-tight">Projects &amp; Milestones Tracker</h2>
          <p className="text-xs text-slate-muted-strong font-mono">
            Strategic company initiatives managed by specialized AI Project Managers.
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-signal-deep to-cyan-signal-deep hover:from-indigo-signal hover:to-cyan-signal text-dark-text-bright font-mono font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Enterprise Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono text-xs">
        {projects.map((proj) => (
          <div key={proj.id} className="bg-slate-panel/90 border border-slate-panel-raised rounded-2xl p-5 space-y-4 hover:border-indigo-signal/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-slate-deep text-indigo-signal-soft border border-slate-panel-raised rounded text-[10px] font-bold">
                {proj.department}
              </span>
              <span className="px-2 py-0.5 bg-emerald-signal/20 text-emerald-signal-soft border border-emerald-signal/30 rounded text-[10px] font-bold">
                {proj.status}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-dark-text-bright mb-1 font-sans">{proj.name || proj.title}</h3>
              <p className="text-slate-muted-strong text-[11px]">Due: {proj.dueDate} • Budget: {proj.budget || proj.budgetUsed || '$100,000'}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-muted-strong">Milestones ({proj.completedMilestones ?? 2}/{proj.milestonesCount ?? 5})</span>
                <span className="text-cyan-signal-strong font-bold">{proj.progressPercent ?? proj.progress ?? 50}%</span>
              </div>
              <div className="h-2 w-full bg-slate-deep rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-signal to-cyan-signal-strong" style={{ width: `${proj.progressPercent ?? proj.progress ?? 50}%` }} />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-panel-raised/80 flex items-center justify-between text-[10px] text-slate-muted-strong">
              <span className="flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-indigo-signal-strong" /> AI PM Assigned
              </span>
              <span className="text-slate-text-muted">Active Sprint #4</span>
            </div>
          </div>
        ))}
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-deep/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-panel border border-slate-panel-raised rounded-2xl p-6 max-w-md w-full space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-dark-text-bright uppercase">Create New Enterprise Project</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-muted-strong hover:text-dark-text-bright cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-muted-strong mb-1">Project Name</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frankfurt Data Center Migration" className="w-full bg-slate-deep border border-slate-panel-raised rounded-lg p-2.5 text-dark-text-bright outline-none focus:border-indigo-signal" />
              </div>
              <div>
                <label className="block text-slate-muted-strong mb-1">Department</label>
                <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full bg-slate-deep border border-slate-panel-raised rounded-lg p-2.5 text-dark-text-bright outline-none">
                  <option>Engineering</option>
                  <option>Product</option>
                  <option>Finance</option>
                  <option>Security</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-muted-strong mb-1">Allocated Budget</label>
                <input value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-slate-deep border border-slate-panel-raised rounded-lg p-2.5 text-dark-text-bright outline-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-signal-deep hover:bg-indigo-signal text-dark-text-bright font-bold rounded-xl cursor-pointer">
                Create &amp; Assign AI Lead
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
