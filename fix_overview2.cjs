const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const anchor = `<div className="flex items-center gap-4">
           <button onClick={() => setView('population_records')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
              View Population Records
           </button>
           <button onClick={() => setView('sampling_plan')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
              Create Sampling Plan
           </button>
        </div>`;
        
const replacement = `<div className="flex items-center gap-4">
           <button onClick={() => setView('population_records')} disabled={!!populationError} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${populationError ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-white'}\`}>
              View Population Records
           </button>
           <button onClick={() => setView('sampling_plan')} disabled={!!populationError} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${populationError ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}\`}>
              Create Sampling Plan
           </button>
        </div>`;
        
code = code.replace(anchor, replacement);
fs.writeFileSync('src/components/SamplingView.tsx', code);
