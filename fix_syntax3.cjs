const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const regex = /<div className="flex gap-3">.*?1071-              <button /s; // this is not going to work with line numbers

const start = code.indexOf('<div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">');
const end = code.indexOf('<div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-12">');

if (start !== -1 && end !== -1) {
  const newBlock = `
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <button onClick={() => setView('testing_list')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Selected Transactions
            </button>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
              Transaction Testing
              <span className="ml-3 text-sm font-medium text-slate-400">
                Testing {testingTransactions.findIndex(t => t.id === selectedTransaction.id) + 1} of {testingTransactions.length}
              </span>
            </h2>
          </div>
          <div className="flex gap-3">
          {!saveSuccess ? (
            <button 
              onClick={handleSaveReview}
              disabled={isSaving}
              className={\`px-6 py-2 rounded-lg text-sm font-medium transition-colors \${isSaving ? 'bg-slate-700 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}\`}
            >
              {isSaving ? 'Saving...' : 'Save Test Result'}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> Test Result Saved Successfully
              </span>
              <button 
                 onClick={() => {
                    const idx = testingTransactions.findIndex(t => t.id === selectedTransaction.id);
                    if (idx < testingTransactions.length - 1) {
                       handleReviewClick(testingTransactions[idx + 1]);
                    } else {
                       setView('summary');
                    }
                 }}
                 className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                 {testingTransactions.findIndex(t => t.id === selectedTransaction.id) < testingTransactions.length - 1 ? 'Next Transaction' : 'Finish Testing'}
              </button>
            </div>
          )}
          </div>
        </div>

        {validationError && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{validationError}</p>
          </div>
        )}
        {saveSuccess && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Transaction Testing Result</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Transaction:</span>
                  <span className="text-sm font-bold text-white">{selectedTransaction.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Status:</span>
                  <span className={\`px-2.5 py-0.5 rounded-full text-xs font-bold \${
                    selectedTransaction.outcome === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    selectedTransaction.outcome === 'Exception' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    selectedTransaction.outcome === 'See Comments' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-800 text-slate-400'
                  }\`}>
                    {selectedTransaction.outcome?.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Completed:</span>
                  <span className="text-sm font-medium text-white">{template.length} / {template.length} Attributes</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Testing Summary</h3>
              <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                <div>
                  <p className="text-xs text-slate-500">Total Selected</p>
                  <p className="text-xl font-bold text-white">{testingTransactions.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Completed</p>
                  <p className="text-xl font-bold text-indigo-400">{testingTransactions.filter(t => t.reviewStatus === 'Reviewed').length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Incomplete</p>
                  <p className="text-xl font-bold text-amber-400">{testingTransactions.length - testingTransactions.filter(t => t.reviewStatus === 'Reviewed').length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Passed</p>
                  <p className="text-xl font-bold text-emerald-400">{testingTransactions.filter(t => t.outcome === 'Passed').length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Exceptions</p>
                  <p className="text-xl font-bold text-rose-400">{testingTransactions.filter(t => t.outcome === 'Exception').length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">See Comments</p>
                  <p className="text-xl font-bold text-slate-300">{testingTransactions.filter(t => t.outcome === 'See Comments').length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

`;
  
  code = code.substring(0, start) + newBlock + code.substring(end);
  fs.writeFileSync('src/components/SamplingView.tsx', code);
}
