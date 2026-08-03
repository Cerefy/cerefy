// src/components/AICanvasView.tsx
// AI Agent Visual Canvas — Real-time multi-agent orchestration visualization
// Uses existing Cerefy Obsidian/Cyan identity

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  BrainCircuit,
  Search,
  FileText,
  Code2,
  TestTube2,
  ShieldCheck,
  Cpu,
  ChevronRight,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface AgentNode {
  id: string;
  name: string;
  type: 'discovery' | 'analyst' | 'architect' | 'developer' | 'tester' | 'governance';
  status: 'idle' | 'running' | 'completed' | 'error' | 'waiting';
  progress: number;
  output?: string;
  confidence?: number;
  duration?: string;
  x: number;
  y: number;
}

interface AgentEdge {
  from: string;
  to: string;
  label?: string;
  active: boolean;
}

const agentIcons: Record<string, React.FC<{ className?: string }>> = {
  discovery: Search,
  analyst: FileText,
  architect: BrainCircuit,
  developer: Code2,
  tester: TestTube2,
  governance: ShieldCheck,
};

const statusColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  idle: { bg: 'bg-zinc-800/60', text: 'text-zinc-400', border: 'border-zinc-700/50', glow: '' },
  running: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-[0_0_20px_rgba(0,216,246,0.15)]' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: '' },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', glow: '' },
  waiting: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: '' },
};

const initialNodes: AgentNode[] = [
  { id: 'discovery', name: 'Discovery Agent', type: 'discovery', status: 'completed', progress: 100, confidence: 0.96, duration: '2.3s', output: 'Identified 14 business processes, 8 integration points', x: 80, y: 50 },
  { id: 'analyst', name: 'Business Analyst', type: 'analyst', status: 'completed', progress: 100, confidence: 0.92, duration: '4.1s', output: '47 requirements extracted, 12 user stories generated', x: 300, y: 50 },
  { id: 'architect', name: 'Solution Architect', type: 'architect', status: 'running', progress: 68, confidence: 0.88, duration: '3.7s', output: 'Designing microservices topology...', x: 520, y: 50 },
  { id: 'developer', name: 'Development Agent', type: 'developer', status: 'waiting', progress: 0, x: 300, y: 200 },
  { id: 'tester', name: 'Testing Agent', type: 'tester', status: 'idle', progress: 0, x: 520, y: 200 },
  { id: 'governance', name: 'Governance Agent', type: 'governance', status: 'idle', progress: 0, x: 80, y: 200 },
];

const initialEdges: AgentEdge[] = [
  { from: 'discovery', to: 'analyst', label: 'requirements', active: true },
  { from: 'analyst', to: 'architect', label: 'specs', active: true },
  { from: 'architect', to: 'developer', label: 'design', active: false },
  { from: 'developer', to: 'tester', label: 'code', active: false },
  { from: 'tester', to: 'governance', label: 'results', active: false },
  { from: 'governance', to: 'discovery', label: 'feedback', active: false },
];

export const AICanvasView: React.FC = () => {
  const [nodes, setNodes] = useState<AgentNode[]>(initialNodes);
  const [edges] = useState<AgentEdge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<AgentNode | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [zoom, setZoom] = useState(1);

  const handleReset = useCallback(() => {
    setNodes(initialNodes.map((n) => ({ ...n, status: 'idle', progress: 0, output: undefined, confidence: undefined, duration: undefined })));
    setIsRunning(false);
    setSelectedNode(null);
  }, []);

  const activeAgents = nodes.filter((n) => n.status === 'running').length;
  const completedAgents = nodes.filter((n) => n.status === 'completed').length;
  const totalProgress = Math.round(nodes.reduce((sum, n) => sum + n.progress, 0) / nodes.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            AI Agent Canvas
          </h1>
          <p className="text-zinc-500 text-xs font-mono mt-1">
            MULTI-AGENT ORCHESTRATION · REAL-TIME EXECUTION GRAPH
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<ZoomOut size={14} />}
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          >
            −
          </Button>
          <span className="text-zinc-500 text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            icon={<ZoomIn size={14} />}
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          >
            +
          </Button>
          <div className="w-px h-6 bg-zinc-800 mx-1" />
          <Button
            variant={isRunning ? 'secondary' : 'primary'}
            size="sm"
            icon={isRunning ? <Pause size={14} /> : <Play size={14} />}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? 'Pause' : 'Execute'}
          </Button>
          <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={handleReset}>
            Reset
          </Button>
          <Button variant="ghost" size="sm" icon={<Maximize2 size={14} />}>
            Fullscreen
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'ACTIVE AGENTS', value: `${activeAgents}/${nodes.length}`, color: 'text-cyan-400' },
          { label: 'COMPLETED', value: `${completedAgents}/${nodes.length}`, color: 'text-emerald-400' },
          { label: 'TOTAL PROGRESS', value: `${totalProgress}%`, color: 'text-white' },
          { label: 'AVG CONFIDENCE', value: `${Math.round((nodes.filter((n) => n.confidence).reduce((s, n) => s + (n.confidence || 0), 0) / Math.max(nodes.filter((n) => n.confidence).length, 1)) * 100)}%`, color: 'text-indigo-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl px-4 py-3">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex gap-4">
        {/* Graph Area */}
        <div className="flex-1 bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 relative overflow-hidden min-h-[500px] bg-grid-pattern">
          {/* Grid Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/3 blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/3 w-[200px] h-[200px] rounded-full bg-indigo-500/3 blur-[80px]" />
          </div>

          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s ease' }}>
            {/* Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {edges.map((edge) => {
                const fromNode = nodes.find((n) => n.id === edge.from);
                const toNode = nodes.find((n) => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                const x1 = fromNode.x + 100;
                const y1 = fromNode.y + 40;
                const x2 = toNode.x;
                const y2 = toNode.y + 40;
                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={edge.active ? 'rgba(0,216,246,0.4)' : 'rgba(63,63,70,0.3)'}
                      strokeWidth={edge.active ? 2 : 1}
                      strokeDasharray={edge.active ? undefined : '4,4'}
                    />
                    {edge.active && (
                      <circle r="3" fill="#00D8F6">
                        <animateMotion dur="2s" repeatCount="indefinite">
                          <mpath xlinkHref={`#path-${edge.from}-${edge.to}`} />
                        </animateMotion>
                      </circle>
                    )}
                    <path
                      id={`path-${edge.from}-${edge.to}`}
                      d={`M${x1},${y1} L${x2},${y2}`}
                      fill="none"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Agent Nodes */}
            {nodes.map((node) => {
              const Icon = agentIcons[node.type] || Bot;
              const colors = statusColors[node.status];
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`
                    absolute w-[200px] cursor-pointer
                    ${colors.bg} border ${colors.border} rounded-xl p-4
                    backdrop-blur-sm transition-all duration-200
                    hover:border-cyan-500/40 ${colors.glow}
                    ${selectedNode?.id === node.id ? 'ring-1 ring-cyan-500/40' : ''}
                  `}
                  style={{ left: node.x, top: node.y, zIndex: 1 }}
                  onClick={() => setSelectedNode(node)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${colors.text}`} />
                      <span className="text-xs font-medium text-white truncate">{node.name}</span>
                    </div>
                    {node.status === 'running' && <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />}
                    {node.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                    {node.status === 'error' && <AlertTriangle className="h-3 w-3 text-red-400" />}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className={`h-full rounded-full ${node.status === 'completed' ? 'bg-emerald-500' : node.status === 'running' ? 'bg-cyan-500' : 'bg-zinc-700'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${node.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">{node.status}</span>
                    {node.confidence && (
                      <span className="text-[10px] font-mono text-indigo-400">{Math.round(node.confidence * 100)}% conf</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-80 shrink-0"
            >
              <Card variant="default" padding="none">
                <div className="p-4 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2 mb-1">
                    {React.createElement(agentIcons[selectedNode.type] || Bot, { className: 'h-5 w-5 text-cyan-400' })}
                    <h3 className="text-sm font-semibold text-white">{selectedNode.name}</h3>
                  </div>
                  <Badge variant={selectedNode.status === 'completed' ? 'success' : selectedNode.status === 'running' ? 'cyan' : selectedNode.status === 'error' ? 'error' : 'neutral'} dot pulse={selectedNode.status === 'running'}>
                    {selectedNode.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="p-4 space-y-3">
                  {selectedNode.confidence !== undefined && (
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Confidence Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full" style={{ width: `${selectedNode.confidence * 100}%` }} />
                        </div>
                        <span className="text-xs font-mono text-cyan-400">{Math.round(selectedNode.confidence * 100)}%</span>
                      </div>
                    </div>
                  )}

                  {selectedNode.duration && (
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Execution Time</p>
                      <p className="text-sm font-mono text-white">{selectedNode.duration}</p>
                    </div>
                  )}

                  {selectedNode.output && (
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Output</p>
                      <p className="text-xs text-zinc-300 bg-zinc-800/50 rounded-lg p-3 font-mono leading-relaxed">{selectedNode.output}</p>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <Button variant="cyan-outline" size="xs" fullWidth icon={<ChevronRight size={12} />}>
                      View Logs
                    </Button>
                    <Button variant="ghost" size="xs" fullWidth icon={<RotateCcw size={12} />}>
                      Re-run
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
