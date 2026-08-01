import React, { useEffect, useRef, useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { KGNode, KGEdge } from '../types';
import { Network, Plus, ZoomIn, ZoomOut, RefreshCw, Trash2, Tag, Info, Layers } from 'lucide-react';

export const KnowledgeGraphView: React.FC = () => {
  const { graphNodes, graphEdges, activeTenantId, addGraphNode, addGraphEdge, deleteGraphNode } =
    useAgentStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [zoom, setZoom] = useState<number>(1);

  // Add Entity Form Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newLabel, setNewLabel] = useState<string>('');
  const [newType, setNewType] = useState<KGNode['type']>('Policy');
  const [connectToNodeId, setConnectToNodeId] = useState<string>('');
  const [relationType, setRelationType] = useState<KGEdge['relation']>('GOVERNS');

  const tenantNodes = graphNodes.filter((n) => n.tenantId === activeTenantId);
  const filteredNodes =
    filterType === 'ALL' ? tenantNodes : tenantNodes.filter((n) => n.type === filterType);
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const tenantEdges = graphEdges.filter(
    (e) => e.tenantId === activeTenantId && filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset transform & clear
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Zoom
    ctx.scale(zoom, zoom);

    // Draw Edges
    tenantEdges.forEach((edge) => {
      const sourceNode = tenantNodes.find((n) => n.id === edge.source);
      const targetNode = tenantNodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw Relation Label
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText(edge.relation, midX - 15, midY - 5);
      }
    });

    // Draw Nodes
    tenantNodes.forEach((node) => {
      const isSelected = selectedNode?.id === node.id;

      ctx.beginPath();
      ctx.arc(node.x, node.y, isSelected ? 22 : 18, 0, 2 * Math.PI);
      ctx.fillStyle = node.color || '#3b82f6';
      ctx.fill();

      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = isSelected ? '#ffffff' : '#1e293b';
      ctx.stroke();

      // Node Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + 32);

      // Node Type Pill
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(`[${node.type}]`, node.x, node.y + 43);
    });

    ctx.restore();
  }, [tenantNodes, tenantEdges, selectedNode, zoom]);

  // Click on canvas to select node
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    const clicked = tenantNodes.find((n) => {
      const dist = Math.hypot(n.x - clickX, n.y - clickY);
      return dist <= 25;
    });

    setSelectedNode(clicked || null);
  };

  const handleAddEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel) return;

    addGraphNode({
      label: newLabel,
      type: newType,
      x: 150 + Math.random() * 300,
      y: 100 + Math.random() * 200,
      color:
        newType === 'Policy'
          ? '#10b981'
          : newType === 'Document'
          ? '#8b5cf6'
          : newType === 'Agent'
          ? '#f59e0b'
          : '#3b82f6',
    });

    if (connectToNodeId) {
      // Find the newly added node (it will be added to store)
      setTimeout(() => {
        const latestNodes = useAgentStore.getState().graphNodes;
        const newlyCreated = latestNodes[latestNodes.length - 1];
        if (newlyCreated) {
          addGraphEdge(connectToNodeId, newlyCreated.id, relationType);
        }
      }, 50);
    }

    setNewLabel('');
    setShowAddModal(false);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 text-slate-100 shadow-xl select-none">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
              Knowledge Graph Topology
            </h3>
            <p className="text-[11px] text-slate-400">
              Neo4j Graph Database Entity-Relation Visualizer
            </p>
          </div>
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Node Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 outline-none"
          >
            <option value="ALL">All Types ({tenantNodes.length})</option>
            <option value="Tenant">Tenant</option>
            <option value="Policy">Policy</option>
            <option value="Document">Document</option>
            <option value="Agent">Agent</option>
            <option value="User">User</option>
            <option value="DataAsset">DataAsset</option>
          </select>

          {/* Zoom Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1.5 text-slate-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Entity</span>
          </button>
        </div>
      </div>

      {/* Main Graph Stage + Metadata Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-xl p-2 relative overflow-hidden flex items-center justify-center min-h-[320px]">
          <canvas
            ref={canvasRef}
            width={620}
            height={320}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-pointer rounded bg-slate-950"
          />

          <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-mono text-slate-400 backdrop-blur-sm">
            Click node to view details | {tenantNodes.length} Entities • {tenantEdges.length} Relations
          </div>
        </div>

        {/* Selected Entity Details Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-indigo-400" /> Entity Metadata
            </span>
          </div>

          {selectedNode ? (
            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px] font-mono">Entity Label</div>
                <div className="font-semibold text-slate-100 font-mono">{selectedNode.label}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-500 text-[9px]">TYPE</div>
                  <div className="text-indigo-400 font-bold">{selectedNode.type}</div>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-500 text-[9px]">ID</div>
                  <div className="text-slate-300 truncate">{selectedNode.id}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-mono text-slate-400">Connected Relations</div>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {tenantEdges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((edge) => {
                      const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                      const other = tenantNodes.find((n) => n.id === otherId);
                      return (
                        <div
                          key={edge.id}
                          className="p-1.5 bg-slate-950 rounded border border-slate-800 text-[10px] font-mono flex items-center justify-between text-slate-300"
                        >
                          <span className="text-indigo-400 font-semibold">{edge.relation}</span>
                          <span className="text-slate-400 truncate">{other?.label || otherId}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <button
                onClick={() => {
                  deleteGraphNode(selectedNode.id);
                  setSelectedNode(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-mono text-xs transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Entity</span>
              </button>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 font-mono text-xs space-y-2">
              <Layers className="h-6 w-6 mx-auto text-slate-700" />
              <p>Select any node on the graph canvas to inspect properties and relationships.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Entity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddEntity}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-md space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold font-mono text-slate-200 uppercase">
                Create Knowledge Graph Entity
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Entity Label Name</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g., FIDO2 MFA Security Policy"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Entity Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as KGNode['type'])}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono outline-none"
                >
                  <option value="Policy">Policy</option>
                  <option value="Document">Document</option>
                  <option value="Agent">Agent</option>
                  <option value="User">User</option>
                  <option value="Service">Service</option>
                  <option value="DataAsset">DataAsset</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Connect To Existing Node</label>
                <select
                  value={connectToNodeId}
                  onChange={(e) => setConnectToNodeId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono outline-none"
                >
                  <option value="">None (Standalone Node)</option>
                  {tenantNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.type})
                    </option>
                  ))}
                </select>
              </div>

              {connectToNodeId && (
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Relationship Type</label>
                  <select
                    value={relationType}
                    onChange={(e) => setRelationType(e.target.value as KGEdge['relation'])}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono outline-none"
                  >
                    <option value="GOVERNS">GOVERNS</option>
                    <option value="ACCESSES">ACCESSES</option>
                    <option value="BELONGS_TO">BELONGS_TO</option>
                    <option value="INDEXES">INDEXES</option>
                    <option value="HAS_ROLE">HAS_ROLE</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono font-semibold text-xs transition-colors"
            >
              Upsert Entity to Graph
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
