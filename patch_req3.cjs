const fs = require('fs');
let code = fs.readFileSync('src/components/RequiredDataQuestionnaire.tsx', 'utf-8');

// Add Sample ID to header
code = code.replace(
    /<div className="flex flex-col">\s*<span className="text-slate-500 font-bold uppercase tracking-wider text-\[10px\]">Voucher No<\/span>/,
    `<div className="flex flex-col">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Sample ID</span>
                <span className="font-mono text-slate-200">{transaction.id}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Voucher No</span>`
);

// Add View / Download buttons to Evidence Control
// Currently:
//                          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 text-sm">
//                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
//                            <span className="font-medium truncate max-w-[200px]">{documents[q.dbId]}</span>
//                            {(!isDistributor || isReviewMode) ? null : (

let evidenceReplacement = `                          <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span className="font-medium truncate max-w-[200px]">{documents[q.dbId]}</span>
                            {(!isDistributor || isReviewMode) ? null : (
                              <button 
                                onClick={() => {
                                  const newDocs = {...documents};
                                  delete newDocs[q.dbId];
                                  setDocuments(newDocs);
                                }}
                                className="ml-2 hover:text-rose-400 transition-colors"
                                title="Remove File"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <button className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors" onClick={() => alert('Viewing document...')}>View Document</button>
                          <button className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors" onClick={() => alert('Downloading document...')}>Download</button>
                          </div>`;

code = code.replace(
    /<div className="flex items-center gap-2 px-3 py-1\.5 bg-indigo-500\/10 border border-indigo-500\/20 rounded-lg text-indigo-300 text-sm">[\s\S]*?<\/button>\s*\)\}\s*<\/div>/,
    evidenceReplacement
);

fs.writeFileSync('src/components/RequiredDataQuestionnaire.tsx', code);
