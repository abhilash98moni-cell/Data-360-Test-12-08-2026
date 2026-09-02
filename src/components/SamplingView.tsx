import React, { useState, useEffect, useMemo } from 'react';
import { RequiredDataQuestionnaire } from './RequiredDataQuestionnaire';
import { Plus,  
  ArrowLeft, Search, Filter, CheckCircle2, AlertTriangle, 
  FileText, Info, Save, X, Edit, ExternalLink, Database, Upload, FileSpreadsheet
 } from 'lucide-react';
import { UserSession } from '../types';

interface SamplingViewProps {
  isEvidenceManagementMode?: boolean;
  currencyMode?: string;
  selectedClient: string;
  selectedDistributor: string;
  selectedAuditFilter?: string;
  currentUser: UserSession | null;
  onFindingCreated?: (finding: any) => void;
}

const formatCurrency = (val: number | null, mode: string = 'INR') => {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat(mode === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: mode }).format(val);
};

const TESTING_TEMPLATES: Record<string, {id: string, text: string}[]> = {
  'Sales Testing': [
    { id: 'A', text: 'Customer is an approved entity per the company customer master file.' },
    { id: 'B', text: 'Credit note/other incentive is not to/on behalf of an individual or government official.' },
    { id: 'C', text: 'GL account coding appropriately reflects the transaction.' },
    { id: 'D', text: 'Supporting documentation is in accordance with policy and includes required documentation.' },
    { id: 'E', text: 'Relevant approvals are noted.' },
    { id: 'F', text: 'Approvals were rendered prior to the transaction.' },
    { id: 'G', text: 'Transaction occurred after execution of contract/addendum.' },
    { id: 'H', text: 'Pricing is in accordance with the effective contract.' },
  ],
  'Employee Disbursement & Reimbursement': [
    { id: 'A', text: 'Expenditure is allowed per company policy / does not relate to prohibited items.' },
    { id: 'B', text: 'Payment/expenditure is not to/on behalf of a government official.' },
    { id: 'C', text: 'GL account coding appropriately reflects the nature of the expenditure.' },
    { id: 'D', text: 'Supporting documentation complies with company policy and includes required expense report, approval form and underlying receipts.' },
    { id: 'E', text: 'Supporting documentation/receipts do not contain generic/questionable line items.' },
    { id: 'F', text: 'Relevant approvals are noted in line with policy.' },
    { id: 'G', text: 'Expense reimbursement is mathematically accurate.' },
    { id: 'H', text: 'Description, business purpose, location and attendees/company information are properly documented.' },
  ],
  '3rd Party Disbursement': [
    { id: 'A', text: 'Expenditure is allowed per the Distributor\'s policy.' },
    { id: 'B', text: 'Payment/expenditure is not to/on behalf of an individual or government official.' },
    { id: 'C', text: 'At the time payment was made, the vendor is an approved entity per the distributor\'s approved vendor master file.' },
    { id: 'D', text: 'General ledger account coding appropriately reflects the nature of the transaction.' },
    { id: 'E', text: 'Supporting documentation is in accordance with the distributor\'s policy and/or includes the required supporting documents such as contract/purchase order, invoice, proof of acceptance/service, approval form and evidence of payment.' },
    { id: 'F', text: 'Relevant approvals noted for the transaction in line with policy.' },
    { id: 'G', text: 'Supporting documentation verifies that approvals were rendered prior to payment.' },
    { id: 'H', text: 'Invoice/supporting documentation does not contain generic or questionable line items.' },
    { id: 'I', text: 'Supporting documentation verifies that goods/services were rendered after execution of contract/addendum.' },
    { id: 'J', text: 'Pricing of goods/services is in accordance with the effective contract.' },
    { id: 'K', text: 'Supporting documentation verifies that goods/services were rendered prior to payment.' },
    { id: 'L', text: 'Payment method was proper.' },
  ]
};

const EVIDENCE_FIELDS: Record<string, {id: string, label: string, type: string}[]> = {
  '3rd Party Disbursement': [
    { id: 'thirdPartyName', label: 'Third Party Name', type: 'text' },
    { id: 'transactionAmountUSD', label: 'Transaction Amount USD', type: 'text' },
    { id: 'approver', label: 'Approver', type: 'text' },
    { id: 'hasContract', label: 'Contract?', type: 'select' },
    { id: 'hasInvoice', label: 'Invoice?', type: 'select' },
    { id: 'hasProofOfService', label: 'Proof of Service?', type: 'select' },
    { id: 'hasPaymentSupport', label: 'Payment Support?', type: 'select' },
    { id: 'otherDocsProvided', label: 'Other Supporting Documents Provided', type: 'text' },
    { id: 'docsNotProvided', label: 'Supporting Documents Not Provided', type: 'text' },
  ],
  'Employee Disbursement & Reimbursement': [
    { id: 'employeeName', label: 'Employee Name', type: 'text' },
    { id: 'employeeTitle', label: 'Employee Title', type: 'text' },
    { id: 'transactionAmountUSD', label: 'Transaction Amount USD', type: 'text' },
    { id: 'hasExpenseReport', label: 'Expense Report?', type: 'select' },
    { id: 'hasReceipts', label: 'Underlying Receipts/Invoices?', type: 'select' },
    { id: 'approvals', label: 'Approvals/Approver Names?', type: 'text' },
    { id: 'otherDocsProvided', label: 'Other Supporting Documents Provided', type: 'text' },
    { id: 'docsNotProvided', label: 'Supporting Documents Not Provided', type: 'text' },
    { id: 'transactionOverview', label: 'Transaction Overview', type: 'text' },
  ],
  'Sales Testing': [
    { id: 'thirdPartyName', label: 'Third Party Name / Customer', type: 'text' },
    { id: 'transactionAmountUSD', label: 'Transaction Amount USD', type: 'text' },
    { id: 'hasContract', label: 'Contract and/or Purchase Order?', type: 'select' },
    { id: 'hasInvoice', label: 'Invoice?', type: 'select' },
    { id: 'hasGoodsReceipt', label: 'Goods/Service Receipt/Delivery Note?', type: 'select' },
    { id: 'approvals', label: 'Approvals / Approver?', type: 'text' },
    { id: 'otherDocsProvided', label: 'Other Supporting Documents Provided', type: 'text' },
    { id: 'docsNotProvided', label: 'Supporting Documents Not Provided', type: 'text' },
    { id: 'transactionOverview', label: 'Transaction Overview', type: 'text' },
  ]
};

export const SamplingView: React.FC<SamplingViewProps> = ({
  isEvidenceManagementMode = false,
  selectedClient,
  selectedDistributor,
  selectedAuditFilter,
  currentUser,
  currencyMode = 'INR'
}) => {
  const isDistributor = currentUser?.role === 'Distributor';
  const [openClassificationId, setOpenClassificationId] = useState<string | null>(null);
  const [openQuestionnaireFor, setOpenQuestionnaireFor] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'GL' | '3PD' | 'EMP' | 'SALES'>('GL');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'reading' | 'mapping' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');
  const [glHeaders, setGlHeaders] = useState<string[]>([]);
  const [glMapping, setGlMapping] = useState<Record<string, string>>({});
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState({ filename: '', records: 0 });

  
  const [availablePopulations, setAvailablePopulations] = useState<any[]>([]);
  const [selectedPopulation, setSelectedPopulation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [populationRecords, setPopulationRecords] = useState<any[]>([]);
  const [assignedSamples, setAssignedSamples] = useState<any[]>([]);
  
  const [reviewRecord, setReviewRecord] = useState<any | null>(null);
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, { result: string, comment: string }>>({});
  const [reviewFields, setReviewFields] = useState<Record<string, string>>({});
  const [reviewException, setReviewException] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [questionBuilderForm, setQuestionBuilderForm] = useState({
    text: '',
    type: 'Yes / No',
    required: false,
    scope: 'classification',
    guidance: '',
    options: ['Option 1', 'Option 2'],
    conditionalRules: [] as any[]
  });
  
  const fetchCustomQuestions = async () => {
      try {
        const params = new URLSearchParams({
          distributorId: selectedDistributor,
          auditId: selectedAuditFilter || 'eng-101',
        });
        const res = await fetch(`/api/sampling/questions?${params.toString()}`, {
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
             options: q.options || [],
             conditionalRules: q.conditional_rules || [],
             attributeCode: q.attribute_code,
             scope: q.scope || 'classification',
             sampleId: q.sample_id,
             dbId: q.dbId
          }));
          setCustomQuestions(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch custom questions", err);
      }
  };

  // Fetch custom questions on load
  useEffect(() => {
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
       
       // Calculate next attribute code
       const baseTemplate = TESTING_TEMPLATES[contextClass] || [];
       const existingClassQuestions = customQuestions.filter(q => q.contextClass === contextClass);
       
       // Find the highest letter
       let highestCharCode = 64; // Before 'A'
       for (const attr of baseTemplate) {
          if (attr.id && attr.id.length === 1) {
             const code = attr.id.charCodeAt(0);
             if (code > highestCharCode) highestCharCode = code;
          }
       }
       for (const attr of existingClassQuestions) {
          if (attr.attributeCode && attr.attributeCode.length === 1) {
             const code = attr.attributeCode.charCodeAt(0);
             if (code > highestCharCode) highestCharCode = code;
          }
       }
       const nextAttributeCode = String.fromCharCode(highestCharCode + 1);

       const payload = {
          question_id: 'CQ' + Date.now(),
          engagement_id: selectedAuditFilter || 'eng-101',
          testing_classification: contextClass,
          question_text: questionBuilderForm.text,
          question_type: questionBuilderForm.type,
          required: questionBuilderForm.required,
          scope: questionBuilderForm.scope,
          sample_id: questionBuilderForm.scope === 'sample' ? reviewRecord?.id : null,
          attribute_code: nextAttributeCode,
          options: questionBuilderForm.options,
          conditional_rules: questionBuilderForm.conditionalRules,
          display_order: customQuestions.length
       };
       
       const res = await fetch('/api/sampling/questions', {
          method: 'POST',
          headers: {
             'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
             'x-user-organization': currentUser?.organization || '',
             'x-user-name': currentUser?.name || ''
          },
          body: JSON.stringify(payload)
       });
       const data = await res.json();
       if (data.success) {
          setShowQuestionBuilder(false);
          setQuestionBuilderForm({
             text: '',
             type: 'Yes / No',
             required: false,
             scope: 'classification',
             guidance: '',
             options: ['Option 1', 'Option 2'],
             conditionalRules: []
          });
          await fetchCustomQuestions();
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
                       <div className={`w-4 h-4 border border-slate-600 ${questionBuilderForm.type === 'Single Choice' ? 'rounded-full' : 'rounded'}`}></div>
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
  };

  // Fetch Available Populations
  useEffect(() => {
    const fetchPopulations = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          distributorId: selectedDistributor,
          auditId: selectedAuditFilter || 'eng-101',
        });
        const res = await fetch(`/api/evidence?${params.toString()}`, {
          headers: {
            'x-user-email': currentUser?.email || '',
            'x-user-role': currentUser?.role || '',
            'x-user-organization': currentUser?.organization || ''
          }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          const filtered = data.records.filter((r: any) => {
            const usage = r.documentUsage || '';
            const status = r.status || '';
            const isAcceptable = ['ACCEPTED', 'AVAILABLE', 'PENDING_REVIEW', 'PENDING'].includes(status.toUpperCase().replace(/\s+/g, '_'));
            const isTemplate = (r.fileName || '').toLowerCase().includes('template') || (r.fileName || '').toLowerCase().includes('questionnaire');
            if (isTemplate) return false;
            const hasSamplingUsage = Array.isArray(usage) ? usage.includes('SAMPLING_POPULATION') : usage.includes('SAMPLING_POPULATION');
            return (r.samplingEnabled === true || String(r.samplingEnabled) === 'true') && hasSamplingUsage && isAcceptable;
          });
          setAvailablePopulations(filtered);
          if (filtered.length > 0 && !selectedPopulation) {
            handleSelectPopulation(filtered[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch populations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPopulations();
  }, [selectedDistributor, selectedAuditFilter]);

  const fetchAssignedSamples = async () => {
    try {
      const res = await fetch(`/api/sampling/transactions?distributorId=${encodeURIComponent(selectedDistributor)}&auditId=${encodeURIComponent(selectedAuditFilter || 'eng-101')}`, {
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      const data = await res.json();
      if (data.success) {
        setAssignedSamples(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch assigned samples", err);
    }
  };

  useEffect(() => {
    if (selectedDistributor) {
      fetchAssignedSamples();
    }
  }, [selectedDistributor, selectedAuditFilter]);

  const handleSelectPopulation = async (targetFile: any) => {
    
    setSelectedPopulation(targetFile);
    setLoading(true);
    try {
      const fileIdToFetch = targetFile.googleDriveFileId || targetFile.id;
      const res = await fetch(`/api/storage/download/${fileIdToFetch}?fileName=${encodeURIComponent(targetFile.fileName)}`);
      if (!res.ok) throw new Error(`Failed to download file ${targetFile.fileName}`);
      
      const buffer = await res.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
      
      if (!jsonData || jsonData.length === 0) {
        setPopulationRecords([]);
      } else {
        let mapping: any = {};
        if (typeof targetFile.glMapping === 'string') {
           try { mapping = JSON.parse(targetFile.glMapping); } catch(e) {}
        } else if (typeof targetFile.mappedData === 'string') {
           try { mapping = JSON.parse(targetFile.mappedData); } catch(e) {}
        } else {
           mapping = targetFile.glMapping || targetFile.mappedData || {};
        }
        const parsedRecords = jsonData.map((row: any, index: number) => {
           const keys = Object.keys(row);
           if (keys.length === 0) return null;
           const findVal = (matchKeys: string[], explicitKey?: string) => {
               if (explicitKey && row[explicitKey] !== undefined) return row[explicitKey] !== "" ? row[explicitKey] : '—';
               const key = keys.find(k => matchKeys.some(match => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(match.toLowerCase().replace(/[^a-z0-9]/g, ''))));
               return key && row[key] !== "" ? row[key] : '—';
           };
           
           let dateVal = findVal(['date', 'transactiondate', 'invoicedate', 'postingdate', 'time'], mapping.date);
           let voucherNoVal = findVal(['voucherno', 'referenceno', 'transactionid', 'invoicenumber', 'invoiceno', 'documentid', 'refno', 'reference', 'id', 'slno'], mapping.voucherNo);
           let accountNumVal = findVal(['accountnumber', 'accountno', 'glaccount', 'account'], mapping.accountNumber);
           let accountDescVal = findVal(['accountdescription', 'accountname', 'glname'], mapping.accountDescription);
           let descVal = findVal(['description', 'particulars', 'memo', 'notes', 'purpose', 'details', 'item', 'product', 'vendor', 'customer', 'employee', 'payee'], mapping.description);
           let narrationVal = findVal(['narration', 'remarks', 'comment'], mapping.narration);
           let debitVal = findVal(['debit', 'dr'], mapping.debit);
           let creditVal = findVal(['credit', 'cr'], mapping.credit);
           let balanceVal = findVal(['balance', 'bal'], mapping.balance);
           
           const parseAmount = (val: any) => {
               if (val === '—' || val === '' || val === null || val === undefined) return null;
               if (typeof val === 'string') {
                   const parsed = parseFloat(val.replace(/[^0-9.-]+/g, ""));
                   return isNaN(parsed) ? null : parsed;
               }
               const num = Number(val);
               return isNaN(num) ? null : num;
           };
           const debit = parseAmount(debitVal);
           const credit = parseAmount(creditVal);
           const balance = parseAmount(balanceVal);
           
           let idVal = voucherNoVal !== '—' && voucherNoVal !== undefined ? String(voucherNoVal) : `RECORD-${index + 1}`;
           if (idVal === '—') idVal = `RECORD-${index + 1}`;
           
           return {
             id: idVal,
             date: dateVal !== '—' ? String(dateVal) : '—',
             voucherNo: voucherNoVal !== '—' ? String(voucherNoVal) : '—',
             accountNumber: accountNumVal !== '—' ? String(accountNumVal) : '—',
             accountDescription: accountDescVal !== '—' ? String(accountDescVal) : '—',
             description: descVal !== '—' ? String(descVal) : '—',
             narration: narrationVal !== '—' ? String(narrationVal) : '—',
             debit: debit,
             credit: credit,
             balance: balance,
             originalRow: row
           };
        }).filter(Boolean);
        setPopulationRecords(parsedRecords);
      }
    } catch (err: any) {
      console.error("Error loading population:", err);
      setPopulationRecords([]);
    } finally {
      setLoading(false);
    }

  };



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // duplicate check
    const isDuplicate = availablePopulations.some(p => p.fileName === file.name);
    if (isDuplicate) {
        const confirm = window.confirm('This file appears to have already been uploaded. Upload anyway?');
        if (!confirm) {
            e.target.value = '';
            return;
        }
    }
    
    setUploadFile(file);
    setUploadModalOpen(true);
    setUploadState('reading');
    setUploadError('');
    
    try {
      const buffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
      
      if (!jsonData || jsonData.length === 0) {
        throw new Error('The file appears to be empty.');
      }
      
      const keys = Object.keys(jsonData[0]);
      setGlHeaders(keys);
      
      // Auto-map
      const findMatch = (matchKeys: string[]) => keys.find(k => matchKeys.some(m => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(m.toLowerCase().replace(/[^a-z0-9]/g, '')))) || '';
      
      const initialMapping = {
        date: findMatch(['date', 'transactiondate', 'invoicedate', 'postingdate', 'time']),
        voucherNo: findMatch(['voucherno', 'referenceno', 'transactionid', 'invoicenumber', 'invoiceno', 'documentid', 'refno', 'reference', 'id', 'slno']),
        accountNumber: findMatch(['accountnumber', 'accountno', 'glaccount', 'account']),
        accountDescription: findMatch(['accountdescription', 'accountname', 'glname']),
        description: findMatch(['description', 'particulars', 'memo', 'notes', 'purpose', 'details', 'item', 'product', 'vendor', 'customer', 'employee', 'payee']),
        narration: findMatch(['narration', 'remarks', 'comment']),
        debit: findMatch(['debit', 'dr']),
        credit: findMatch(['credit', 'cr']),
        balance: findMatch(['balance', 'bal'])
      };
      
      setGlMapping(initialMapping);
      setUploadSuccessMessage({ filename: file.name, records: jsonData.length });
      
      // Validate mapping to see if we can confidently identify it
      const hasDate = !!initialMapping.date;
      const hasId = !!initialMapping.voucherNo;
      const hasDesc = !!initialMapping.description || !!initialMapping.narration;
      const hasAmount = !!initialMapping.debit || !!initialMapping.credit;
      
      // if all required fields are found and there is no ambiguity, we still show mapping for user to confirm
      setUploadState('mapping');
      
    } catch (err: any) {
      console.error(err);
      setUploadState('error');
      setUploadError(err.message || 'Failed to read file');
    }
  };

  const confirmUpload = async () => {
    if (!uploadFile) return;
    
    // Validate required fields based on mapping
    if (!glMapping.date) {
      setUploadError('Unable to import this file because the transaction date could not be identified.');
      return;
    }
    if (!glMapping.voucherNo) {
      setUploadError('Unable to import this file because the Voucher No or Transaction ID could not be identified.');
      return;
    }
    if (!glMapping.description && !glMapping.narration) {
      setUploadError('Unable to import this file because the description could not be identified.');
      return;
    }
    if (!glMapping.debit && !glMapping.credit) {
      setUploadError('Unable to import this file because the transaction amount (Debit/Credit) could not be identified.');
      return;
    }
    
    setUploadState('uploading');
    setUploadError('');
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('distributorName', selectedDistributor);
    formData.append('auditId', selectedAuditFilter || 'eng-101');
    formData.append('clientName', selectedClient || 'Apex Electronics Corp');
    formData.append('glMapping', JSON.stringify(glMapping));
    
    try {
      const res = await fetch('/api/sampling/upload', {
        method: 'POST',
        headers: {
          'x-user-email': currentUser?.email || 'auditor@data360.io',
          'x-user-role': currentUser?.role || 'Auditor'
        },
        body: formData
      });
      
      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text && text.includes('<!DOCTYPE') ? 'Server returned an invalid HTML response instead of JSON.' : (text || 'Upload failed'));
      }
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload');
      }
      
      setUploadSuccessMessage({
        filename: uploadFile.name,
        records: uploadFile.size ? Math.max(1, Math.round(uploadFile.size / 150)) : 100
      });
      setUploadState('success');
      
      // reload populations
      const fetchPopulations = async () => {
        const params = new URLSearchParams({
          distributorId: selectedDistributor,
          auditId: selectedAuditFilter || 'eng-101',
        });
        const popRes = await fetch(`/api/evidence?${params.toString()}`, {
          headers: {
            'x-user-email': currentUser?.email || 'auditor@data360.io',
            'x-user-role': currentUser?.role || 'Auditor',
            'x-user-organization': currentUser?.organization || 'Apex Audit Practice (AA)'
          }
        });
        
        let popData: any = { success: false, records: [] };
        const popContentType = popRes.headers.get('content-type') || '';
        if (popContentType.includes('application/json')) {
          popData = await popRes.json();
        }
        if (popData.success && Array.isArray(popData.records)) {
          const filtered = popData.records.filter((r: any) => {
            const usage = r.documentUsage || '';
            const status = r.status || '';
            const isAcceptable = ['ACCEPTED', 'AVAILABLE', 'PENDING_REVIEW', 'PENDING'].includes(status.toUpperCase().replace(/\s+/g, '_'));
            const isTemplate = (r.fileName || '').toLowerCase().includes('template') || (r.fileName || '').toLowerCase().includes('questionnaire');
            if (isTemplate) return false;
            const hasSamplingUsage = Array.isArray(usage) ? usage.includes('SAMPLING_POPULATION') : usage.includes('SAMPLING_POPULATION');
            return (r.samplingEnabled === true || String(r.samplingEnabled) === 'true') && hasSamplingUsage && isAcceptable;
          });
          setAvailablePopulations(filtered);
          
          // Select the newly uploaded file by fileId
          if (data.fileId) {
             const newFile = filtered.find((p: any) => p.googleDriveFileId === data.fileId || p.id === data.fileId);
             if (newFile) {
                await handleSelectPopulation(newFile);
             } else {
                if (filtered.length > 0) await handleSelectPopulation(filtered[0]);
             }
          }
        }
      };
      
      await fetchPopulations();
      
    } catch (err: any) {
      console.error(err);
      setUploadState('error');
      setUploadError(err.message || 'Failed to upload file');
    }
  };

  const handleClassify = async (record: any, newClassifications: string[]) => {
    const isClearing = newClassifications.length === 0 || newClassifications.includes('N/A');
    const finalClassifications = isClearing ? (newClassifications.includes('N/A') ? ['N/A'] : []) : newClassifications;
    
    let refPrefix = '';
    if (!isClearing && finalClassifications.length > 0) {
       const first = finalClassifications[0];
       if (first === '3rd Party Disbursement') refPrefix = '3PD';
       else if (first === 'Employee Disbursement & Reimbursement') refPrefix = 'EMP';
       else if (first === 'Sales Testing') refPrefix = 'SAL';
    }
    
    const newRef = isClearing ? '' : (record.testingReference || `${refPrefix}-${record.id}`);
    
    const payload = {
       sampleId: record.id,
       distributorId: selectedDistributor,
       auditId: selectedAuditFilter || 'eng-101',
       fileId: selectedPopulation?.id || 'unknown',
       testingClassification: finalClassifications,
       testingStatus: isClearing ? 'Pending Classification' : (record.testingStatus === 'Pending Classification' ? 'Assigned' : record.testingStatus),
       testingReference: newRef,
       originalRow: record.originalRow,
       date: record.date,
       voucherNo: record.voucherNo,
       accountNumber: record.accountNumber,
       accountDescription: record.accountDescription,
       description: record.description,
       narration: record.narration,
       debit: record.debit,
       credit: record.credit,
       balance: record.balance
    };
    
    try {
      const res = await fetch('/api/sampling/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || ''
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchAssignedSamples();
      }
    } catch (err) {
      console.error("Failed to classify record", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (openClassificationId) setOpenClassificationId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openClassificationId]);

  const mergedRecords = useMemo(() => {
    return populationRecords.map(pop => {
      const dbSample = assignedSamples.find(s => s.sampleId === pop.id);
      if (dbSample) {
        let tc = dbSample.testingClassification;
        let parsedClassifications = [];
        if (Array.isArray(tc)) {
            parsedClassifications = tc;
        } else if (typeof tc === 'string') {
            if (tc === 'Not Selected' || tc === '' || tc === 'Pending Classification') {
                parsedClassifications = [];
            } else {
                parsedClassifications = [tc];
            }
        }
        return { ...pop, ...dbSample, testingClassification: parsedClassifications, isAssigned: true };
      }
      return { 
        ...pop, 
        testingClassification: [], 
        testingStatus: 'Pending Classification',
        testingReference: '',
        isAssigned: false 
      };
    }).filter(rec => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (rec.voucherNo || '').toLowerCase().includes(q) ||
            (rec.description || '').toLowerCase().includes(q) ||
            (rec.testingReference || '').toLowerCase().includes(q)
        );
    });
  }, [populationRecords, assignedSamples, searchQuery]);

  const openReviewModal = (record: any, classificationContext?: string) => {
    setReviewRecord({ ...record, _activeClassificationContext: classificationContext || (Array.isArray(record.testingClassification) ? record.testingClassification[0] : record.testingClassification) });
    setReviewAnswers(record.attributeResults || {});
    setReviewFields(record.evidenceFields || {
       thirdPartyName: record.description || '',
       employeeName: record.description || '',
       transactionAmountUSD: (record.debit || record.credit || 0).toString()
    });
    setReviewException(record.exceptions || '');
    setSaveSuccess(false);
  };

  const handleSaveReview = async () => {
    if (!reviewRecord) return;
    setIsSaving(true);
    
    // Calculate overall result
    let overall = 'Tested';
    if (reviewException) overall = 'Exception';
    else {
       const contextClass = reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord.testingClassification);
       const relevantCustomQuestions = customQuestions.filter(q => 
          q.contextClass === contextClass && 
          (!q.scope || q.scope === 'classification' || (q.scope === 'sample' && q.sampleId === reviewRecord.id))
       );
       const template = [...(TESTING_TEMPLATES[contextClass] || []), ...relevantCustomQuestions];
       for (const attr of template) {
         if (reviewAnswers[attr.id]?.result === 'No') overall = 'Exception';
       }
    }
    
    const payload = {
       ...reviewRecord,
       testingStatus: overall,
       overallResult: overall,
       attributeResults: reviewAnswers,
       evidenceFields: reviewFields,
       exceptions: reviewException
    };
    
    try {
      const res = await fetch('/api/sampling/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || ''
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSaveSuccess(true);
        await fetchAssignedSamples();
        setTimeout(() => {
           setReviewRecord(null);
           setSaveSuccess(false);
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to save review", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Sub-Tab Rendering logic
  const renderGLTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Database className="w-5 h-5 text-indigo-400" /> General Ledger Transactions</h3>
        <div className="flex gap-3">
          <button 
            onClick={() => document.getElementById('gl-upload-input')?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Upload className="w-4 h-4" /> + Upload General Ledger
          </button>
          <input 
            type="file" 
            id="gl-upload-input" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            onChange={handleFileUpload}
            onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
          />
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
      <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
        <thead>
          <tr className="bg-slate-950/50 border-b border-slate-800">
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Date</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Voucher No</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Account</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Description</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right">Debit</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right">Credit</th>
            {!isDistributor && !isEvidenceManagementMode && <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] bg-slate-900">Testing Classification</th>}
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] bg-slate-900 text-center">Required Data</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {mergedRecords.length === 0 ? (
            <tr><td colSpan={isDistributor || isEvidenceManagementMode ? 7 : 8} className="py-12 text-center text-slate-400">No records found.</td></tr>
          ) : (
            mergedRecords.map((rec, i) => (
              <tr key={rec.id + i} className="hover:bg-slate-800/30 transition-colors group">
                <td className="py-2 px-4 text-slate-300">{rec.date}</td>
                <td className="py-2 px-4 font-medium text-slate-200">{rec.voucherNo}</td>
                <td className="py-2 px-4 text-slate-400 truncate max-w-[150px]" title={rec.accountDescription}>{rec.accountDescription !== '—' ? rec.accountDescription : rec.accountNumber}</td>
                <td className="py-2 px-4 text-slate-400 truncate max-w-[200px]" title={rec.description}>{rec.description}</td>
                <td className="py-2 px-4 text-emerald-400/90 font-medium text-right">{formatCurrency(rec.debit, currencyMode)}</td>
                <td className="py-2 px-4 text-rose-400/90 font-medium text-right">{formatCurrency(rec.credit, currencyMode)}</td>
                
                {!isDistributor && !isEvidenceManagementMode && (
                <td className="py-2 px-4 bg-slate-900/40 relative">

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenClassificationId(openClassificationId === rec.id ? null : rec.id);
                    }}
                    className="flex items-center justify-between w-48 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors hover:border-slate-500"
                  >
                    <span className="truncate">
                      {rec.testingClassification.length === 0 ? 'Not Selected' :
                       rec.testingClassification.length === 1 ? rec.testingClassification[0] :
                       `${rec.testingClassification.length} Selected`}
                    </span>
                    <span className="text-slate-500 ml-2">▼</span>
                  </button>
                  {openClassificationId === rec.id && (
                    <div 
                      className="absolute z-50 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden text-sm"
                      style={{ right: '0', top: '100%' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-3 border-b border-slate-700 font-bold text-slate-300 text-xs uppercase tracking-wider">
                        Testing Classification
                      </div>
                      <div className="p-3 space-y-3">
                        {['3rd Party Disbursement', 'Employee Disbursement & Reimbursement', 'Sales Testing', 'N/A'].map(opt => {
                          const isSelected = rec.testingClassification.includes(opt);
                          return (
                            <label key={opt} className="flex items-start gap-3 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => {
                                  let newClassifications = [...rec.testingClassification];
                                  if (opt === 'N/A') {
                                    newClassifications = isSelected ? [] : ['N/A'];
                                  } else {
                                    if (newClassifications.includes('N/A')) newClassifications = [];
                                    if (isSelected) {
                                      newClassifications = newClassifications.filter(c => c !== opt);
                                    } else {
                                      newClassifications.push(opt);
                                    }
                                  }
                                  handleClassify(rec, newClassifications);
                                }}
                                className="mt-0.5 shrink-0 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-900 w-4 h-4 cursor-pointer"
                              />
                              <span className={`text-xs leading-tight ${isSelected ? 'text-white font-medium' : 'text-slate-300 group-hover:text-white'}`}>{opt}</span>
                            </label>
                          )
                        })}
                      </div>
                      <div className="p-2 border-t border-slate-700 bg-slate-900/50 flex justify-between">
                         <button 
                           onClick={() => handleClassify(rec, [])}
                           className="text-xs px-2 py-1 text-slate-400 hover:text-white transition-colors"
                         >
                           Clear
                         </button>
                         <button 
                           onClick={() => setOpenClassificationId(null)}
                           className="text-xs px-3 py-1 font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                         >
                           Done
                         </button>
                      </div>
                    </div>
                  )}
                
                </td>
                )}
                <td className="py-2 px-4 bg-slate-900/40">
                  <div className="flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenQuestionnaireFor(rec);
                      }}
                      className="flex items-center justify-center gap-1.5 w-full max-w-[140px] bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded px-3 py-1.5 hover:bg-indigo-600 hover:text-white transition-colors text-xs font-semibold"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Questionnaire
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </div>
  );

  const renderTestingTab = (classification: string) => {
    const records = mergedRecords.filter(r => Array.isArray(r.testingClassification) && r.testingClassification.includes(classification));
    
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
        <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">No</th>
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Document ID</th>
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Transaction Date</th>
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">GL Description</th>
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right">Amount Local</th>
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-center">Testing Status</th>
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {records.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400">No samples assigned to this category.</td></tr>
            ) : (
              records.map((rec, i) => (
                <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="py-3 px-4 text-slate-400">{i + 1}</td>
                  <td className="py-3 px-4 font-medium text-indigo-300">{rec.testingReference}</td>
                  <td className="py-3 px-4 text-slate-300">{rec.date}</td>
                  <td className="py-3 px-4 text-slate-400 truncate max-w-[250px]" title={rec.description}>{rec.description}</td>
                  <td className="py-3 px-4 font-medium text-slate-200 text-right">{formatCurrency(rec.debit || rec.credit, currencyMode)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                      ${rec.testingStatus === 'Assigned' ? 'bg-blue-500/20 text-blue-400' : 
                        rec.testingStatus === 'Tested' ? 'bg-emerald-500/20 text-emerald-400' : 
                        'bg-rose-500/20 text-rose-400'}`}>
                      {rec.testingStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button 
                      onClick={() => openReviewModal(rec)}
                      className="text-xs font-bold bg-slate-800 hover:bg-indigo-600 text-white px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  

  const renderUploadModal = () => {
    if (!uploadModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" /> 
                {uploadState === 'success' ? 'Upload Complete' : 'Upload General Ledger'}
              </h2>
              {uploadFile && <p className="text-sm text-slate-400 mt-1 font-mono">{uploadFile.name}</p>}
            </div>
            {uploadState !== 'uploading' && (
              <button onClick={() => setUploadModalOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {uploadError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">{uploadError}</div>
              </div>
            )}

            {uploadState === 'reading' && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Reading file...</p>
              </div>
            )}

            {uploadState === 'mapping' && (
              <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4" /> Column Mapping
                  </h3>
                  <p className="text-xs text-blue-300">
                    Please confirm how the columns from your uploaded file map to the required system fields. We've auto-matched these where possible.
                  </p>
                </div>
                
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/50">
                  <div className="grid grid-cols-2 p-3 bg-slate-900/80">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">System Field</div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Uploaded Column</div>
                  </div>
                  
                  {[
                    { id: 'date', label: 'Transaction Date *' },
                    { id: 'voucherNo', label: 'Voucher No / Transaction ID *' },
                    { id: 'accountNumber', label: 'Account Number' },
                    { id: 'accountDescription', label: 'Account Description' },
                    { id: 'description', label: 'Description * (or Narration)' },
                    { id: 'narration', label: 'Narration / Remarks' },
                    { id: 'debit', label: 'Debit Amount * (or Credit)' },
                    { id: 'credit', label: 'Credit Amount * (or Debit)' },
                    { id: 'balance', label: 'Balance' }
                  ].map(field => (
                    <div key={field.id} className="grid grid-cols-2 p-3 items-center hover:bg-slate-900/30">
                      <div className="text-sm font-medium text-slate-300">{field.label}</div>
                      <div>
                        <select 
                          className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                          value={glMapping[field.id] || ''}
                          onChange={e => setGlMapping({...glMapping, [field.id]: e.target.value})}
                        >
                          <option value="">-- Not Mapped --</option>
                          {glHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadState === 'uploading' && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Importing population to database...</p>
              </div>
            )}

            {uploadState === 'success' && (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">General Ledger Uploaded Successfully</h3>
                <p className="text-slate-400 mb-6">
                  Successfully imported <strong className="text-white">{uploadSuccessMessage.records.toLocaleString()}</strong> records.
                </p>
                <div className="inline-block bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 font-mono">
                  {uploadSuccessMessage.filename}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div></div>
            <div className="flex gap-3">
              {(uploadState === 'mapping' || uploadState === 'error') && (
                <>
                  <button 
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmUpload}
                    className="px-6 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Import GL
                  </button>
                </>
              )}
              {uploadState === 'success' && (
                <button 
                  onClick={() => setUploadModalOpen(false)}
                  className="px-6 py-2 text-sm font-bold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  Close & View Data
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };


  const renderReviewModal = () => {
    if (!reviewRecord) return null;
    const contextClass = reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord.testingClassification);
    const relevantCustomQuestions = customQuestions.filter(q => 
       q.contextClass === contextClass && 
       (!q.scope || q.scope === 'classification' || (q.scope === 'sample' && q.sampleId === reviewRecord.id))
    );
    const template = [...(TESTING_TEMPLATES[contextClass] || []), ...relevantCustomQuestions];
    const evidenceFields = EVIDENCE_FIELDS[contextClass] || [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
            <div className="flex-1 pr-8">
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                  {reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification.join(', ') : reviewRecord.testingClassification)}
                </span>
                <span className="font-mono text-sm text-slate-400">{reviewRecord.testingReference}</span>
              </div>
              <div className="flex items-center justify-between w-full">
                <h2 className="text-xl font-bold text-white">Sample Testing & Attributes</h2>
                <button 
                  onClick={() => setShowQuestionBuilder(true)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>
            </div>
            <button onClick={() => setReviewRecord(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* GL Context */}
            <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> Source GL Information
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Date</div><div className="text-sm text-slate-200">{reviewRecord.date}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Voucher No</div><div className="text-sm text-slate-200">{reviewRecord.voucherNo}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Account</div><div className="text-sm text-slate-200">{reviewRecord.accountDescription !== '—' ? reviewRecord.accountDescription : reviewRecord.accountNumber}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Amount Local</div><div className="text-sm font-medium text-emerald-400">{formatCurrency(reviewRecord.debit || reviewRecord.credit, currencyMode)}</div></div>
                <div className="col-span-4"><div className="text-[10px] text-slate-500 uppercase tracking-wider">Description / Narration</div><div className="text-sm text-slate-300">{reviewRecord.description} {reviewRecord.narration !== '—' ? `- ${reviewRecord.narration}` : ''}</div></div>
              </div>
            </div>

            {/* Evidence & Supporting Documents */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Transaction Evidence & Support
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {evidenceFields.map(f => (
                  <div key={f.id} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">{f.label}</label>
                    {f.type === 'select' ? (
                      <select 
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        value={reviewFields[f.id] || ''}
                        onChange={e => setReviewFields({...reviewFields, [f.id]: e.target.value})}
                      >
                        <option value="">Select...</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="N/A">N/A</option>
                      </select>
                    ) : (
                      <input 
                        type="text"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        value={reviewFields[f.id] || ''}
                        onChange={e => setReviewFields({...reviewFields, [f.id]: e.target.value})}
                        placeholder={f.label}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Attributes Testing */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" /> Attribute Testing
              </h3>
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/50">
                {template.map((attr: any) => {
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
                          {attr.attributeCode || attr.id}
                        </div>
                        <div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {attr.text}
                            {attr.required && <span className="text-rose-500 ml-1">*</span>}
                          </p>
                          {attr.type && <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 block">{attr.type}</span>}
                          {attr.id.startsWith('CQ') && (
                            <div className="flex gap-2 mt-2">
                               <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 uppercase tracking-wider">
                                 Edit
                               </button>
                               <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 uppercase tracking-wider">
                                 Duplicate
                               </button>
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
                          )}
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
                              className={`flex-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors
                                ${reviewAnswers[attr.id]?.result === opt 
                                  ? (opt === 'No' || opt === 'See Comments' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400')
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
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
                })}
              </div>
            </div>

            {/* Exceptions */}
            <div>
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Exceptions & Overall Comments
              </h3>
              <textarea 
                className="w-full h-24 bg-slate-950 border border-rose-900/50 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-600"
                placeholder="Document any exceptions, control failures, or additional findings here..."
                value={reviewException}
                onChange={e => setReviewException(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {saveSuccess ? (
                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved successfully</span>
              ) : null}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setReviewRecord(null)}
                className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveReview}
                disabled={isSaving}
                className="px-6 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Test Results</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0B0F19]">
      <div className="p-8 pb-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Sampling & Testing</h1>
            <p className="text-slate-400 mt-2">General Ledger Analysis & Transaction Testing</p>
          </div>
        </div>

        {/* Population Selector (only show if none selected or multiple available) */}
        <div className="mb-8 flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">Active Population (GL File)</label>
            {loading ? (
               <div className="text-sm text-slate-300">Loading populations...</div>
            ) : availablePopulations.length > 0 ? (
               <select 
                 className="bg-transparent border-none text-sm font-bold text-white focus:outline-none focus:ring-0 cursor-pointer p-0 appearance-none"
                 value={selectedPopulation?.id || ''}
                 onChange={(e) => {
                   const pop = availablePopulations.find(p => p.id === e.target.value);
                   if (pop) handleSelectPopulation(pop);
                 }}
               >
                 {availablePopulations.map(p => (
                   <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.fileName}</option>
                 ))}
               </select>
            ) : (
               <div className="text-sm text-rose-400">No active GL population found. Please complete Step 1 (Upload GL).</div>
            )}
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search references, description..."
              className="w-64 bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Sub-Tabs */}
        {(!isDistributor && !isEvidenceManagementMode) && (
        <div className="flex gap-2 border-b border-slate-800">
          {[
            { id: 'GL', label: 'General Ledger - Sample' },
            ...(!isDistributor && !isEvidenceManagementMode ? [
              { id: '3PD', label: '3rd Party Disbursement' },
              { id: 'EMP', label: 'Employee Disbursement & Reimbursement' },
              { id: 'SALES', label: 'Sales Testing' }
            ] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2
                ${activeTab === tab.id 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'}`}
            >
              {tab.label}
              {tab.id !== 'GL' && (
                <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full ml-1">
                  {tab.id === '3PD' ? mergedRecords.filter(s => s.testingClassification.includes('3rd Party Disbursement')).length :
                   tab.id === 'EMP' ? mergedRecords.filter(s => s.testingClassification.includes('Employee Disbursement & Reimbursement')).length :
                   mergedRecords.filter(s => s.testingClassification.includes('Sales Testing')).length}
                </span>
              )}
            </button>
          ))}
        </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-4">
        {activeTab === 'GL' && renderGLTab()}
        {!isDistributor && !isEvidenceManagementMode && activeTab === '3PD' && renderTestingTab('3rd Party Disbursement')}
        {!isDistributor && !isEvidenceManagementMode && activeTab === 'EMP' && renderTestingTab('Employee Disbursement & Reimbursement')}
        {!isDistributor && !isEvidenceManagementMode && activeTab === 'SALES' && renderTestingTab('Sales Testing')}
      </div>

      {!isDistributor && !isEvidenceManagementMode && renderReviewModal()}
      {renderUploadModal()}
      {renderQuestionBuilderModal()}
      
      {openQuestionnaireFor && (
        <RequiredDataQuestionnaire 
          transaction={openQuestionnaireFor}
          engagementId={selectedAuditFilter || 'eng-101'}
          currentUser={currentUser}
          onClose={() => setOpenQuestionnaireFor(null)}
        />
      )}
    </div>
  );
};
