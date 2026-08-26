const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// The bottom of handleSaveReview:
const handleSaveReviewOld = `    if (outcome === 'Exception' && onFindingCreated) {
      onFindingCreated({
        type: 'Test Exception',
        severity: 'Medium',
        description: \`Exceptions identified during sampling test for transaction \${selectedTransaction.id} in population \${selectedPopulation.type}\`,
        status: 'Open',
        auditedEntity: selectedClient,
        title: \`Sampling Exception: \${selectedTransaction.id}\`
      });
    }
    
    setIsSaving(false);
    setSaveSuccess(true);
  };`;

const handleSaveReviewNew = `    if (outcome === 'Exception' && onFindingCreated) {
      onFindingCreated({
        type: 'Test Exception',
        severity: 'Medium',
        description: \`Exceptions identified during sampling test for transaction \${selectedTransaction.id} in population \${selectedPopulation.type}\`,
        status: 'Open',
        auditedEntity: selectedClient,
        title: \`Sampling Exception: \${selectedTransaction.id}\`
      });
    }
    
    setIsSaving(false);
    setSaveSuccess(true);
    
    // Automatically advance to the next pending transaction after 1.5 seconds
    setTimeout(() => {
      const updatedTxs = testingTransactions.map(t => {
        if (t.id === selectedTransaction.id) {
          return { ...t, reviewStatus: 'Reviewed', outcome, answers: attributeAnswers };
        }
        return t;
      });
      const currentIndex = updatedTxs.findIndex(t => t.id === selectedTransaction.id);
      if (currentIndex !== -1 && currentIndex < updatedTxs.length - 1) {
         handleReviewClick(updatedTxs[currentIndex + 1]);
      } else {
         setView('summary');
      }
    }, 1500);
  };`;

code = code.replace(handleSaveReviewOld, handleSaveReviewNew);

// Also need to add "Next Transaction" button explicitly in the UI of renderReview.
const renderReviewBtns = `<button 
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
           </button>`;

const renderReviewBtnsNew = `<button 
             onClick={() => setView('testing_list')}
             className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
           >
             Cancel
           </button>
           <div className="flex gap-4">
             {saveSuccess && (
                <button
                  onClick={() => {
                     const idx = testingTransactions.findIndex(t => t.id === selectedTransaction.id);
                     if (idx < testingTransactions.length - 1) {
                       handleReviewClick(testingTransactions[idx + 1]);
                     } else {
                       setView('summary');
                     }
                  }}
                  className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg"
                >
                  {testingTransactions.findIndex(t => t.id === selectedTransaction.id) < testingTransactions.length - 1 ? 'Next Transaction →' : 'View Summary'}
                </button>
             )}
             <button 
               onClick={handleSaveReview}
               disabled={isSaving || saveSuccess}
               className={\`px-8 py-3 rounded-lg text-sm font-bold transition-all shadow-lg flex items-center gap-2 \${
                 isSaving || saveSuccess ? 'bg-indigo-600/50 cursor-not-allowed text-white/70' : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:-translate-y-0.5'
               }\`}
             >
               {isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Test Result'}
             </button>
           </div>`;

code = code.replace(renderReviewBtns, renderReviewBtnsNew);
fs.writeFileSync('src/components/SamplingView.tsx', code);
