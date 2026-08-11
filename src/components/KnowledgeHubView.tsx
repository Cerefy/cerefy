import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import {
  BookOpen,
  Search,
  FileCode,
  CheckCircle2,
  Lock,
  Plus,
  Brain,
  Sparkles,
} from 'lucide-react';

export const KnowledgeHubView: React.FC = () => {
  const { knowledgeArticles, addLog } = useAgentStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Architecture', 'Security', 'Sales & Compliance', 'DevOps'];

  const filtered = knowledgeArticles.filter((a) => {
    const matchCat = selectedCategory === 'ALL' || a.category === selectedCategory;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="bg-slate-panel border border-slate-panel-raised p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-signal-strong font-mono text-xs font-bold uppercase mb-1">
            <BookOpen className="h-4 w-4" /> Enterprise Corporate Wiki &amp; RAG Index
          </div>
          <h2 className="text-xl font-bold text-dark-text-bright tracking-tight">Knowledge Hub &amp; Standard Operating Procedures</h2>
          <p className="text-xs text-slate-muted-strong font-mono">
            Grounding memory for Gemini models with chunked pgvector embeddings and Neo4j graph nodes.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-panel/80 p-4 rounded-xl border border-slate-panel-raised font-mono text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat ? 'bg-indigo-signal-deep text-dark-text-bright font-bold' : 'bg-slate-deep text-slate-muted-strong hover:text-dark-text-bright border border-slate-panel-raised'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-slate-deep border border-slate-panel-raised rounded-lg px-3 py-1.5 w-64">
          <Search className="h-4 w-4 text-slate-muted me-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SOPs and wiki..."
            className="bg-transparent text-dark-text-bright outline-none w-full text-xs placeholder:text-slate-muted"
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        {filtered.map((art) => (
          <div key={art.id} className="bg-slate-panel/90 border border-slate-panel-raised rounded-2xl p-5 space-y-3 hover:border-indigo-signal/50 transition-all">
            <div className="flex justify-between items-center text-[10px]">
              <span className="px-2 py-0.5 bg-indigo-signal/20 text-indigo-signal-soft rounded font-bold">{art.category}</span>
              <span className="text-emerald-signal-strong flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> pgvector Chunked
              </span>
            </div>

            <h3 className="text-base font-bold text-dark-text-bright font-sans">{art.title}</h3>
            <p className="text-slate-text-muted font-sans text-xs leading-relaxed line-clamp-3">{art.content}</p>

            <div className="pt-2 border-t border-slate-panel-raised/80 flex flex-wrap gap-1 text-[10px] text-slate-muted-strong">
              {art.tags.map((t, idx) => (
                <span key={idx} className="bg-slate-deep px-1.5 py-0.5 rounded border border-slate-panel-raised text-cyan-signal-soft">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
