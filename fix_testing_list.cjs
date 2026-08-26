const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const anchor = `<div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div>
          <button onClick={() => setView('population')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Population
          </button>
          <h2 className="text-2xl font-bold text-white">Selected Transactions</h2>
        </div>
        <button 
          onClick={() => setView('summary')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          View Testing Summary
        </button>
      </div>`;
      
const replacement = `<div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <button onClick={() => setView('sampling_plan')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Sampling Plan
          </button>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Selected Sample</h2>
        </div>
        <button 
          onClick={() => setView('summary')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          View Testing Summary
        </button>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
         <div className="grid grid-cols-4 gap-6">
           <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Population File</label>
              <div className="text-sm font-medium text-slate-200 mt-1">{selectedPopulation?.fileName}</div>
           </div>
           <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Sampling Method</label>
              <div className="text-sm font-medium text-slate-200 mt-1">{samplingMethod}</div>
           </div>
           <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Sample Size</label>
              <div className="text-sm font-bold text-indigo-400 mt-1">{testingTransactions.length} transactions</div>
           </div>
           <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Selected Value</label>
              <div className="text-sm font-bold text-emerald-400 mt-1">{formatCurrency(testingTransactions.reduce((acc, t) => acc + (t.amount || 0), 0), currencyMode)}</div>
           </div>
           {samplingMethod === 'Judgmental / Targeted' && selectionRationale && (
             <div className="col-span-4 mt-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Selection Rationale</label>
                <div className="text-sm text-slate-300 mt-1 italic">"{selectionRationale}"</div>
             </div>
           )}
         </div>
      </div>`;
      
code = code.replace(anchor, replacement);

fs.writeFileSync('src/components/SamplingView.tsx', code);
