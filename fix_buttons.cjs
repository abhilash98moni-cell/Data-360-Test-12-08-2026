const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const targetButtons = `<button 
                                 onClick={() => {
                                    if (confirm('Delete this custom question?')) {
                                       fetch('/api/sampling/questions/' + attr.dbId, { method: 'DELETE', headers: { 'x-user-email': currentUser?.email || '' } })
                                         .then(() => setCustomQuestions(prev => prev.filter(q => q.id !== attr.id)));
                                    }
                                 }}
                                 className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-wider"
                               >
                                 Delete
                               </button>`;

const replaceButtons = `<button className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 uppercase tracking-wider">
                                 Edit
                               </button>
                               <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 uppercase tracking-wider">
                                 Duplicate
                               </button>
                               <button 
                                 onClick={() => {
                                    if (confirm('Delete this custom question?')) {
                                       fetch('/api/sampling/questions/' + attr.dbId, { method: 'DELETE', headers: { 'x-user-email': currentUser?.email || '' } })
                                         .then(() => setCustomQuestions(prev => prev.filter(q => q.id !== attr.id)));
                                    }
                                 }}
                                 className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-wider"
                               >
                                 Delete
                               </button>`;

if (code.includes(targetButtons)) {
   code = code.replace(targetButtons, replaceButtons);
   fs.writeFileSync('src/components/SamplingView.tsx', code);
   console.log('Successfully added Edit and Duplicate stubs');
} else {
   console.log('Could not find buttons');
}
