import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { FileCode, FileText, Search, Database, Cpu, CheckCircle2, Sparkles, Sliders } from 'lucide-react';

export const IngestionPipeline: React.FC = () => {
  const { documents, chunks, activeTenantId, ingestDocumentLocal, queryVectorStoreLocal } =
    useAgentStore();

  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [chunkSize, setChunkSize] = useState(300);
  const [chunkOverlap, setChunkOverlap] = useState(40);
  const [isIngesting, setIsIngesting] = useState(false);

  // Semantic Search Sandbox State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultChunks, setSearchResultChunks] = useState<any[]>([]);

  const tenantDocs = documents.filter((d) => d.tenantId === activeTenantId);
  const tenantChunks = chunks.filter((c) => c.tenantId === activeTenantId);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docContent) return;

    setIsIngesting(true);
    try {
      await ingestDocumentLocal(docTitle, docContent);
      setDocTitle('');
      setDocContent('');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleSearchVectorStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const results = queryVectorStoreLocal(searchQuery);
    setSearchResultChunks(results);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-6 text-slate-100 shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileCode className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
              Document Ingestion & Chunking Pipeline
            </h3>
            <p className="text-[11px] text-slate-400">
              Recursive Text Splitter & pgvector (1536-dim) Embedding Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Database className="h-3.5 w-3.5 text-emerald-400" />
          <span>{tenantChunks.length} Chunks Vectorized</span>
        </div>
      </div>

      {/* Main Grid: Form + Chunking Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Ingestion Form */}
        <form onSubmit={handleIngest} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-400" /> Ingest Raw Document
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Document Title / File Name</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g., SOC2_Type_II_Security_Standard_2026.txt"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 flex items-center justify-between">
                  <span>Chunk Size</span>
                  <span className="text-emerald-400">{chunkSize} chars</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 flex items-center justify-between">
                  <span>Chunk Overlap</span>
                  <span className="text-blue-400">{chunkOverlap} chars</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="10"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Raw Content Body</label>
              <textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Paste enterprise policy text, security compliance guidelines, or legal contracts..."
                rows={5}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-emerald-500 leading-relaxed font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isIngestionInFlight(isIngesting)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Cpu className="h-4 w-4" />
            <span>Chunk & Generate pgvector Embeddings</span>
          </button>
        </form>

        {/* Existing Documents & Chunk Inspection */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-emerald-400" /> Vectorized Document Store
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {tenantDocs.length} Documents Ingested
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {tenantDocs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                No documents ingested for this tenant yet.
              </div>
            ) : (
              tenantDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs font-mono"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-200 truncate">{doc.title}</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      {doc.chunkCount} Chunks
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed bg-slate-900/80 p-2 rounded">
                    "{doc.rawContent}"
                  </p>

                  <div className="text-[10px] text-slate-500 flex justify-between items-center">
                    <span>MIME: {doc.mimeType}</span>
                    <span>Created: {new Date(doc.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Semantic Search Sandbox */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-blue-400" /> Vector Similarity Query Sandbox
          </span>
          <span className="text-[10px] font-mono text-slate-500">Cosine Distance Matches</span>
        </div>

        <form onSubmit={handleSearchVectorStore} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type semantic query e.g., 'What are the MFA requirements for OAuth tokens?'"
            className="flex-1 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Search pgvector</span>
          </button>
        </form>

        {searchResultChunks.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Top Similarity Search Results
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResultChunks.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-950 rounded-lg border border-blue-500/30 space-y-1.5 font-mono text-xs"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-blue-400 font-semibold">Chunk #{c.chunkIndex}</span>
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      Score: {c.similarityScore}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900 p-2 rounded">
                    "{c.content}"
                  </p>
                  <div className="text-[9px] text-slate-500">
                    Vector Sample: [{c.embedding.slice(0, 4).map((n: number) => n.toFixed(2)).join(', ')}, ...]
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function isIngestionInFlight(val: boolean) {
  return val;
}
