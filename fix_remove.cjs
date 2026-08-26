const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const anchor = `<td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => handleReviewClick(tx)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition-colors"
                  >
                    {tx.reviewStatus === 'Reviewed' ? 'Edit Test' : 'Start Testing'}
                  </button>
                </td>`;
                
const replacement = `<td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => {
                        setTestingTransactions(prev => prev.filter(t => t.id !== tx.id));
                        setAddedTxIds(prev => {
                          const next = new Set(prev);
                          next.delete(tx.id);
                          return next;
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 rounded text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                    <button 
                      onClick={() => handleReviewClick(tx)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition-colors"
                    >
                      {tx.reviewStatus === 'Reviewed' ? 'Edit Test' : 'Start Testing'}
                    </button>
                  </div>
                </td>`;

code = code.replace(anchor, replacement);

fs.writeFileSync('src/components/SamplingView.tsx', code);
