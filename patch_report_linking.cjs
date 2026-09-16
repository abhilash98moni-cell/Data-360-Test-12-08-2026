const fs = require('fs');

let file = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

// 1. Add import
if (!file.includes('DEFAULT_REPORT_SECTIONS')) {
    file = file.replace("import { RequiredDataQuestionnaire } from './RequiredDataQuestionnaire';", "import { RequiredDataQuestionnaire } from './RequiredDataQuestionnaire';\nimport { DEFAULT_REPORT_SECTIONS } from './WordReportEditor';");
}

// 2. Add state inside SamplingView component
const stateHook = `  const [reviewException, setReviewException] = useState('');`;
const newState = `  const [reviewException, setReviewException] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);
  const [reportSection, setReportSection] = useState('detailedFindings');
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportLinkAction, setReportLinkAction] = useState<string | null>(null);
  const [existingReportContent, setExistingReportContent] = useState<string | null>(null);
`;
if (!file.includes('const [includeInReport')) {
    file = file.replace(stateHook, newState);
}

// 3. Add checkReportSyncStatus & syncFindingToReport
const helperFunctions = `
  const checkReportSyncStatus = async (record: any) => {
      try {
          const res = await fetch(\`/api/reports?distributor=\${record.distributorId || 'Midwest Trading Co.'}\`, {
             headers: { 'x-user-role': currentUser?.role || '', 'x-user-organization': currentUser?.organization || '' }
          });
          const data = await res.json();
          if (!data.success || !data.reports || data.reports.length === 0) return;
          const report = data.reports.find((r: any) => r.status !== 'FINAL' && r.audit_id === (record.auditId || 'eng-101')) || data.reports[0];
          const overview = report.overview || {};
          const documentData = overview.documentData || (report as any).report_content || {};
          
          let foundSec = null;
          let foundContent = null;
          Object.keys(documentData).forEach(sec => {
              const parser = new DOMParser();
              const d = parser.parseFromString(documentData[sec], 'text/html');
              const node = d.querySelector(\`div.linked-finding[data-review-id="\${record.id}"]\`);
              if (node) {
                  foundSec = sec;
                  const contentNode = node.querySelector('.linked-finding-content');
                  if (contentNode) {
                      foundContent = (contentNode as HTMLElement).innerText.trim();
                  }
              }
          });
          
          if (foundSec) {
              setIncludeInReport(true);
              setReportSection(foundSec);
              setExistingReportContent(foundContent);
          } else {
              setIncludeInReport(record.includeInReport || false);
              setReportSection(record.reportSection || 'detailedFindings');
              setExistingReportContent(null);
          }
      } catch (e) {
          console.error("Failed to check report sync status", e);
      }
  };

  const syncFindingToReport = async (record: any, exceptionText: string, section: string, include: boolean, action: string | null) => {
      try {
          const res = await fetch(\`/api/reports?distributor=\${record.distributorId || 'Midwest Trading Co.'}\`, {
             headers: { 'x-user-role': currentUser?.role || '', 'x-user-organization': currentUser?.organization || '' }
          });
          const data = await res.json();
          if (!data.success || !data.reports || data.reports.length === 0) return;
          const report = data.reports.find((r: any) => r.status !== 'FINAL' && r.audit_id === (record.auditId || 'eng-101')) || data.reports[0];
          
          const overview = report.overview || {};
          const documentData = overview.documentData || (report as any).report_content || {};
          
          const parser = new DOMParser();
          let changed = false;
          
          // Remove from other sections if any
          Object.keys(documentData).forEach(sec => {
              if (sec !== section) {
                 const d = parser.parseFromString(documentData[sec], 'text/html');
                 const node = d.querySelector(\`div.linked-finding[data-review-id="\${record.id}"]\`);
                 if (node) {
                     node.remove();
                     documentData[sec] = d.body.innerHTML;
                     changed = true;
                 }
              }
          });
          
          const d = parser.parseFromString(documentData[section] || '', 'text/html');
          let existingNode = d.querySelector(\`div.linked-finding[data-review-id="\${record.id}"]\`);
          
          if (!include) {
              if (existingNode) {
                  existingNode.remove();
                  documentData[section] = d.body.innerHTML;
                  changed = true;
              }
          } else {
              const htmlContent = exceptionText.split('\\n').map(line => \`<p style="margin: 0 0 10px 0;">\${line}</p>\`).join('');
              if (existingNode) {
                  if (action === 'update') {
                      const contentNode = existingNode.querySelector('.linked-finding-content');
                      if (contentNode) {
                          contentNode.innerHTML = htmlContent;
                          documentData[section] = d.body.innerHTML;
                          changed = true;
                      }
                  }
              } else {
                  const newDiv = document.createElement('div');
                  newDiv.className = 'linked-finding';
                  newDiv.setAttribute('data-review-id', record.id);
                  newDiv.style.marginBottom = '20px';
                  newDiv.innerHTML = \`
                     <div class="linked-finding-indicator hide-on-print" style="font-size: 10px; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;" contenteditable="false">
                       🔗 Linked from Sample Review
                     </div>
                     <div class="linked-finding-content">
                       \${htmlContent}
                     </div>
                  \`;
                  d.body.appendChild(newDiv);
                  documentData[section] = d.body.innerHTML;
                  changed = true;
              }
          }
          
          if (changed) {
              report.overview.documentData = documentData;
              report.report_content = documentData;
              await fetch(\`/api/reports/\${report.id}\`, {
                  method: 'PUT',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': \`Bearer \${localStorage.getItem('supabase_token') || ''}\`
                  },
                  body: JSON.stringify(report)
              });
          }
      } catch (e) {
          console.error("Failed to sync finding to report", e);
      }
  };
`;

const openReviewReplacement = `  const openReviewModal = (record: any, classificationContext?: string) => {`;
if (!file.includes('checkReportSyncStatus')) {
   file = file.replace(openReviewReplacement, helperFunctions + '\n' + openReviewReplacement);
   
   // Insert checkReportSyncStatus call inside openReviewModal
   const openReviewContentEnd = `    setReviewException(record.exceptions || '');
    setSaveSuccess(false);
  };`;
   const newOpenReviewContentEnd = `    setReviewException(record.exceptions || '');
    setSaveSuccess(false);
    checkReportSyncStatus(record);
    setReportLinkAction(null);
  };`;
   file = file.replace(openReviewContentEnd, newOpenReviewContentEnd);
}

// 4. In handleSaveReview, call syncFindingToReport
const handleSaveSuccess = `      if (res.ok) {
        setSaveSuccess(true);
        await fetchAssignedSamples();`;
const newHandleSaveSuccess = `      if (res.ok) {
        setSaveSuccess(true);
        await syncFindingToReport(reviewRecord, reviewException, reportSection, includeInReport, reportLinkAction);
        await fetchAssignedSamples();`;
if (!file.includes('syncFindingToReport(reviewRecord')) {
    file = file.replace(handleSaveSuccess, newHandleSaveSuccess);
}

// 5. Add includeInReport and reportSection to payload
const payloadBlock = `    const payload = {
       ...reviewRecord,
       testingStatus: overall,
       overallResult: overall,
       attributeResults: reviewAnswers,
       evidenceFields: reviewFields,
       exceptions: reviewException
    };`;
const newPayloadBlock = `    const payload = {
       ...reviewRecord,
       testingStatus: overall,
       overallResult: overall,
       attributeResults: reviewAnswers,
       evidenceFields: reviewFields,
       exceptions: reviewException,
       includeInReport,
       reportSection
    };`;
if (file.includes(payloadBlock)) {
    file = file.replace(payloadBlock, newPayloadBlock);
}

// 6. Replace Exceptions UI
const exceptionUI = `              <textarea 
                className="w-full h-24 bg-slate-950 border border-rose-900/50 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-600"
                placeholder="Document any exceptions, control failures, or additional findings here..."
                value={reviewException}
                onChange={e => setReviewException(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}`;

const newExceptionUI = `              <textarea 
                className="w-full h-32 bg-slate-950 border border-rose-900/50 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-600"
                placeholder="Document any exceptions, control failures, or additional findings here..."
                value={reviewException}
                onChange={e => {
                   setReviewException(e.target.value);
                   if (reportLinkAction === 'keep') setReportLinkAction('update'); // reset if they type more
                }}
              />
            </div>

              {/* REPORT INCLUSION */}
              <div className="mt-6 p-4 rounded-xl border border-indigo-900/30 bg-indigo-950/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Report Inclusion
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className={includeInReport ? 'text-indigo-400 font-bold' : 'text-slate-500'}>ON</span>
                    <button
                      onClick={() => setIncludeInReport(!includeInReport)}
                      className={\`relative w-10 h-5 rounded-full transition-colors \${includeInReport ? 'bg-indigo-500' : 'bg-slate-700'}\`}
                    >
                      <div className={\`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform \${includeInReport ? 'translate-x-5' : ''}\`} />
                    </button>
                  </div>
                </div>
                
                {includeInReport && (
                  <div className="flex gap-4 items-end mt-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">Report Section</label>
                      <select 
                        value={reportSection}
                        onChange={(e) => setReportSection(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {DEFAULT_REPORT_SECTIONS.map(sec => (
                           <option key={sec.id} value={sec.id}>{sec.label}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={() => setShowReportPreview(true)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 border border-slate-700 h-[38px]"
                    >
                      <Eye className="w-4 h-4" /> Preview in Report
                    </button>
                  </div>
                )}
                
                {(() => {
                   const currentText = reviewException.replace(/\\s+/g, '');
                   const repText = existingReportContent ? existingReportContent.replace(/\\s+/g, '') : '';
                   const isDiverged = existingReportContent && currentText !== repText;
                   
                   if (includeInReport && isDiverged && reportLinkAction !== 'keep' && reportLinkAction !== 'update') {
                     return (
                       <div className="mt-4 p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-amber-400">⚠ Source Review Updated</div>
                            <p className="text-xs text-amber-200/70 mt-1">
                               The content of this review has changed since it was added to the report.
                            </p>
                            <div className="flex gap-3 mt-3">
                              <button onClick={() => setReportLinkAction('update')} className="text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded transition-colors border border-amber-500/30">Update Report</button>
                              <button onClick={() => setReportLinkAction('keep')} className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 transition-colors border border-slate-700 rounded hover:bg-slate-800">Keep Current Report Content</button>
                            </div>
                          </div>
                       </div>
                     );
                   }
                   return null;
                })()}
              </div>
          </div>

          {showReportPreview && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
                <div className="bg-[#f1f5f9] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-300">
                   <div className="p-4 border-b border-slate-300 flex justify-between items-center bg-white shadow-sm z-10">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Report Preview: {DEFAULT_REPORT_SECTIONS.find(s => s.id === reportSection)?.label}
                      </h3>
                      <button onClick={() => setShowReportPreview(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-md">
                        <X className="w-5 h-5" />
                      </button>
                   </div>
                   <div className="p-8 overflow-y-auto bg-[#f1f5f9] flex-1 flex justify-center">
                      <div className="bg-white p-12 shadow-sm border border-slate-200" style={{ width: '8.5in', minHeight: '4in', color: '#0f172a', fontFamily: '"Arial", sans-serif', fontSize: '11pt', lineHeight: '1.5' }}>
                         <h2 style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '2px solid #1e3a8a', paddingBottom: '4px', marginBottom: '16px', textTransform: 'uppercase' }}>
                            {DEFAULT_REPORT_SECTIONS.find(s => s.id === reportSection)?.label}
                         </h2>
                         <div className="linked-finding" style={{ marginBottom: '20px' }}>
                           <div className="linked-finding-indicator hide-on-print" style={{ fontSize: '10px', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                             🔗 Linked from Sample Review
                           </div>
                           <div className="linked-finding-content">
                             {reviewException.split('\\n').map((line, i) => <p key={i} style={{ margin: '0 0 10px 0' }}>{line}</p>)}
                           </div>
                         </div>
                      </div>
                   </div>
                   <div className="p-4 border-t border-slate-300 bg-white flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                      <button onClick={() => setShowReportPreview(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 border border-transparent hover:bg-slate-100 rounded-lg transition-colors">
                         Close Preview
                      </button>
                      <button onClick={() => { setShowReportPreview(false); setIncludeInReport(true); }} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                         Confirm & Add to Report
                      </button>
                   </div>
                </div>
             </div>
          )}

          {/* Footer */}`;
if (file.includes(exceptionUI)) {
    file = file.replace(exceptionUI, newExceptionUI);
}

fs.writeFileSync('src/components/SamplingView.tsx', file);
console.log('Reporting Linking patched successfully.');
