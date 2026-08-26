const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// The error says "JSX expressions must have one parent element" inside renderSelectSample.
// Let's replace the ENTIRE renderSelectSample up to renderTestingList exactly to ensure no syntax errors.

const regex = /const renderSelectSample = \(\) => \([\s\S]*?const renderTestingList = \(\) => \(/;

const replacement = `const renderSelectSample = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <button onClick={() => setView('dashboard')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Population: {selectedPopulation?.fileName}
          </h2>
          {addSuccessMsg && (
            <div className="mt-2 text-sm font-medium text-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
               <CheckCircle2 className="w-4 h-4" /> {addSuccessMsg}
            </div>
          )}
          <div className="mt-2 text-sm text-indigo-400">
             <button onClick={() => setView('testing_list')} className="underline">View Selected Transactions ({testingTransactions.length})</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-slate-400">Selected: </span>
            <span className="font-bold text-indigo-400">{selectedRowIds.size}</span>
          </div>
          <button 
            onClick={handleAddSelectedToTesting}
            disabled={selectedRowIds.size === 0}
            className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${
              selectedRowIds.size > 0 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }\`}
          >
            Add Selected to Testing
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="py-3 px-4 w-12 text-center text-xs font-semibold text-slate-400 uppercase">Select</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Transaction ID</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Date</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Vendor / Customer / Employee</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Description</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {populationTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                   No transaction records found in this population.
                </td>
              </tr>
            ) : null}
            {populationTransactions.map(tx => (
              <tr key={tx.id} className={\`hover:bg-slate-800/50 transition-colors \${addedTxIds.has(tx.id) ? 'bg-slate-900/50 opacity-70' : 'cursor-pointer'} \${selectedRowIds.has(tx.id) ? 'bg-indigo-900/20' : ''}\`} onClick={() => !addedTxIds.has(tx.id) && toggleRowSelection(tx.id)}>
                <td className="py-3 px-4 text-center">
                  {addedTxIds.has(tx.id) ? (
                     <span className="text-xs font-bold text-emerald-500 uppercase">Added</span>
                  ) : (
                     <div className={\`w-4 h-4 mx-auto rounded border \${selectedRowIds.has(tx.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}\`}>
                       {selectedRowIds.has(tx.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                     </div>
                  )}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-slate-200">{tx.id}</td>
                <td className="py-3 px-4 text-sm text-slate-400">{tx.date}</td>
                <td className="py-3 px-4 text-sm text-slate-300">{tx.entity}</td>
                <td className="py-3 px-4 text-sm text-slate-400">{tx.desc}</td>
                <td className="py-3 px-4 text-sm font-medium text-indigo-400 text-right">{tx.amount === null ? '—' : formatCurrency(tx.amount, currencyMode)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTestingList = () => (`;

code = code.replace(regex, replacement);

// Now fix renderSummary table to list ALL tested txs, not just exceptions, and make them clickable.
// Also remove sampling method references in Summary.
const summaryMatch = /const renderSummary = \(\) => \{[\s\S]*?\};\n/g;
// actually I'll just rewrite renderSummary manually.

code = code.replace(/<label className="text-xs font-semibold text-slate-500 uppercase">Sampling Method<\/label>[\s\S]*?<\/div>\n\s*<div>\n\s*<label className="text-xs font-semibold text-slate-500 uppercase">Population Size<\/label>/g, '<label className="text-xs font-semibold text-slate-500 uppercase">Population Size</label>');

fs.writeFileSync('src/components/SamplingView.tsx', code);
