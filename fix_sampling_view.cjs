const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// We need to add state for the Question Builder modal.
const stateTarget = `  const [customQuestions, setCustomQuestions] = useState<any[]>([]);`;
const stateReplacement = `  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [questionBuilderForm, setQuestionBuilderForm] = useState({
    text: '',
    type: 'Yes / No',
    required: false,
    guidance: '',
    options: ['Option 1', 'Option 2'],
    conditionalRules: [] as any[]
  });
  
  // Fetch custom questions on load
  useEffect(() => {
    const fetchCustomQuestions = async () => {
      try {
        const params = new URLSearchParams({
          distributorId: selectedDistributor,
          auditId: selectedAuditFilter || 'eng-101',
        });
        const res = await fetch(\`/api/sampling/questions?\${params.toString()}\`, {
          headers: {
            'x-user-email': currentUser?.email || '',
            'x-user-role': currentUser?.role || '',
            'x-user-organization': currentUser?.organization || ''
          }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.questions)) {
          const formatted = data.questions.map((q: any) => ({
             id: q.question_id,
             text: q.question_text,
             contextClass: q.testing_classification,
             type: q.question_type,
             required: q.required,
             options: q.options,
             conditionalRules: q.conditional_rules,
             dbId: q.dbId
          }));
          setCustomQuestions(formatted);
        }
      } catch (err) {
         console.error('Failed to fetch custom questions', err);
      }
    };
    if (selectedDistributor) {
       fetchCustomQuestions();
    }
  }, [selectedDistributor, selectedAuditFilter]);

  const handleSaveCustomQuestion = async () => {
     if (!questionBuilderForm.text.trim()) {
        alert("Question text is required.");
        return;
     }
     setIsSavingQuestion(true);
     try {
       const contextClass = reviewRecord?._activeClassificationContext || (reviewRecord && Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord?.testingClassification) || 'General';
       
       const payload = {
          question_id: 'CQ' + Date.now(),
          engagement_id: selectedAuditFilter || 'eng-101',
          testing_classification: contextClass,
          question_text: questionBuilderForm.text,
          question_type: questionBuilderForm.type,
          required: questionBuilderForm.required,
          options: questionBuilderForm.options,
          conditional_rules: questionBuilderForm.conditionalRules,
          display_order: customQuestions.length
       };
       
       const res = await fetch('/api/sampling/questions', {
          method: 'POST',
          headers: {
             'Content-Type': 'application/json',
             'x-user-email': currentUser?.email || ''
          },
          body: JSON.stringify(payload)
       });
       const data = await res.json();
       if (data.success) {
          setCustomQuestions(prev => [...prev, {
             id: payload.question_id,
             text: payload.question_text,
             contextClass: payload.testing_classification,
             type: payload.question_type,
             required: payload.required,
             options: payload.options,
             conditionalRules: payload.conditional_rules
          }]);
          setShowQuestionBuilder(false);
          setQuestionBuilderForm({
             text: '',
             type: 'Yes / No',
             required: false,
             guidance: '',
             options: ['Option 1', 'Option 2'],
             conditionalRules: []
          });
       } else {
          alert("Failed to save question. Please try again.");
       }
     } catch (err) {
       console.error("Error saving question:", err);
       alert("Failed to save question. Please try again.");
     } finally {
       setIsSavingQuestion(false);
     }
  };

  const renderQuestionBuilderModal = () => {
     if (!showQuestionBuilder) return null;
     return (
       <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
         <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-800 flex justify-between items-center">
             <h2 className="text-xl font-bold text-white">Add Testing Question</h2>
             <button onClick={() => setShowQuestionBuilder(false)} className="text-slate-400 hover:text-white">
               <X className="w-5 h-5" />
             </button>
           </div>
           <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question Text *</label>
               <textarea 
                 className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                 placeholder="Enter your question here..."
                 rows={3}
                 value={questionBuilderForm.text}
                 onChange={e => setQuestionBuilderForm(prev => ({...prev, text: e.target.value}))}
               />
             </div>
             
             <div className="grid grid-cols-2 gap-6">
               <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question Type *</label>
                 <select 
                   className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                   value={questionBuilderForm.type}
                   onChange={e => setQuestionBuilderForm(prev => ({...prev, type: e.target.value}))}
                 >
                   <option value="Yes / No">Yes / No</option>
                   <option value="Yes / No / N/A">Yes / No / N/A</option>
                   <option value="Single Choice">Single Choice</option>
                   <option value="Multiple Choice">Multiple Choice</option>
                   <option value="Checkbox / Multiple Select">Checkbox / Multiple Select</option>
                   <option value="Text Answer">Text Answer</option>
                   <option value="Number">Number</option>
                   <option value="Date">Date</option>
                   <option value="File Upload">File Upload</option>
                   <option value="Yes / No + Conditional Follow-up">Yes / No + Conditional Follow-up</option>
                 </select>
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Required</label>
                 <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition-colors">
                   <input 
                     type="checkbox" 
                     className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500/20"
                     checked={questionBuilderForm.required}
                     onChange={e => setQuestionBuilderForm(prev => ({...prev, required: e.target.checked}))}
                   />
                   <span className="text-sm font-semibold text-slate-300">Required question</span>
                 </label>
               </div>
             </div>
             
             {['Single Choice', 'Multiple Choice', 'Checkbox / Multiple Select'].includes(questionBuilderForm.type) && (
               <div className="space-y-3">
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Answer Options</label>
                 {questionBuilderForm.options.map((opt, i) => (
                   <div key={i} className="flex gap-2">
                     <input 
                       type="text" 
                       className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                       value={opt}
                       onChange={e => {
                         const newOpts = [...questionBuilderForm.options];
                         newOpts[i] = e.target.value;
                         setQuestionBuilderForm(prev => ({...prev, options: newOpts}));
                       }}
                     />
                     <button 
                       onClick={() => {
                         setQuestionBuilderForm(prev => ({...prev, options: prev.options.filter((_, idx) => idx !== i)}));
                       }}
                       className="px-3 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors text-xs font-bold"
                     >
                       Delete
                     </button>
                   </div>
                 ))}
                 <button 
                   onClick={() => setQuestionBuilderForm(prev => ({...prev, options: [...prev.options, 'New Option']}))}
                   className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors text-xs font-bold flex items-center gap-2"
                 >
                   <Plus className="w-3.5 h-3.5" /> Add Option
                 </button>
               </div>
             )}
             
             {questionBuilderForm.type === 'Yes / No + Conditional Follow-up' && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-indigo-400">Conditional Rules</h4>
                  <div className="space-y-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                      <div className="text-xs font-bold text-slate-400 mb-2">IF YES</div>
                      <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Follow-up Question
                      </button>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                      <div className="text-xs font-bold text-slate-400 mb-2">IF NO</div>
                      <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Follow-up Question
                      </button>
                    </div>
                  </div>
                </div>
             )}

             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Help / Guidance</label>
               <textarea 
                 className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                 placeholder="Optional guidance..."
                 rows={2}
                 value={questionBuilderForm.guidance}
                 onChange={e => setQuestionBuilderForm(prev => ({...prev, guidance: e.target.value}))}
               />
             </div>
             
             <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
               <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-3">Preview</div>
               <div className="text-sm font-medium text-slate-200 mb-3">{questionBuilderForm.text || 'Question Text'}</div>
               
               {['Yes / No', 'Yes / No + Conditional Follow-up'].includes(questionBuilderForm.type) && (
                 <div className="flex gap-2">
                   <div className="w-4 h-4 rounded-full border border-slate-600"></div> <span className="text-sm text-slate-400 mr-4">Yes</span>
                   <div className="w-4 h-4 rounded-full border border-slate-600"></div> <span className="text-sm text-slate-400">No</span>
                 </div>
               )}
               {questionBuilderForm.type === 'Yes / No / N/A' && (
                 <div className="flex gap-2">
                   <div className="w-4 h-4 rounded-full border border-slate-600"></div> <span className="text-sm text-slate-400 mr-4">Yes</span>
                   <div className="w-4 h-4 rounded-full border border-slate-600"></div> <span className="text-sm text-slate-400 mr-4">No</span>
                   <div className="w-4 h-4 rounded-full border border-slate-600"></div> <span className="text-sm text-slate-400">N/A</span>
                 </div>
               )}
               {['Single Choice', 'Multiple Choice', 'Checkbox / Multiple Select'].includes(questionBuilderForm.type) && (
                 <div className="space-y-2">
                   {questionBuilderForm.options.map((opt, i) => (
                     <div key={i} className="flex gap-2 items-center">
                       <div className={\`w-4 h-4 border border-slate-600 \${questionBuilderForm.type === 'Single Choice' ? 'rounded-full' : 'rounded'}\`}></div>
                       <span className="text-sm text-slate-400">{opt || 'Option ' + (i+1)}</span>
                     </div>
                   ))}
                 </div>
               )}
               {questionBuilderForm.type === 'Text Answer' && (
                 <div className="w-full h-16 border border-slate-700 bg-slate-900 rounded-lg flex items-start p-2">
                   <span className="text-slate-500 text-xs">Text answer area...</span>
                 </div>
               )}
               {questionBuilderForm.type === 'Number' && (
                 <div className="w-32 h-10 border border-slate-700 bg-slate-900 rounded-lg flex items-center p-2">
                   <span className="text-slate-500 text-xs">123...</span>
                 </div>
               )}
               {questionBuilderForm.type === 'Date' && (
                 <div className="w-40 h-10 border border-slate-700 bg-slate-900 rounded-lg flex items-center p-2">
                   <span className="text-slate-500 text-xs">DD/MM/YYYY</span>
                 </div>
               )}
               {questionBuilderForm.type === 'File Upload' && (
                 <div className="px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg inline-flex items-center gap-2 text-xs font-bold">
                   <Plus className="w-3 h-3" /> Upload File
                 </div>
               )}
             </div>
           </div>
           
           <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
             <button 
               onClick={() => setShowQuestionBuilder(false)}
               className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
             >
               Cancel
             </button>
             <button 
               onClick={handleSaveCustomQuestion}
               disabled={isSavingQuestion}
               className="px-6 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
             >
               {isSavingQuestion ? 'Saving...' : 'Save Question'}
             </button>
           </div>
         </div>
       </div>
     );
  };`;

if (code.includes(stateTarget)) {
    code = code.replace(stateTarget, stateReplacement);
} else {
    console.log("Could not find state target");
}

// Modify the button onClick to open the modal
const buttonTarget = `                <button 
                  onClick={() => {
                     const text = prompt("Enter new attribute/question to test:");
                     if (text && text.trim()) {
                       const contextClass = reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord.testingClassification);
                       setCustomQuestions(prev => [...prev, { id: 'CQ' + Math.floor(Math.random()*10000), text, contextClass }]);
                     }
                  }}`;
const buttonReplacement = `                <button 
                  onClick={() => setShowQuestionBuilder(true)}`;

if (code.includes(buttonTarget)) {
    code = code.replace(buttonTarget, buttonReplacement);
}

// Ensure renderQuestionBuilderModal is rendered before the closing </div> of the main component
const renderTarget = `      {renderReviewModal()}
      {renderUploadModal()}
    </div>`;
const renderReplacement = `      {renderReviewModal()}
      {renderUploadModal()}
      {renderQuestionBuilderModal()}
    </div>`;

if (code.includes(renderTarget)) {
    code = code.replace(renderTarget, renderReplacement);
}

fs.writeFileSync('src/components/SamplingView.tsx', code);
console.log("Successfully updated SamplingView.tsx");

