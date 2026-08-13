import React, { useEffect, useMemo, useState } from 'react';
import { Info, Layers, Network, RefreshCw, Tag } from 'lucide-react';
import { useKnowledgeGraph } from '../hooks/useApi';
import { EmptyState, ErrorState, LoadingState } from './design-system';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  source: string;
}

interface GraphLink {
  source: string;
  target: string;
  relation: string;
}

interface GraphPayload {
  query?: string;
  records?: GraphNode[];
  links?: GraphLink[];
}

function asGraphPayload(value: unknown): GraphPayload {
  if (!value || typeof value !== 'object') return {};
  const payload = value as GraphPayload;
  return {
    query: typeof payload.query === 'string' ? payload.query : undefined,
    records: Array.isArray(payload.records) ? payload.records.filter((record): record is GraphNode =>
      Boolean(record && typeof record.id === 'string' && typeof record.label === 'string' && typeof record.type === 'string'),
    ) : [],
    links: Array.isArray(payload.links) ? payload.links.filter((link): link is GraphLink =>
      Boolean(link && typeof link.source === 'string' && typeof link.target === 'string' && typeof link.relation === 'string'),
    ) : [],
  };
}

export const KnowledgeGraphView: React.FC = () => {
  const knowledgeGraph = useKnowledgeGraph();
  const [filterType, setFilterType] = useState('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    knowledgeGraph.mutate(undefined);
    // The graph is a read-only request on initial view load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const graph = asGraphPayload(knowledgeGraph.data);
  const nodes = graph.records ?? [];
  const links = graph.links ?? [];
  const types = useMemo(() => Array.from(new Set(nodes.map((node) => node.type))).sort(), [nodes]);
  const visibleNodes = filterType === 'ALL' ? nodes : nodes.filter((node) => node.type === filterType);

  useEffect(() => {
    if (visibleNodes.length === 0) {
      setSelectedNodeId(null);
      return;
    }
    if (!selectedNodeId || !visibleNodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(visibleNodes[0].id);
    }
  }, [selectedNodeId, visibleNodes]);

  const selectedNode = visibleNodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedLinks = selectedNode
    ? links.filter((link) => link.source === selectedNode.label || link.target === selectedNode.label)
    : [];

  if (knowledgeGraph.isPending && !knowledgeGraph.data) {
    return <LoadingState label="Loading knowledge graph" rows={3} />;
  }

  if (knowledgeGraph.isError && !knowledgeGraph.data) {
    return (
      <ErrorState
        title="Unable to load knowledge graph"
        message={knowledgeGraph.error instanceof Error ? knowledgeGraph.error.message : undefined}
        variant="backend-unavailable"
        onRetry={() => knowledgeGraph.mutate(undefined)}
      />
    );
  }

  if (nodes.length === 0) {
    return (
      <section className="space-y-4" aria-labelledby="knowledge-graph-heading">
        <header className="bento-card rounded-xl p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
              <Network className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 id="knowledge-graph-heading" className="font-headline text-xl font-semibold text-on-surface">Knowledge Graph</h1>
              <p className="mt-1 text-sm text-on-surface-variant">Persisted graph entities returned by the graph API.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => knowledgeGraph.mutate(undefined)}
            disabled={knowledgeGraph.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
          </button>
        </header>
        {knowledgeGraph.isError ? (
          <ErrorState
            title="Unable to refresh knowledge graph"
            message={knowledgeGraph.error instanceof Error ? knowledgeGraph.error.message : undefined}
            variant="backend-unavailable"
            onRetry={() => knowledgeGraph.mutate(undefined)}
          />
        ) : (
          <EmptyState
            icon="account_tree"
            title="No graph entities"
            description="The knowledge graph API returned no persisted entities for this workspace."
          />
        )}
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-labelledby="knowledge-graph-heading">
      <header className="bento-card rounded-xl p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
            <Network className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 id="knowledge-graph-heading" className="font-headline text-xl font-semibold text-on-surface">Knowledge Graph</h1>
            <p className="mt-1 text-sm text-on-surface-variant">Read-only entities and relations returned by the graph API.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => knowledgeGraph.mutate(undefined)}
          disabled={knowledgeGraph.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${knowledgeGraph.isPending ? 'animate-spin' : ''}`} aria-hidden="true" />
          {knowledgeGraph.isPending ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {knowledgeGraph.isError && (
        <ErrorState
          title="Knowledge graph refresh failed"
          message={knowledgeGraph.error instanceof Error ? knowledgeGraph.error.message : undefined}
          variant="backend-unavailable"
          onRetry={() => knowledgeGraph.mutate(undefined)}
        />
      )}

      <div className="bento-card rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Tag className="h-4 w-4" aria-hidden="true" />
          <span>Entity type</span>
          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface outline-none"
          >
            <option value="ALL">All types ({nodes.length})</option>
            {types.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        {graph.query && <span className="text-xs font-label text-on-surface-variant">Query: {graph.query}</span>}
      </div>

      {visibleNodes.length === 0 ? (
        <EmptyState
          icon="filter_alt_off"
          title="No matching graph entities"
          description="No persisted graph entities match the selected entity type."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2" aria-label="Knowledge graph entities">
            {visibleNodes.map((node) => {
              const selected = selectedNode?.id === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`rounded-xl border p-4 text-start transition-colors ${
                    selected
                      ? 'border-primary bg-primary-container'
                      : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
                  }`}
                  aria-pressed={selected}
                >
                  <p className="font-headline text-sm font-semibold text-on-surface">{node.label}</p>
                  <p className="mt-1 text-xs font-label text-primary">{node.type}</p>
                  <p className="mt-3 text-xs text-on-surface-variant">Source: {node.source || '—'}</p>
                </button>
              );
            })}
          </div>

          {selectedNode && (
            <aside className="bento-card rounded-xl p-6 space-y-5" aria-label="Selected graph entity details">
              <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
                <Info className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Entity details</h2>
              </div>
              <dl className="space-y-3 text-sm">
                <div><dt className="font-label text-xs text-on-surface-variant">Label</dt><dd className="mt-1 text-on-surface">{selectedNode.label}</dd></div>
                <div><dt className="font-label text-xs text-on-surface-variant">Type</dt><dd className="mt-1 text-on-surface">{selectedNode.type}</dd></div>
                <div><dt className="font-label text-xs text-on-surface-variant">Source</dt><dd className="mt-1 text-on-surface">{selectedNode.source || '—'}</dd></div>
              </dl>
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                  <Layers className="h-4 w-4" aria-hidden="true" /> Relations
                </h3>
                {selectedLinks.length === 0 ? (
                  <EmptyState
                    icon="link_off"
                    title="No returned relations"
                    description="The graph API returned no relations for this entity."
                    className="p-5"
                  />
                ) : (
                  <div className="space-y-2">
                    {selectedLinks.map((link) => {
                      const otherEntity = link.source === selectedNode.label ? link.target : link.source;
                      return (
                        <div key={`${link.source}-${link.relation}-${link.target}`} className="rounded-lg bg-surface-container p-3 text-sm">
                          <p className="font-semibold text-primary">{link.relation}</p>
                          <p className="mt-1 text-on-surface">{otherEntity}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      )}
    </section>
  );
};

export default KnowledgeGraphView;
