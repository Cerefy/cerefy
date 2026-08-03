// src/components/BPMNWorkspaceView.tsx
// BPMN Process Workspace — Visual process modeling and mapping
// Uses existing Cerefy Obsidian/Cyan identity

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Workflow,
  Plus,
  Play,
  Save,
  Download,
  Upload,
  Search,
  ChevronRight,
  Circle,
  Square,
  Diamond,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Cpu,
  FileText,
  Layers,
  GitBranch,
  Zap,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface ProcessNode {
  id: string;
  type: 'start' | 'task' | 'gateway' | 'event' | 'end' | 'subprocess';
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  assignee?: string;
  duration?: string;
  x: number;
  y: number;
}

interface ProcessDefinition {
  id: string;
  name: string;
  version: string;
  status: 'draft' | 'active' | 'archived';
  nodeCount: number;
  lastModified: string;
  owner: string;
}

const sampleProcesses: ProcessDefinition[] = [
  { id: 'proc-1', name: 'Customer Onboarding', version: 'v2.3', status: 'active', nodeCount: 14, lastModified: '2h ago', owner: 'Montaser' },
  { id: 'proc-2', name: 'Invoice Approval Flow', version: 'v1.8', status: 'active', nodeCount: 9, lastModified: '1d ago', owner: 'Sarah' },
  { id: 'proc-3', name: 'Employee Offboarding', version: 'v1.0', status: 'draft', nodeCount: 11, lastModified: '3d ago', owner: 'Ahmed' },
  { id: 'proc-4', name: 'Compliance Audit Trail', version: 'v3.1', status: 'active', nodeCount: 22, lastModified: '5h ago', owner: 'Governance AI' },
  { id: 'proc-5', name: 'Product Release Pipeline', version: 'v2.0', status: 'archived', nodeCount: 18, lastModified: '2w ago', owner: 'DevOps' },
];

const sampleNodes: ProcessNode[] = [
  { id: 'n1', type: 'start', label: 'Start', status: 'completed', x: 40, y: 120 },
  { id: 'n2', type: 'task', label: 'Collect Documents', status: 'completed', assignee: 'Discovery Agent', duration: '2.1s', x: 150, y: 100 },
  { id: 'n3', type: 'task', label: 'Verify Identity', status: 'completed', assignee: 'Compliance AI', duration: '1.8s', x: 320, y: 100 },
  { id: 'n4', type: 'gateway', label: 'Risk Check', status: 'active', x: 490, y: 120 },
  { id: 'n5', type: 'task', label: 'Standard Review', status: 'pending', assignee: 'Analyst Agent', x: 620, y: 50 },
  { id: 'n6', type: 'task', label: 'Enhanced Due Diligence', status: 'pending', assignee: 'Governance Agent', x: 620, y: 190 },
  { id: 'n7', type: 'task', label: 'Create Account', status: 'pending', assignee: 'System', x: 790, y: 100 },
  { id: 'n8', type: 'end', label: 'Complete', status: 'pending', x: 920, y: 120 },
];

const nodeTypeIcon: Record<string, React.FC<{ className?: string; size?: number }>> = {
  start: Circle,
  task: Square,
  gateway: Diamond,
  event: Zap,
  end: CheckCircle2,
  subprocess: Layers,
};

const nodeStatusColor: Record<string, string> = {
  pending: 'border-zinc-700/50 bg-zinc-800/40',
  active: 'border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,216,246,0.1)]',
  completed: 'border-emerald-500/30 bg-emerald-500/10',
  error: 'border-red-500/30 bg-red-500/10',
};

export const BPMNWorkspaceView: React.FC = () => {
  const [selectedProcess, setSelectedProcess] = useState<ProcessDefinition>(sampleProcesses[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null);

  const filteredProcesses = sampleProcesses.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Workflow className="h-5 w-5 text-cyan-400" />
            BPMN Process Workspace
          </h1>
          <p className="text-zinc-500 text-xs font-mono mt-1">
            VISUAL PROCESS MODELING · AI-POWERED PROCESS INTELLIGENCE
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<Upload size={14} />}>Import</Button>
          <Button variant="ghost" size="sm" icon={<Download size={14} />}>Export</Button>
          <Button variant="secondary" size="sm" icon={<Save size={14} />}>Save</Button>
          <Button variant="primary" size="sm" icon={<Play size={14} />}>Execute</Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Process Sidebar */}
        <div className="w-72 shrink-0 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search processes..."
              className="w-full bg-zinc-900/50 border border-zinc-800/60 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>

          {/* Process List */}
          <div className="space-y-1">
            {filteredProcesses.map((proc) => (
              <button
                key={proc.id}
                onClick={() => setSelectedProcess(proc)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer
                  ${selectedProcess.id === proc.id
                    ? 'bg-zinc-800 border border-zinc-700/80 text-white'
                    : 'hover:bg-zinc-900/60 text-zinc-400 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate">{proc.name}</span>
                  <Badge
                    variant={proc.status === 'active' ? 'success' : proc.status === 'draft' ? 'warning' : 'neutral'}
                    size="xs"
                  >
                    {proc.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                  <span>{proc.version}</span>
                  <span>·</span>
                  <span>{proc.nodeCount} nodes</span>
                  <span>·</span>
                  <span>{proc.lastModified}</span>
                </div>
              </button>
            ))}
          </div>

          <Button variant="ghost" size="sm" fullWidth icon={<Plus size={14} />}>
            New Process
          </Button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 space-y-3">
          {/* Process Info Bar */}
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitBranch className="h-4 w-4 text-cyan-400" />
              <div>
                <p className="text-sm font-medium text-white">{selectedProcess.name}</p>
                <p className="text-[10px] font-mono text-zinc-500">
                  {selectedProcess.version} · Owner: {selectedProcess.owner} · Modified: {selectedProcess.lastModified}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="cyan" size="xs" dot pulse>{sampleNodes.filter(n => n.status === 'active').length} active</Badge>
              <Badge variant="success" size="xs" dot>{sampleNodes.filter(n => n.status === 'completed').length} completed</Badge>
            </div>
          </div>

          {/* BPMN Canvas */}
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl relative overflow-hidden min-h-[420px] bg-grid-pattern">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] rounded-full bg-cyan-500/3 blur-[80px]" />
            </div>

            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {[
                { x1: 80, y1: 130, x2: 150, y2: 130 },
                { x1: 290, y1: 130, x2: 320, y2: 130 },
                { x1: 460, y1: 130, x2: 490, y2: 130 },
                { x1: 520, y1: 120, x2: 620, y2: 80 },
                { x1: 520, y1: 140, x2: 620, y2: 220 },
                { x1: 760, y1: 80, x2: 790, y2: 130 },
                { x1: 760, y1: 220, x2: 790, y2: 130 },
                { x1: 930, y1: 130, x2: 920, y2: 130 },
              ].map((line, i) => (
                <line
                  key={i}
                  x1={line.x1} y1={line.y1}
                  x2={line.x2} y2={line.y2}
                  stroke="rgba(63,63,70,0.4)"
                  strokeWidth="1.5"
                  markerEnd="url(#arrowhead)"
                />
              ))}
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="rgba(113,113,122,0.5)" />
                </marker>
              </defs>
            </svg>

            {/* BPMN Nodes */}
            {sampleNodes.map((node) => {
              const Icon = nodeTypeIcon[node.type] || Square;
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * parseInt(node.id.replace('n', '')) }}
                  className={`
                    absolute cursor-pointer rounded-lg border p-2 backdrop-blur-sm transition-all
                    ${nodeStatusColor[node.status]}
                    ${node.type === 'start' || node.type === 'end' ? 'rounded-full w-10 h-10 flex items-center justify-center p-0' : 'min-w-[140px]'}
                    ${selectedNode?.id === node.id ? 'ring-1 ring-cyan-500/50' : ''}
                    hover:border-cyan-500/40
                  `}
                  style={{ left: node.x, top: node.y, zIndex: 1 }}
                  onClick={() => setSelectedNode(node)}
                >
                  {node.type === 'start' || node.type === 'end' ? (
                    <Icon className={`h-4 w-4 ${node.status === 'completed' ? 'text-emerald-400' : 'text-zinc-400'}`} size={16} />
                  ) : node.type === 'gateway' ? (
                    <div className="flex items-center justify-center">
                      <Diamond className={`h-5 w-5 ${node.status === 'active' ? 'text-cyan-400' : 'text-zinc-500'}`} />
                      <span className="text-[9px] font-mono text-zinc-400 ml-1">{node.label}</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-medium text-white truncate">{node.label}</p>
                      {node.assignee && (
                        <p className="text-[9px] font-mono text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Cpu className="h-2.5 w-2.5" /> {node.assignee}
                        </p>
                      )}
                      {node.duration && (
                        <p className="text-[9px] font-mono text-cyan-400 mt-0.5">{node.duration}</p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800/60 rounded-xl px-4 py-2">
            <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500">
              <span className="flex items-center gap-1"><Circle className="h-3 w-3 text-zinc-500" /> Start Event</span>
              <span className="flex items-center gap-1"><Square className="h-3 w-3 text-zinc-500" /> Task</span>
              <span className="flex items-center gap-1"><Diamond className="h-3 w-3 text-zinc-500" /> Gateway</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-zinc-500" /> End Event</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-zinc-500">{sampleNodes.length} nodes</span>
              <span className="text-zinc-700">·</span>
              <span className="text-emerald-400">Process: RUNNING</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
