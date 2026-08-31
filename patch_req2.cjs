const fs = require('fs');
let code = fs.readFileSync('src/components/RequiredDataQuestionnaire.tsx', 'utf-8');

// I will replace the question rendering section to match the desired format.
const oldRenderBlockStart = `<div className="flex gap-3 pr-20">
                    <span className="font-bold text-slate-400 shrink-0">{idx + 1}.</span>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="font-semibold text-slate-200">
                          {q.question_text}
                          {q.required && <span className="text-rose-500 ml-1" title="Required">*</span>}
                        </p>
                        {q.help_text && <p className="text-xs text-slate-500 mt-1">{q.help_text}</p>}
                      </div>
                      
                      {/* Answer Control */}
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0">Answer:</span>`;

const newRenderBlockStart = `<div className="flex-1 space-y-6 pr-20">
                      <div className="border-b border-slate-700/50 pb-4">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question {idx + 1}</div>
                        <p className="font-medium text-slate-200 text-base">
                          {q.question_text}
                          {q.required && <span className="text-rose-500 ml-1" title="Required">*</span>}
                        </p>
                        {q.help_text && <p className="text-sm text-slate-500 mt-1">{q.help_text}</p>}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Response</div>`;

code = code.replace(oldRenderBlockStart, newRenderBlockStart);

const oldCommentControl = `{/* Comment Control */}
                      {((q.allow_comment || q.allow_comment === 'true' || q.allow_comment === true) || q.answer_type === 'Comment') && q.answer_type !== 'Comment' && (
                        <div className="flex items-start gap-4">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0 pt-2">Comment:</span>`;

const newCommentControl = `{/* Comment Control */}
                      {((q.allow_comment || q.allow_comment === 'true' || q.allow_comment === true) || q.answer_type === 'Comment') && q.answer_type !== 'Comment' && (
                        <div className="pt-2">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Comment</div>`;

code = code.replace(oldCommentControl, newCommentControl);

const oldEvidenceControl = `{/* Evidence Control */}
                      {((q.allow_file_upload || q.allow_file_upload === 'true' || q.allow_file_upload === true) || q.answer_type === 'File Upload') && (
                        <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0">Evidence:</span>`;

const newEvidenceControl = `{/* Evidence Control */}
                      {((q.allow_file_upload || q.allow_file_upload === 'true' || q.allow_file_upload === true) || q.answer_type === 'File Upload') && (
                        <div className="pt-2">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Supporting Document</div>`;

code = code.replace(oldEvidenceControl, newEvidenceControl);

// Finally, we need to add a closing </div> for the `<div className="space-y-4">` we opened in `newRenderBlockStart`.
// The end of Evidence control has `</div>)}` then `</div>` then `</div>` then `</div>` then `))}</div>`
// Wait, I replaced `<div className="flex-1 space-y-4">` with `<div className="flex-1 space-y-6"> ... <div className="space-y-4">`
// So I need an extra `</div>` at the end of the question block.
const oldEndBlock = `                      </div>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>`;

const newEndBlock = `                      </div>)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>`;

code = code.replace(oldEndBlock, newEndBlock);

fs.writeFileSync('src/components/RequiredDataQuestionnaire.tsx', code);
