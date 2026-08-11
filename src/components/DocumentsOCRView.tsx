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
      <div className="bg-slate-panel border border-slate-panel-raised p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-signal-strong font-mono text-xs font-bold uppercase mb-1">
            <FileText className="h-4 w-4" /> OCR &amp; Knowledge Vector Pipeline
          </div>
          <h2 className="text-xl font-bold text-dark-text-bright tracking-tight">Documents &amp; Contract OCR</h2>
          <p className="text-xs text-slate-muted-strong font-mono">
            Automatic OCR extraction, key entity parsing, and pgvector embeddings with strict RLS permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="px-4 py-2.5 bg-gradient-to-r from-indigo-signal-deep to-cyan-signal-deep hover:from-indigo-signal hover:to-cyan-signal text-dark-text-bright font-mono font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer">
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
          <div className="flex items-center bg-slate-panel border border-slate-panel-raised rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-slate-muted me-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contracts, invoices..."
              className="bg-transparent text-dark-text-bright outline-none w-full text-xs font-mono placeholder:text-slate-muted"
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
                      ? 'bg-indigo-signal-ink/60 border-indigo-signal shadow-md'
                      : 'bg-slate-panel border-slate-panel-raised hover:border-slate-panel-soft'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-indigo-signal-strong uppercase">{doc.type || doc.mimeType}</span>
                    <span className="text-emerald-signal-strong text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> OCR Indexed
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-dark-text-bright font-sans truncate mb-1">{doc.title}</h4>
                  <p className="text-[10px] text-slate-muted">
                    Uploaded: {doc.uploadedAt || doc.createdAt?.split('T')[0] || '2026-07-28'} • Size: {doc.fileSize || '1.2 MB'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* OCR Entity Inspector */}
        {selectedDoc && (
          <div className="lg:col-span-2 bg-slate-panel/90 border border-slate-panel-raised rounded-2xl p-6 space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-panel-raised pb-4">
              <div>
                <span className="text-xs text-cyan-signal-strong uppercase font-bold">{selectedDoc.type || selectedDoc.mimeType} DOCUMENT</span>
                <h3 className="text-base font-bold text-dark-text-bright font-sans">{selectedDoc.title}</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-signal/20 text-emerald-signal-soft border border-emerald-signal/40 rounded-lg text-[10px] font-bold">
                pgvector Embedded (1536d)
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-slate-muted-strong font-bold uppercase text-[10px]">Extracted Executive Summary</span>
              <p className="p-4 bg-slate-deep border border-slate-panel-raised rounded-xl text-slate-text leading-relaxed font-sans text-xs">
                {selectedDoc.summary}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-slate-muted-strong font-bold uppercase text-[10px]">Extracted Structured Entities (JSON)</span>
              <div className="p-4 bg-slate-deep border border-slate-panel-raised rounded-xl font-mono text-cyan-signal-soft text-[11px] overflow-x-auto space-y-1">
                {(
                  selectedDoc.ocrEntities ||
                  (selectedDoc.extractedData
                    ? Object.entries(selectedDoc.extractedData).map(([k, v]) => ({ key: k, value: String(v) }))
                    : [])
                ).map((ent, idx) => (
                  <div key={idx} className="flex justify-between border-b border-slate-panel pb-1">
                    <span className="text-slate-muted-strong">{ent.key}:</span>
                    <span className="font-bold text-dark-text-bright">{ent.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-slate-muted text-[10px]">
              <span>Row Level Security: Tenant RLS Enforced</span>
              <span>Vector Hash: 0x948f...b201</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
