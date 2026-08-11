import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { TaskItem } from '../types';
import {
  CheckSquare,
  Plus,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const TasksKanbanView: React.FC = () => {
  const { tasks, addTask, updateTaskStatus } = useAgentStore();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('agent_cto');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');

  const columns: { id: TaskItem['status']; label: string }[] = [
    { id: 'BACKLOG', label: 'Backlog' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'IN_REVIEW', label: 'Review & Approval' },
    { id: 'DONE', label: 'Completed' },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      title,
      projectId: 'proj_1',
      assignee: 'Montaser / CEO Agent',
      assigneeAgentId: assignee,
      priority,
      status: 'IN_PROGRESS',
      dueDate: '2026-08-15',
    });

    setShowModal(false);
    setTitle('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="bg-slate-panel border border-slate-panel-raised p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-signal-strong font-mono text-xs font-bold uppercase mb-1">
            <CheckSquare className="h-4 w-4" /> Multi-Agent Approval &amp; Execution Kanban
          </div>
          <h2 className="text-xl font-bold text-dark-text-bright tracking-tight">Tasks &amp; Board Approvals</h2>
          <p className="text-xs text-slate-muted-strong font-mono">
            Track automated AI tasks, human-in-the-loop approvals, and deployment pipelines.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-signal-deep to-cyan-signal-deep text-dark-text-bright font-mono font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Kanban Task</span>
        </button>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="bg-slate-panel/80 border border-slate-panel-raised rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-panel-raised pb-2">
                <span className="font-bold text-slate-text uppercase text-[11px]">{col.label}</span>
                <span className="px-2 py-0.5 bg-slate-deep text-indigo-signal-strong rounded-md font-bold text-[10px]">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {colTasks.map((t) => (
                  <div key={t.id} className="bg-slate-deep p-3.5 rounded-xl border border-slate-panel-raised space-y-2 hover:border-indigo-signal/50 transition-all">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        t.priority === 'URGENT' ? 'bg-rose-signal/20 text-rose-signal-soft' : 'bg-indigo-signal/20 text-indigo-signal-soft'
                      }`}>
                        {t.priority}
                      </span>
                      <span className="text-slate-muted">{t.dueDate}</span>
                    </div>
                    <h4 className="text-xs font-bold text-dark-text-bright font-sans leading-snug">{t.title}</h4>
                    <div className="pt-2 border-t border-slate-panel flex justify-between items-center text-[10px]">
                      <span className="text-slate-muted-strong">
                        Assignee: {(t.assigneeAgentId || t.assignee || 'agent_cto').replace('agent_', '').toUpperCase()}
                      </span>
                      <select
                        value={t.status}
                        onChange={(e) => updateTaskStatus(t.id, e.target.value as any)}
                        className="bg-slate-panel text-slate-text-muted text-[10px] rounded px-1.5 py-0.5 outline-none border border-slate-panel-raised cursor-pointer"
                      >
                        <option value="BACKLOG">Backlog</option>
                        <option value="IN_PROGRESS">Progress</option>
                        <option value="IN_REVIEW">Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-deep/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-panel border border-slate-panel-raised rounded-2xl p-6 max-w-md w-full space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-dark-text-bright uppercase">Add New Task</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-muted-strong hover:text-dark-text-bright cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-muted-strong mb-1">Task Title</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Verify pgvector index partitioning" className="w-full bg-slate-deep border border-slate-panel-raised rounded-lg p-2.5 text-dark-text-bright outline-none focus:border-indigo-signal" />
              </div>
              <div>
                <label className="block text-slate-muted-strong mb-1">Assignee AI Agent</label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full bg-slate-deep border border-slate-panel-raised rounded-lg p-2.5 text-dark-text-bright outline-none">
                  <option value="agent_cto">CTO Architecture AI</option>
                  <option value="agent_ceo">CEO Executive AI</option>
                  <option value="agent_pm">Product Manager AI</option>
                  <option value="agent_dev">Developer AI</option>
                  <option value="agent_qa">QA &amp; Security AI</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-signal-deep hover:bg-indigo-signal text-dark-text-bright font-bold rounded-xl cursor-pointer">
                Create &amp; Dispatch Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
