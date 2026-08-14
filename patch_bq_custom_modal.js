import fs from 'fs';

let code = fs.readFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', 'utf8');

const customizeModal = `
      {/* Customization Modal */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Filter className="h-5 w-5 text-indigo-400" />
                  Customize Questionnaire
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Modify questions, descriptions, or requirements for {selectedDistributor}.
                </p>
              </div>
              <button 
                onClick={() => setIsCustomizeModalOpen(false)}
                className="text-slate-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50 space-y-8">
              {customSectionsDraft.map((section, sIdx) => (
                <div key={section.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-white text-lg">{section.title}</h4>
                    <button 
                      onClick={() => {
                        const newDraft = [...customSectionsDraft];
                        newDraft[sIdx].questions.push({
                          id: \`q-\${section.sectionNumber}.\${newDraft[sIdx].questions.length + 1}-custom\`,
                          sectionId: section.id,
                          questionNumber: \`\${section.sectionNumber}.\${newDraft[sIdx].questions.length + 1}\`,
                          questionText: 'New Question',
                          guidance: '',
                          responseType: 'yes_no_details',
                          isRequired: true,
                          allowAttachment: false,
                          isActive: true
                        });
                        setCustomSectionsDraft(newDraft);
                      }}
                      className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                    >
                      + Add Question
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {section.questions.map((q: any, qIdx: number) => (
                      <div key={q.id} className={\`p-4 rounded-lg border \${q.isActive !== false ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'}\`}>
                        <div className="flex justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <input 
                              type="text" 
                              value={q.questionText}
                              onChange={(e) => {
                                const newDraft = [...customSectionsDraft];
                                newDraft[sIdx].questions[qIdx].questionText = e.target.value;
                                setCustomSectionsDraft(newDraft);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                              placeholder="Question text..."
                            />
                          </div>
                          <button
                            onClick={() => {
                              const newDraft = [...customSectionsDraft];
                              newDraft[sIdx].questions[qIdx].isActive = q.isActive === false ? true : false;
                              setCustomSectionsDraft(newDraft);
                            }}
                            className={\`px-3 py-1.5 rounded-md text-xs font-medium border \${q.isActive !== false ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}\`}
                          >
                            {q.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <label className="text-slate-400">Response Type:</label>
                            <select 
                              value={q.responseType}
                              onChange={(e) => {
                                const newDraft = [...customSectionsDraft];
                                newDraft[sIdx].questions[qIdx].responseType = e.target.value;
                                setCustomSectionsDraft(newDraft);
                              }}
                              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                            >
                              <option value="yes_no_details">Yes/No + Details</option>
                              <option value="long_text">Long Text</option>
                              <option value="multiple_choice">Multiple Choice</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={q.isRequired !== false}
                              onChange={(e) => {
                                const newDraft = [...customSectionsDraft];
                                newDraft[sIdx].questions[qIdx].isRequired = e.target.checked;
                                setCustomSectionsDraft(newDraft);
                              }}
                              id={\`req-\${q.id}\`}
                              className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500/20"
                            />
                            <label htmlFor={\`req-\${q.id}\`} className="text-slate-400">Required</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={q.allowAttachment === true}
                              onChange={(e) => {
                                const newDraft = [...customSectionsDraft];
                                newDraft[sIdx].questions[qIdx].allowAttachment = e.target.checked;
                                setCustomSectionsDraft(newDraft);
                              }}
                              id={\`att-\${q.id}\`}
                              className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500/20"
                            />
                            <label htmlFor={\`att-\${q.id}\`} className="text-slate-400">Allow Attachment</label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
              <button
                onClick={() => setIsCustomizeModalOpen(false)}
                className="px-5 py-2.5 text-slate-300 hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveCustomization(customSectionsDraft)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Save Customization
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  "      {/* Top Banner / Context Header */}",
  customizeModal + "\n      {/* Top Banner / Context Header */}"
);

fs.writeFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', code);
console.log('patched custom modal');
