const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// manual regex replace for the header of renderReview
const headerRegex = /<div>\n\s*<button onClick=\{\(\) => setView\('testing_list'\)\}.*?<\/button>\n\s*<h2 className="text-2xl font-bold text-white">Transaction Testing<\/h2>\n\s*<\/div>\n\s*\{\!saveSuccess \? \(\n\s*<button \n\s*onClick=\{handleSaveReview\}\n\s*disabled=\{isSaving\}\n\s*className=\{\`px-6 py-2 rounded-lg text-sm font-medium transition-colors \$\{isSaving \? 'bg-slate-700 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white'\}\`\}\n\s*>\n\s*\{isSaving \? 'Saving\.\.\.' : 'Save Test Result'\}\n\s*<\/button>/s;

const newHeader = `
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
`;

code = code.replace(headerRegex, newHeader);

// Now update the `Pending` text in summary to `Incomplete`
code = code.replace(
  /<p className="text-xs text-slate-500">Pending<\/p>/g,
  '<p className="text-xs text-slate-500">Incomplete</p>'
);

// We also need to add the other part of the condition for !saveSuccess.
// Wait, my regex above only matched up to </button>, leaving the rest of the conditional intact if it existed.
// Let's check what was there.
fs.writeFileSync('src/components/SamplingView.tsx', code);
