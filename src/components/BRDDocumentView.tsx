import React, { useState } from 'react';
import { BRD_DOCUMENT_DATA } from '../data/brdData';
import { 
  FileText, 
  Search, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  Bookmark, 
  ShieldCheck, 
  List, 
  ChevronRight,
  Sparkles,
  FileCheck2
} from 'lucide-react';

export const BRDDocumentView: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>('sec-1');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const filteredSections = BRD_DOCUMENT_DATA.filter((sec) => {
    const titleMatch = sec.title.toLowerCase().includes(searchTerm.toLowerCase());
    const summaryMatch = sec.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || summaryMatch;
  });

  const activeSec = BRD_DOCUMENT_DATA.find(s => s.id === activeSectionId) || BRD_DOCUMENT_DATA[0];

  const handleCopyFullBRD = () => {
    const fullText = BRD_DOCUMENT_DATA.map(sec => `## Section ${sec.number}: ${sec.title}\n${sec.summary}\n\n${sec.content.overview || ''}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 text-slate-200">
      
      {/* Document Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>Formal BRD Specification v2.4</span>
              </span>
              <span className="text-xs text-slate-400">Approved for Development</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Data360 - Business Requirements Document
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Complete 14-section architectural specification for the enterprise multi-client SaaS audit platform.
            </p>
          </div>

          {/* Action Tools: Copy & Print */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCopyFullBRD}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-indigo-400" />}
              <span>{copied ? 'Copied BRD Text!' : 'Copy Full BRD'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Export PDF / Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left TOC Sidebar, Right Active Section Document Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4 cols): Interactive Table of Contents */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm self-start">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Table of Contents</h2>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              14 Sections
            </span>
          </div>

          {/* Search Bar for Sections */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search BRD sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* List of 14 Sections */}
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {filteredSections.map((sec) => {
              const isSelected = sec.id === activeSectionId;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20' 
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <span className={`h-5 w-5 rounded shrink-0 flex items-center justify-center font-mono text-[11px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {sec.number}
                  </span>
                  <div className="truncate">
                    <p className="truncate font-medium">{sec.title}</p>
                    <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {sec.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 cols): Document Section Reader */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
          
          {/* Section Heading Header */}
          <div className="border-b border-slate-800 pb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                BRD Section {activeSec.number} of 14
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Bookmark className="h-3.5 w-3.5 text-indigo-400" />
                <span>Ref ID: BRD-D360-{activeSec.number.toString().padStart(2, '0')}</span>
              </span>
            </div>
            
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{activeSec.title}</h2>
            <p className="text-xs text-slate-300 font-medium italic border-l-2 border-indigo-500 pl-3 py-1 bg-slate-950/40 rounded-r">
              "{activeSec.summary}"
            </p>
          </div>

          {/* Section Content Rendering */}
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            
            {/* Overview paragraph */}
            {activeSec.content.overview && (
              <p className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-slate-200">
                {activeSec.content.overview}
              </p>
            )}

            {/* List items if present */}
            {activeSec.content.items && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Detailed Scope Items</h3>
                <ul className="space-y-2">
                  {activeSec.content.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg text-xs text-slate-200">
                      <ChevronRight className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Subsections if present */}
            {activeSec.content.subsections && (
              <div className="space-y-4">
                {activeSec.content.subsections.map((sub, sIdx) => (
                  <div key={sIdx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                      <span>{sub.subtitle}</span>
                    </h3>
                    
                    {Array.isArray(sub.details) ? (
                      <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-300">
                        {sub.details.map((d, dIdx) => (
                          <li key={dIdx}>{d}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-300">{sub.details}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tables if present */}
            {activeSec.content.table && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Specification Matrix</h3>
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      <tr>
                        {activeSec.content.table.headers.map((h, hIdx) => (
                          <th key={hIdx} className="py-2.5 px-3 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeSec.content.table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className={`py-3 px-3 ${cIdx === 0 ? 'font-bold text-white' : ''}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Section Navigator */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              disabled={activeSec.number <= 1}
              onClick={() => {
                const prev = BRD_DOCUMENT_DATA.find(s => s.number === activeSec.number - 1);
                if (prev) setActiveSectionId(prev.id);
              }}
              className="text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors font-medium cursor-pointer"
            >
              &larr; Previous Section
            </button>

            <span className="text-xs text-slate-500 font-mono">
              Section {activeSec.number} of 14
            </span>

            <button
              disabled={activeSec.number >= 14}
              onClick={() => {
                const next = BRD_DOCUMENT_DATA.find(s => s.number === activeSec.number + 1);
                if (next) setActiveSectionId(next.id);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold disabled:opacity-30 transition-colors cursor-pointer"
            >
              Next Section &rarr;
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
