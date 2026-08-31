const fs = require('fs');
let code = fs.readFileSync('src/components/RequiredDataQuestionnaire.tsx', 'utf-8');

const startStr = '          ) : (\n            <div className="space-y-6">';
const startIndex = code.indexOf(startStr);
const footerIndex = code.indexOf('        {/* Footer */}');

if (startIndex === -1 || footerIndex === -1) {
    console.log("Could not find start or footer index.");
} else {
    // Determine the end index as just before the footer
    const endIndex = code.lastIndexOf('        </div>', footerIndex);

    const newBlock = `<div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
              <div className="grid grid-cols-12 bg-slate-950 border-b border-slate-800">
                <div className="col-span-4 p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Question</div>
                <div className="col-span-5 p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-800">Response</div>
                <div className="col-span-3 p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-800">Supporting Document</div>
              </div>
              {questions.map((q, idx) => (
                <div key={q.dbId} className="grid grid-cols-12 border-b border-slate-800 last:border-b-0 relative group/question">
                  
                  {/* Column 1: QUESTION */}
                  <div className="col-span-4 p-5 relative">
                    {/* Auditor edit/delete actions */}
                    <div className="absolute top-2 right-2 flex opacity-0 group-hover/question:opacity-100 transition-opacity gap-1">
                      {(!isDistributor && !isReviewMode) && (<button 
                        onClick={() => {
                          setEditingQuestionId(q.dbId);
                          setQuestionForm({
                            text: q.question_text,
                            type: q.answer_type || 'Yes / No',
                            required: q.required,
                            helpText: q.help_text || '',
                            scope: q.scope || 'transaction'
                          });
                          setShowAddQuestion(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-400 bg-slate-900 rounded border border-slate-700 hover:border-indigo-500/50 transition-colors"
                        title="Edit Question"
                      >
                        <Edit2 className="h-3 w-3" /></button>)}
                      {(!isDistributor && !isReviewMode) && (<button 
                        onClick={() => handleDeleteQuestion(q.dbId)}
                        className="p-1 text-slate-400 hover:text-rose-400 bg-slate-900 rounded border border-slate-700 hover:border-rose-500/50 transition-colors"
                        title="Remove Question"
                      >
                        <Trash2 className="h-3 w-3" /></button>)}
                    </div>

                    <div className="flex gap-3">
                      <span className="font-bold text-slate-400 shrink-0">{idx + 1}.</span>
                      <div className="pr-6">
                        <p className="font-semibold text-slate-200 text-sm">
                          {q.question_text}
                          {q.required && <span className="text-rose-500 ml-1" title="Required">*</span>}
                        </p>
                        {q.help_text && <p className="text-xs text-slate-500 mt-2">{q.help_text}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: RESPONSE */}
                  <div className="col-span-5 p-5 border-l border-slate-800 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      {(q.answer_type === 'Yes / No') && (
                        <div className="flex gap-4">
                          {['Yes', 'No'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" disabled={!isDistributor || isReviewMode} name={\`q_\${q.dbId}\`} value={opt} checked={responses[q.dbId] === opt} onChange={(e) => setResponses({...responses, [q.dbId]: e.target.value})} className="text-indigo-500 bg-slate-950 border-slate-700" />
                              <span className="text-sm text-slate-300">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {(q.answer_type === 'Yes / No / N/A') && (
                        <div className="flex gap-4">
                          {['Yes', 'No', 'N/A'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" disabled={!isDistributor || isReviewMode} name={\`q_\${q.dbId}\`} value={opt} checked={responses[q.dbId] === opt} onChange={(e) => setResponses({...responses, [q.dbId]: e.target.value})} className="text-indigo-500 bg-slate-950 border-slate-700" />
                              <span className="text-sm text-slate-300">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {(q.answer_type === 'Text' || q.answer_type === 'Number' || q.answer_type === 'Date' || !q.answer_type) && (
                        <input disabled={!isDistributor || isReviewMode}
                          type={q.answer_type === 'Number' ? 'number' : q.answer_type === 'Date' ? 'date' : 'text'}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none w-full"
                          value={responses[q.dbId] || ''}
                          onChange={(e) => setResponses({...responses, [q.dbId]: e.target.value})}
                          placeholder="Enter answer..."
                        />
                      )}
                      {(q.answer_type === 'Dropdown') && (
                        <select disabled={!isDistributor || isReviewMode}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none w-full"
                          value={responses[q.dbId] || ''}
                          onChange={(e) => setResponses({...responses, [q.dbId]: e.target.value})}
                        >
                          <option value="">Select...</option>
                          {(q.options || ['Option 1', 'Option 2']).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {(q.answer_type === 'Checkbox') && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 bg-slate-950 border border-slate-700 rounded text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                            checked={responses[q.dbId] === 'true'}
                            onChange={(e) => setResponses({...responses, [q.dbId]: e.target.checked ? 'true' : 'false'})}
                          />
                          <span className="text-sm text-slate-300">Checked</span>
                        </label>
                      )}
                      
                      {(q.answer_type === 'Comment') && (
                        <textarea disabled={!isDistributor || isReviewMode}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none w-full"
                          value={responses[q.dbId] || ''}
                          onChange={(e) => setResponses({...responses, [q.dbId]: e.target.value})}
                          placeholder="Enter detailed comment..."
                          rows={2}
                        />
                      )}
                    </div>
                    {/* Comment Control */}
                    {((q.allow_comment || q.allow_comment === 'true' || q.allow_comment === true) || q.answer_type === 'Comment') && q.answer_type !== 'Comment' && (
                      <div className="pt-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Comment</div>
                        <textarea disabled={!isDistributor || isReviewMode}
                          className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none"
                          value={comments[q.dbId] || ''}
                          onChange={(e) => setComments({...comments, [q.dbId]: e.target.value})}
                          placeholder="Enter comment..."
                          rows={2}
                        />
                      </div>
                    )}
                  </div>

                  {/* Column 3: SUPPORTING DOCUMENT */}
                  <div className="col-span-3 p-5 border-l border-slate-800 flex flex-col gap-3 justify-center items-start">
                    {((q.allow_file_upload || q.allow_file_upload === 'true' || q.allow_file_upload === true) || q.answer_type === 'File Upload') && (
                      <>
                      {documents[q.dbId] ? (
                        <div className="w-full flex flex-col gap-2">
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span className="font-medium truncate flex-1" title={documents[q.dbId]}>{documents[q.dbId]}</span>
                            {(!isDistributor || isReviewMode) ? null : (
                              <button 
                                onClick={() => {
                                  const newDocs = {...documents};
                                  delete newDocs[q.dbId];
                                  setDocuments(newDocs);
                                }}
                                className="ml-1 hover:text-rose-400 transition-colors shrink-0"
                                title="Remove File"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button className="flex-1 text-xs font-semibold px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors" onClick={() => alert('Viewing document...')}>View</button>
                            <button className="flex-1 text-xs font-semibold px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors" onClick={() => alert('Downloading document...')}>Download</button>
                          </div>
                        </div>
                      ) : (!isDistributor || isReviewMode) ? (
                          <div className="text-xs text-slate-500 italic">No document uploaded</div>
                        ) : (
                        <label className="flex items-center justify-center gap-2 px-3 py-2 w-full bg-slate-950 border border-slate-700 border-dashed rounded-lg text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 cursor-pointer transition-colors text-xs font-semibold">
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload Document</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                try {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  formData.append('documentType', 'EVIDENCE');
                                  formData.append('documentUsage', 'REQUIRED_DATA');
                                  formData.append('requirementId', transaction.voucherNo || transaction.id);
                                  const res = await fetch('/api/storage/upload', {
                                    method: 'POST',
                                    headers: { 'x-user-email': currentUser?.email || '' },
                                    body: formData
                                  });
                                  const data = await res.json();
                                  if (res.ok && data.success) {
                                    setDocuments({...documents, [q.dbId]: data.evidenceRecord?.fileName || file.name});
                                  } else {
                                    alert("Upload failed");
                                  }
                                } catch(err) {
                                  alert("Error uploading");
                                }
                              }
                            }}
                          />
                        </label>
                      )}
                      </>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
`;

    const newCode = code.substring(0, startIndex) + '          ) : (\n' + newBlock + code.substring(endIndex);
    fs.writeFileSync('src/components/RequiredDataQuestionnaire.tsx', newCode);
    console.log("Replaced using exact indexes successfully!");
}
