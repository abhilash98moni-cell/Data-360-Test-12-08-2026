const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const targetStr = `{template.map(attr => (
                  <div key={attr.id} className="p-4 flex flex-col md:flex-row gap-6 hover:bg-slate-900/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">{attr.id}</div>
                        <p className="text-sm text-slate-300 leading-relaxed">{attr.text}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 md:w-64 shrink-0">
                      <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 h-9">
                        {['Yes', 'No', 'N/A', 'See Comments'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: opt }})}
                            className={\`flex-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors
                              \${reviewAnswers[attr.id]?.result === opt 
                                ? (opt === 'No' || opt === 'See Comments' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400')
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}\`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      <input 
                        type="text"
                        placeholder="Add comment..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                        value={reviewAnswers[attr.id]?.comment || ''}
                        onChange={(e) => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], comment: e.target.value }})}
                      />
                    </div>
                  </div>
                ))}`;

const replacementStr = `{template.map((attr: any) => {
                  const type = attr.type || 'Yes / No / N/A';
                  let options: string[] = [];
                  if (type === 'Yes / No') options = ['Yes', 'No'];
                  else if (type === 'Yes / No / N/A' || !attr.type) options = ['Yes', 'No', 'N/A', 'See Comments'];
                  else if (type === 'Single Choice' || type === 'Multiple Choice' || type === 'Checkbox / Multiple Select') options = attr.options || [];
                  else if (type === 'Yes / No + Conditional Follow-up') options = ['Yes', 'No'];
                  
                  return (
                  <div key={attr.id} className="p-4 flex flex-col md:flex-row gap-6 hover:bg-slate-900/50 transition-colors border-b border-slate-800/50 last:border-0">
                    <div className="flex-1">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                          {attr.id.startsWith('CQ') ? 'Q' : attr.id}
                        </div>
                        <div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {attr.text}
                            {attr.required && <span className="text-rose-500 ml-1">*</span>}
                          </p>
                          {attr.type && <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 block">{attr.type}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 md:w-64 shrink-0">
                      
                      {/* Render based on type */}
                      {['Yes / No', 'Yes / No / N/A', 'Yes / No + Conditional Follow-up'].includes(type) && (
                        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 h-9">
                          {options.map(opt => (
                            <button
                              key={opt}
                              onClick={() => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: opt }})}
                              className={\`flex-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors
                                \${reviewAnswers[attr.id]?.result === opt 
                                  ? (opt === 'No' || opt === 'See Comments' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400')
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}\`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {type === 'Single Choice' && (
                        <select 
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 h-9"
                          value={reviewAnswers[attr.id]?.result || ''}
                          onChange={(e) => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: e.target.value }})}
                        >
                          <option value="">Select option...</option>
                          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                      
                      {(type === 'Multiple Choice' || type === 'Checkbox / Multiple Select') && (
                        <div className="flex flex-col gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
                           {options.map(opt => {
                              const selected = Array.isArray(reviewAnswers[attr.id]?.result) ? reviewAnswers[attr.id].result.includes(opt) : false;
                              return (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-indigo-500"
                                    checked={selected}
                                    onChange={(e) => {
                                      let current = Array.isArray(reviewAnswers[attr.id]?.result) ? [...reviewAnswers[attr.id].result] : [];
                                      if (e.target.checked) current.push(opt);
                                      else current = current.filter((v: string) => v !== opt);
                                      setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: current }})
                                    }}
                                  />
                                  <span className="text-xs text-slate-300">{opt}</span>
                                </label>
                              );
                           })}
                        </div>
                      )}
                      
                      {type === 'Text Answer' && (
                        <textarea 
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[60px]"
                          placeholder="Enter response..."
                          value={reviewAnswers[attr.id]?.result || ''}
                          onChange={(e) => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: e.target.value }})}
                        />
                      )}
                      
                      {type === 'Number' && (
                        <input 
                          type="number"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 h-9"
                          placeholder="Enter number..."
                          value={reviewAnswers[attr.id]?.result || ''}
                          onChange={(e) => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: e.target.value }})}
                        />
                      )}
                      
                      {type === 'Date' && (
                        <input 
                          type="date"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 h-9"
                          value={reviewAnswers[attr.id]?.result || ''}
                          onChange={(e) => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: e.target.value }})}
                        />
                      )}
                      
                      {type === 'File Upload' && (
                        <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 flex flex-col gap-2">
                           <input type="file" className="text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-slate-800 file:text-slate-300" />
                        </div>
                      )}

                      <input 
                        type="text"
                        placeholder="Add comment..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                        value={reviewAnswers[attr.id]?.comment || ''}
                        onChange={(e) => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], comment: e.target.value }})}
                      />
                    </div>
                  </div>
                );
                })}`;

if (code.includes(targetStr)) {
   code = code.replace(targetStr, replacementStr);
   fs.writeFileSync('src/components/SamplingView.tsx', code);
   console.log('Successfully replaced map block');
} else {
   console.log('Could not find target block');
}
