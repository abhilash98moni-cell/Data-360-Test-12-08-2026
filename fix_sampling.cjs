const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// 1. Add getTemplateName function
const templateHelper = `
const getTemplateName = (population: any) => {
  if (!population) return '3rd Party Disbursements';
  const name = (population.fileName || '').toLowerCase();
  if (name.includes('sales')) return 'Sales Testing';
  if (name.includes('employee') || name.includes('t&e')) return 'Employee Disbursements & Reimbursements';
  return '3rd Party Disbursements';
};
`;
code = code.replace("const TESTING_TEMPLATES", templateHelper + "\nconst TESTING_TEMPLATES");


// 2. Update handleSaveReview
code = code.replace(
  "const template = TESTING_TEMPLATES[selectedPopulation.type] || TESTING_TEMPLATES['3rd Party Disbursements'];",
  "const template = TESTING_TEMPLATES[getTemplateName(selectedPopulation)] || TESTING_TEMPLATES['3rd Party Disbursements'];"
);

// 3. Update renderReview template assignment
code = code.replace(
  "const template = TESTING_TEMPLATES[selectedPopulation.type] || TESTING_TEMPLATES['3rd Party Disbursements'];",
  "const template = TESTING_TEMPLATES[getTemplateName(selectedPopulation)] || TESTING_TEMPLATES['3rd Party Disbursements'];"
);

// 4. Update renderReview testing attributes label
code = code.replace(
  "<span className=\"text-xs text-slate-500 font-medium\">Template: {selectedPopulation.type}</span>",
  "<span className=\"text-xs text-slate-500 font-medium\">Template: {getTemplateName(selectedPopulation)}</span>"
);

// 5. Update renderTestingList buttons
const testingListButtons = `
        <div className="flex items-center gap-3">
          <button 
            onClick={() => testingTransactions.length > 0 && handleReviewClick(testingTransactions[0])}
            disabled={testingTransactions.length === 0}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
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
`;
code = code.replace(
  /<button \n\s*onClick=\{\(\) => setView\('summary'\)\}\n\s*className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"\n\s*>\n\s*View Testing Summary\n\s*<\/button>/g,
  testingListButtons
);


// 6. Fix "Next Transaction" iteration inside renderReview
// Wait, let's see how saveSuccess is rendered in renderReview.
// I'll just rewrite the header of renderReview.
const reviewHeader = `
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
`;

code = code.replace(
  /<div>\n\s*<button onClick=\{\(\) => setView\('testing_list'\)\} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">\n\s*<ArrowLeft className="h-4 w-4" \/> Back to Selected Transactions\n\s*<\/button>\n\s*<h2 className="text-2xl font-bold text-white">Transaction Testing<\/h2>\n\s*<\/div>\n\s*\{\!saveSuccess \? \(\n\s*<button \n\s*onClick=\{handleSaveReview\}\n\s*disabled=\{isSaving\}\n\s*className=\{\`px-6 py-2 rounded-lg text-sm font-medium transition-colors \$\{isSaving \? 'bg-slate-700 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white'\}\`\}\n\s*>\n\s*\{isSaving \? 'Saving\.\.\.' : 'Save Test Result'\}\n\s*<\/button>/,
  reviewHeader.replace(/\{\!saveSuccess \? \(/, '') // hacky string replacement, let me just replace the entire block manually.
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
