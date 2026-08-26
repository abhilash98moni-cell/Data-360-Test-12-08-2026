import fs from 'fs';
const path = '/app/applet/src/components/SamplingView.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `          <div className="mt-2 text-sm text-indigo-400">
             <button onClick={() => setView('testing_list')} className="underline">View Selected Transactions ({testingTransactions.length})</button>
          </div>`;

const replaceStr = `          <div className="mt-4">
             <button 
               onClick={() => setView('testing_list')} 
               className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-2"
             >
               View Selected Transactions
               <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">{testingTransactions.length}</span>
             </button>
          </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Target string not found.");
}
