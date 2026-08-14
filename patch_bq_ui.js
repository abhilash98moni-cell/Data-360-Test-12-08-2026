import fs from 'fs';

let code = fs.readFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', 'utf8');

const topBannerReplacement = `      {/* Top Banner / Context Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              BUSINESS QUESTIONNAIRE
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {selectedClient} <span className="text-slate-500 mx-2">/</span> {selectedDistributor}
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {isAuditor && (
               <button
                onClick={() => {
                  setCustomSectionsDraft(JSON.parse(JSON.stringify(activeSections)));
                  setIsCustomizeModalOpen(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Filter className="h-4 w-4" />
                Customize Questionnaire
              </button>
            )}

            <div className="w-full sm:w-auto px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-center min-w-[200px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400 font-medium">Completion</span>
                <span className="text-xs font-bold text-emerald-400">{questionnaireState?.completionPercentage || 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: \`\${questionnaireState?.completionPercentage || 0}%\` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1.5 flex justify-between">
                <span>{questionnaireState?.answeredCount || 0} answered</span>
                <span>{questionnaireState?.totalCount || TOTAL_BUSINESS_QUESTIONNAIRE_QUESTIONS} total</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 items-end min-w-[140px]">
              {questionnaireState?.status === 'Submitted' && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  SUBMITTED
                </div>
              )}
              {questionnaireState?.editAccessStatus === 'REQUESTED' && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  EDIT ACCESS REQUESTED
                </div>
              )}
              {questionnaireState?.editAccessStatus === 'APPROVED' && (
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  EDITING ACTIVE
                </div>
              )}
              {questionnaireState?.isLocked && questionnaireState?.editAccessStatus !== 'REQUESTED' && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-semibold">
                  <Lock className="h-3.5 w-3.5" />
                  EDITING LOCKED
                </div>
              )}
              {isDistributor && questionnaireState?.isLocked && questionnaireState?.editAccessStatus !== 'REQUESTED' && (
                <button
                  onClick={handleRequestEditAccess}
                  disabled={isEditRequesting}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline-offset-2 hover:underline mt-1 disabled:opacity-50"
                >
                  Request Edit Access
                </button>
              )}
              {isAuditor && questionnaireState?.editAccessStatus === 'REQUESTED' && (
                <div className="flex gap-2 mt-1">
                   <button
                    onClick={() => handleReviewEditAccess('APPROVE')}
                    disabled={isEditReviewing}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded font-medium transition-colors disabled:opacity-50"
                   >
                     Approve Edit
                   </button>
                   <button
                    onClick={() => handleReviewEditAccess('REJECT')}
                    disabled={isEditReviewing}
                    className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded font-medium transition-colors disabled:opacity-50"
                   >
                     Reject
                   </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                {syncStatus === 'saving' ? (
                  <><RefreshCw className="h-3 w-3 animate-spin" /> Saving...</>
                ) : syncStatus === 'error' ? (
                  <><AlertTriangle className="h-3 w-3 text-rose-500" /> Error saving</>
                ) : (
                  <><Check className="h-3 w-3 text-emerald-500" /> Synced {lastSyncTime}</>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>`;

// Find where the Top Banner is and replace it.
const regex = /\{\/\* Top Banner \/ Context Header \*\/\}.*?(?=\{\/\* Search & Filters \*\/\})/s;
code = code.replace(regex, topBannerReplacement + '\n\n      ');

fs.writeFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', code);
console.log('patched UI');
