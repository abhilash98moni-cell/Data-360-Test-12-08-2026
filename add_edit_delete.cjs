const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// I will find:
const target = `{attr.type && <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 block">{attr.type}</span>}`;
const replace = `{attr.type && <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 block">{attr.type}</span>}
                          {attr.id.startsWith('CQ') && (
                            <div className="flex gap-2 mt-2">
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
                               </button>
                            </div>
                          )}`;

if (code.includes(target)) {
   code = code.replace(target, replace);
   fs.writeFileSync('src/components/SamplingView.tsx', code);
   console.log('Successfully added delete button');
} else {
   console.log('Could not find target');
}
