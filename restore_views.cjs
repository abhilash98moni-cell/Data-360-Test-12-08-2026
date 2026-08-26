const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// The file currently has renderTestingList ending weirdly and jumping into renderSummary logic.
// We will replace everything from `const renderTestingList = () => (` until `return (\n    <div className="h-full flex flex-col">`

const regex = /const renderTestingList = \(\) => \([\s\S]*?return \(\n    <div className="h-full flex flex-col">/;

const newCode = `const renderTestingList = () => (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <button onClick={() => setView('select_sample')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Sample Selection
          </button>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Selected Sample</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => testingTransactions.length > 0 && handleReviewClick(testingTransactions[0])}
            disabled={testingTransactions.length === 0}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            Start Transaction Testing
          </button>
          <button 
            onClick={() => setView('summary')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            View Testing Summary
          </button>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 overflow-y-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800 sticky top-0 z-10">
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Transaction ID</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Date</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Vendor / Customer / Employee</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Description</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase text-right">Amount</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase text-center">Status</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {testingTransactions.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-slate-200">{tx.id}</td>
                <td className="py-3 px-4 text-sm text-slate-400">{tx.date}</td>
                <td className="py-3 px-4 text-sm text-slate-300">{tx.entity}</td>
                <td className="py-3 px-4 text-sm text-slate-400">{tx.desc}</td>
                <td className="py-3 px-4 text-sm font-medium text-indigo-400 text-right">{tx.amount === null ? '—' : formatCurrency(tx.amount, currencyMode)}</td>
                <td className="py-3 px-4 text-center">
                  <span className={\`text-xs font-bold uppercase px-2 py-1 rounded-md \${
                     tx.reviewStatus === 'Reviewed' 
                       ? (tx.outcome === 'Passed' ? 'bg-emerald-900/40 text-emerald-400' : tx.outcome === 'Exception' ? 'bg-rose-900/40 text-rose-400' : 'bg-amber-900/40 text-amber-400')
                       : 'bg-slate-800 text-slate-400'
                  }\`}>
                    {tx.reviewStatus === 'Reviewed' ? (tx.outcome || 'REVIEWED') : 'PENDING'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                   <button onClick={() => handleReviewClick(tx)} className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
                     {tx.reviewStatus === 'Reviewed' ? 'Edit Test' : 'Test Transaction'}
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReview = () => {
    if (!selectedTransaction || !selectedPopulation) return null;
    const template = TESTING_TEMPLATES[getTemplateName(selectedPopulation)] || TESTING_TEMPLATES['3rd Party Disbursements'];
    const idx = testingTransactions.findIndex(t => t.id === selectedTransaction.id);
    
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <button onClick={() => setView('testing_list')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Selected Transactions
            </button>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Transaction Testing</h2>
            <p className="text-sm text-slate-400 mt-1">Template: <span className="text-indigo-400">{getTemplateName(selectedPopulation)}</span></p>
          </div>
          <div className="text-right">
             <div className="text-sm font-medium text-slate-400">Testing {idx + 1} of {testingTransactions.length}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
           <h3 className="text-lg font-bold text-white mb-4">Transaction Details</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Transaction ID</label>
                <div className="text-sm font-medium text-slate-200 mt-1">{selectedTransaction.id}</div>
             </div>
             <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
                <div className="text-sm font-medium text-slate-200 mt-1">{selectedTransaction.date}</div>
             </div>
             <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Entity / Vendor</label>
                <div className="text-sm font-medium text-slate-200 mt-1">{selectedTransaction.entity}</div>
             </div>
             <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Amount</label>
                <div className="text-sm font-bold text-indigo-400 mt-1">
                  {selectedTransaction.amount === null ? '—' : formatCurrency(selectedTransaction.amount, currencyMode)}
                </div>
             </div>
             <div className="col-span-2 md:col-span-4">
                <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                <div className="text-sm font-medium text-slate-200 mt-1">{selectedTransaction.desc}</div>
             </div>
           </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-lg font-bold text-white uppercase tracking-wide border-b border-slate-800 pb-2">Audit Testing Questionnaire</h3>
           
           <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/50">
              {template.map((attr) => (
                <div key={attr.id} className="p-6 space-y-4 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                     <div className="flex items-start gap-3 flex-1">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">{attr.id}</span>
                        <p className="text-sm font-medium text-slate-200 leading-relaxed">{attr.text}</p>
                     </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-4 pl-9">
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 w-max shrink-0">
                      {['Yes', 'No', 'N/A', 'See Comments'].map(opt => (
                        <label 
                          key={opt}
                          className={\`flex items-center justify-center py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-all \${
                            attributeAnswers[attr.id]?.result === opt
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                              : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                          }\`}
                        >
                          <input 
                            type="radio"
                            name={\`attr-\${attr.id}\`}
                            value={opt}
                            className="hidden"
                            checked={attributeAnswers[attr.id]?.result === opt}
                            onChange={() => setAttributeAnswers(prev => ({
                              ...prev,
                              [attr.id]: { ...(prev[attr.id] || {comment: ''}), result: opt }
                            }))}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                    <input 
                      type="text"
                      value={attributeAnswers[attr.id]?.comment || ''}
                      onChange={e => setAttributeAnswers(prev => ({
                        ...prev,
                        [attr.id]: { ...(prev[attr.id] || {result: ''}), comment: e.target.value }
                      }))}
                      placeholder="Auditor Comment (Required if 'No' or 'See Comments')"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
           </div>
        </div>

        {validationError && (
          <div className="bg-rose-900/30 border border-rose-500/50 rounded-xl p-4 flex items-center gap-3 text-rose-400 text-sm font-medium">
             <AlertTriangle className="h-5 w-5" />
             {validationError}
          </div>
        )}

        {saveSuccess && (
          <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3 text-emerald-400 text-sm font-medium">
             <CheckCircle2 className="h-5 w-5" />
             Test Result Saved. Redirecting...
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-slate-800">
           <button 
             onClick={() => {
               // Next or previous logic if needed. Or just back.
               setView('testing_list');
             }}
             className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
           >
             Cancel
           </button>
           <button 
             onClick={handleSaveReview}
             disabled={isSaving}
             className={\`px-8 py-3 rounded-lg text-sm font-bold transition-all shadow-lg flex items-center gap-2 \${
               isSaving ? 'bg-indigo-600/50 cursor-not-allowed text-white/70' : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:-translate-y-0.5'
             }\`}
           >
             {isSaving ? 'Saving...' : 'Save Test Result'}
           </button>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    const totalSelected = testingTransactions.length;
    const completed = testingTransactions.filter(t => t.reviewStatus === 'Reviewed').length;
    const pending = totalSelected - completed;
    const passed = testingTransactions.filter(t => t.outcome === 'Passed').length;
    const exceptions = testingTransactions.filter(t => t.outcome === 'Exception').length;
    const incomplete = testingTransactions.filter(t => t.outcome === 'Incomplete').length;

    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <button onClick={() => setView('testing_list')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Selected Transactions
            </button>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Testing Summary</h2>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
           <div className="grid grid-cols-3 md:grid-cols-6 gap-6 text-center">
             <div className="col-span-3 md:col-span-2 text-left bg-slate-950 p-4 rounded-lg border border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Population</p>
                <p className="text-sm font-medium text-slate-300 break-words">{selectedPopulation?.fileName}</p>
             </div>
             <div className="flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Transactions Selected</p>
                <p className="text-2xl font-black text-indigo-400">{totalSelected}</p>
             </div>
             <div className="flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Transactions Tested</p>
                <p className="text-2xl font-black text-white">{completed}</p>
             </div>
             <div className="flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Passed</p>
                <p className="text-2xl font-black text-emerald-500">{passed}</p>
             </div>
             <div className="flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Exceptions</p>
                <p className="text-2xl font-black text-rose-500">{exceptions}</p>
             </div>
           </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-8">
           <div className="bg-slate-950/30 px-6 py-4 border-b border-slate-800">
             <h3 className="text-lg font-bold text-white">Tested Transactions</h3>
           </div>
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-950/50 border-b border-slate-800">
                 <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase">Transaction ID</th>
                 <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase text-right">Amount</th>
                 <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase">Testing Result</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-800">
               {testingTransactions.map((tx, idx) => (
                 <tr key={tx.id || \`sum-\${idx}\`} className="hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => handleReviewClick(tx)}>
                   <td className="py-3 px-6 text-sm font-medium text-indigo-400 underline">{tx.id}</td>
                   <td className="py-3 px-6 text-sm font-medium text-slate-400 text-right">{tx.amount === null ? '—' : formatCurrency(tx.amount, currencyMode)}</td>
                   <td className={\`py-3 px-6 text-sm font-bold \${tx.outcome === 'Passed' ? 'text-emerald-500' : tx.outcome === 'Exception' ? 'text-rose-500' : 'text-amber-500'}\`}>{tx.outcome || 'Pending'}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">`;

code = code.replace(regex, newCode);
fs.writeFileSync('src/components/SamplingView.tsx', code);
