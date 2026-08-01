import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import {
  FileText,
  Search,
  UploadCloud,
  FileCode,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Brain,
} from 'lucide-react';

export const DocumentsOCRView: React.FC = () => {
  const { documents, addLog } = useAgentStore();
  const [search, setSearch] = useState('');
  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id || 'doc_1');

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase mb-1">
            <FileText className="h-4 w-4" /> OCR &amp; Knowledge Vector Pipeline
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Documents &amp; Contract OCR</h2>
          <p className="text-xs text-slate-400 font-mono">
            Automatic OCR extraction, key entity parsing, and pgvector embeddings with strict RLS permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer">
            <UploadCloud className="h-4 w-4" />
            <span>Upload Document (PDF/Doc)</span>
            <input type="file" className="hidden" onChange={() => alert('Simulated OCR Ingestion Pipeline Started for uploaded document!')} />
          </label>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents List */}
        <div className="space-y-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contracts, invoices..."
              className="bg-transparent text-white outline-none w-full text-xs font-mono placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            {filteredDocs.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer font-mono text-xs ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-indigo-400 uppercase">{doc.type || doc.mimeType}</span>
                    <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> OCR Indexed
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white font-sans truncate mb-1">{doc.title}</h4>
                  <p className="text-[10px] text-slate-500">
                    Uploaded: {doc.uploadedAt || doc.createdAt?.split('T')[0] || '2026-07-28'} • Size: {doc.fileSize || '1.2 MB'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* OCR Entity Inspector */}
        {selectedDoc && (
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-cyan-400 uppercase font-bold">{selectedDoc.type || selectedDoc.mimeType} DOCUMENT</span>
                <h3 className="text-base font-bold text-white font-sans">{selectedDoc.title}</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold">
                pgvector Embedded (1536d)
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Extracted Executive Summary</span>
              <p className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 leading-relaxed font-sans text-xs">
                {selectedDoc.summary}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Extracted Structured Entities (JSON)</span>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-cyan-300 text-[11px] overflow-x-auto space-y-1">
                {(
                  selectedDoc.ocrEntities ||
                  (selectedDoc.extractedData
                    ? Object.entries(selectedDoc.extractedData).map(([k, v]) => ({ key: k, value: String(v) }))
                    : [])
                ).map((ent, idx) => (
                  <div key={idx} className="flex justify-between border-b border-slate-900 pb-1">
                    <span className="text-slate-400">{ent.key}:</span>
                    <span className="font-bold text-white">{ent.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-slate-500 text-[10px]">
              <span>Row Level Security: Tenant RLS Enforced</span>
              <span>Vector Hash: 0x948f...b201</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
