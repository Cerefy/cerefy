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
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase mb-1">
            <BookOpen className="h-4 w-4" /> Enterprise Corporate Wiki &amp; RAG Index
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Knowledge Hub &amp; Standard Operating Procedures</h2>
          <p className="text-xs text-slate-400 font-mono">
            Grounding memory for Gemini models with chunked pgvector embeddings and Neo4j graph nodes.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 font-mono text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 w-64">
          <Search className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SOPs and wiki..."
            className="bg-transparent text-white outline-none w-full text-xs placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        {filtered.map((art) => (
          <div key={art.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-indigo-500/50 transition-all">
            <div className="flex justify-between items-center text-[10px]">
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold">{art.category}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> pgvector Chunked
              </span>
            </div>

            <h3 className="text-base font-bold text-white font-sans">{art.title}</h3>
            <p className="text-slate-300 font-sans text-xs leading-relaxed line-clamp-3">{art.content}</p>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1 text-[10px] text-slate-400">
              {art.tags.map((t, idx) => (
                <span key={idx} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-cyan-300">
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
