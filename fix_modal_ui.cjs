const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// Update modal header
let modalHeaderTarget = `           <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question Text *</label>`;

let modalHeaderReplacement = `           <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
             <div className="bg-slate-950 p-4 border border-slate-800 rounded-lg flex flex-col gap-2">
               <div className="flex gap-4">
                  <div className="w-1/2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Testing Classification</span>
                    <span className="text-sm font-semibold text-slate-300">
                      {reviewRecord?._activeClassificationContext || (reviewRecord && Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord?.testingClassification) || 'General'}
                    </span>
                  </div>
                  <div className="w-1/2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sample ID</span>
                    <span className="text-sm font-mono text-slate-300">{reviewRecord?.id || 'Unknown'}</span>
                  </div>
               </div>
             </div>
             
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question Scope *</label>
               <div className="flex flex-col gap-3 p-4 bg-slate-950 border border-slate-800 rounded-lg">
                 <label className="flex items-center gap-3 cursor-pointer">
                   <input 
                     type="radio" 
                     name="question_scope"
                     className="w-4 h-4 border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500/20"
                     checked={questionBuilderForm.scope === 'classification'}
                     onChange={() => setQuestionBuilderForm(prev => ({...prev, scope: 'classification'}))}
                   />
                   <span className="text-sm text-slate-300">Apply to ALL samples in this Testing Classification</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer">
                   <input 
                     type="radio" 
                     name="question_scope"
                     className="w-4 h-4 border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500/20"
                     checked={questionBuilderForm.scope === 'sample'}
                     onChange={() => setQuestionBuilderForm(prev => ({...prev, scope: 'sample'}))}
                   />
                   <span className="text-sm text-slate-300">Apply ONLY to this particular sample</span>
                 </label>
               </div>
             </div>

             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question Text *</label>`;
if(code.includes(modalHeaderTarget)) code = code.replace(modalHeaderTarget, modalHeaderReplacement);

fs.writeFileSync('src/components/SamplingView.tsx', code);
console.log('Successfully updated modal UI');
