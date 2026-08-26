const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const overviewBodyAnchor = `<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 grid grid-cols-2 gap-8">`;
const replacement = `{populationError ? (
        <div className="bg-slate-900 border border-rose-900/50 rounded-xl p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Unable to load population records from this file.</h3>
          <p className="text-sm text-slate-400 mb-6">{populationError}</p>
          <button 
            onClick={() => handleSelectPopulation(selectedPopulation)}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 grid grid-cols-2 gap-8">
          <div className="space-y-4">
             <div>
                <label className="text-sm text-slate-400">Population File</label>
                <div className="font-medium text-slate-200">{selectedPopulation?.fileName}</div>
             </div>
             <div>
                <label className="text-sm text-slate-400">Distributor</label>
                <div className="font-medium text-slate-200">{selectedDistributor}</div>
             </div>
             <div>
                <label className="text-sm text-slate-400">Population Type</label>
                <div className="font-medium text-slate-200">{selectedPopulation?.type}</div>
             </div>
             <div>
                <label className="text-sm text-slate-400">Source</label>
                <div className="font-medium text-slate-200">{selectedPopulation?.source}</div>
             </div>
          </div>
          <div className="space-y-4">
             <div>
                <label className="text-sm text-slate-400">Audit Period</label>
                <div className="font-medium text-slate-200">{selectedPopulation?.period}</div>
             </div>
             <div>
                <label className="text-sm text-slate-400">Total Records</label>
                <div className="font-medium text-slate-200">{totalRecords.toLocaleString()}</div>
             </div>
             <div>
                <label className="text-sm text-slate-400">Total Population Value</label>
                <div className="font-medium text-slate-200">{formatCurrency(totalValue, currencyMode)}</div>
             </div>
             <div>
                <label className="text-sm text-slate-400">Status</label>
                <div className="font-medium text-emerald-400">Available for Sampling</div>
             </div>
          </div>
        </div>
      )}`;
      
const fullAnchor = `<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 grid grid-cols-2 gap-8">
        <div className="space-y-4">
           <div>
              <label className="text-sm text-slate-400">Population File</label>
              <div className="font-medium text-slate-200">{selectedPopulation?.fileName}</div>
           </div>
           <div>
              <label className="text-sm text-slate-400">Distributor</label>
              <div className="font-medium text-slate-200">{selectedDistributor}</div>
           </div>
           <div>
              <label className="text-sm text-slate-400">Population Type</label>
              <div className="font-medium text-slate-200">{selectedPopulation?.type}</div>
           </div>
           <div>
              <label className="text-sm text-slate-400">Source</label>
              <div className="font-medium text-slate-200">{selectedPopulation?.source}</div>
           </div>
        </div>
        <div className="space-y-4">
           <div>
              <label className="text-sm text-slate-400">Audit Period</label>
              <div className="font-medium text-slate-200">{selectedPopulation?.period}</div>
           </div>
           <div>
              <label className="text-sm text-slate-400">Total Records</label>
              <div className="font-medium text-slate-200">{totalRecords.toLocaleString()}</div>
           </div>
           <div>
              <label className="text-sm text-slate-400">Total Population Value</label>
              <div className="font-medium text-slate-200">{formatCurrency(totalValue, currencyMode)}</div>
           </div>
           <div>
              <label className="text-sm text-slate-400">Status</label>
              <div className="font-medium text-emerald-400">Available for Sampling</div>
           </div>
        </div>
      </div>`;
      
code = code.replace(fullAnchor, replacement);

fs.writeFileSync('src/components/SamplingView.tsx', code);
