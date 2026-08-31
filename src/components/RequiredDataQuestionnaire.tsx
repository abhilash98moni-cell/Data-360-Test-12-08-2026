import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Trash2, Edit2, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../types';

interface QuestionnaireProps {
  transaction: any;
  engagementId: string | undefined;
  currentUser: UserSession | null;
  onClose: () => void;
  isReviewMode?: boolean;
}

export const RequiredDataQuestionnaire: React.FC<QuestionnaireProps> = ({
  transaction,
  engagementId,
  currentUser,
  onClose,
  isReviewMode = false
}) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('Draft');
  const [loading, setLoading] = useState(true);

  // Add Question Modal State
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const isDistributor = currentUser?.role?.includes('Distributor');
  const [questionForm, setQuestionForm] = useState({
    text: '',
    type: 'Yes / No',
    required: false,
    allowComment: false,
    allowFileUpload: false,
    helpText: '',
    scope: 'transaction'
  });

  const classification = transaction.testingClassification?.[0] || 'General';

  useEffect(() => {
    fetchQuestionsAndResponses();
  }, [transaction.id]);

  const fetchQuestionsAndResponses = async () => {
    try {
      setLoading(true);
      // Fetch Questions
      const qRes = await fetch(`/api/sampling/required-data/questions?auditId=${engagementId}`, {
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      const qData = await qRes.json();
      
      // Fetch Responses
      const rRes = await fetch(`/api/sampling/required-data/responses?sampleId=${transaction.id}`, {
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      const rData = await rRes.json();
      
      if (qData.success) {
        // Filter questions applicable to this transaction
        // Applies if scope is 'all', or 'classification' and matches classification, or 'transaction' and matches sample_id
        const applicableQuestions = qData.questions.filter((q: any) => {
          if (q.scope === 'all') return true;
          if (q.scope === 'classification' && q.testing_classification === classification) return true;
          if (q.scope === 'transaction' && q.sample_id === transaction.id) return true;
          return false;
        });
        setQuestions(applicableQuestions);
      }
      
      if (rData.success && rData.responses && rData.responses.length > 0) {
        const respRecord = rData.responses[0];
        setStatus(respRecord.status || 'Draft');
        setResponses(respRecord.responses?.answers || {});
        setComments(respRecord.responses?.comments || {});
        setDocuments(respRecord.responses?.documents || {});
      } else {
        setStatus('Draft');
        setResponses({});
        setComments({});
        setDocuments({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.text.trim()) return alert("Question text is required");
    
    try {
      const payload = {
        engagement_id: engagementId,
        testing_classification: classification,
        question_text: questionForm.text,
        answer_type: questionForm.type,
        required: questionForm.required,
        help_text: questionForm.helpText,
        scope: questionForm.scope,
        sample_id: questionForm.scope === 'transaction' ? transaction.id : null,
        allow_comment: questionForm.allowComment,
        allow_file_upload: questionForm.allowFileUpload
      };

      let url = '/api/sampling/required-data/questions';
      let method = 'POST';

      if (editingQuestionId) {
        url = `/api/sampling/required-data/questions/${editingQuestionId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddQuestion(false);
        setEditingQuestionId(null);
        fetchQuestionsAndResponses();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save question");
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this question?")) return;
    try {
      const res = await fetch(`/api/sampling/required-data/questions/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      if (res.ok) fetchQuestionsAndResponses();
    } catch (err) {
      console.error(err);
    }
  };

  const saveResponses = async (finalStatus: string) => {
    if (finalStatus === 'Completed' || finalStatus === 'Submitted') {
      // Validate required
      const missing = questions.filter(q => q.required && !responses[q.dbId]);
      if (missing.length > 0) {
        return alert(`Please answer the required question: "${missing[0].question_text}"`);
      }
    }

    try {
      const payload = {
        engagement_id: engagementId,
        sample_id: transaction.id,
        status: finalStatus,
        responses: {
          answers: responses,
          comments: comments,
          documents: documents
        }
      };
      const res = await fetch('/api/sampling/required-data/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setStatus(finalStatus);
        if (finalStatus === 'Completed' || finalStatus === 'Submitted') {
          onClose();
        } else {
          alert('Draft saved successfully');
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save responses");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900 rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-400" />
              Required Data Questionnaire
            </h2>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div className="flex flex-col">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Sample ID</span>
                <span className="font-mono text-slate-200">{transaction.id}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Voucher No</span>
                <span className="font-mono text-slate-200">{transaction.voucherNo}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Date</span>
                <span className="text-slate-200">{transaction.date}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Description</span>
                <span className="text-slate-200">{transaction.description}</span>
              </div>
              
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#0B0F19] space-y-8 relative">
          
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Questionnaire
              {status === 'Completed' && <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">Completed</span>}
              {status === 'Draft' && <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">Draft / In Progress</span>}
            </h3>
            {(!isDistributor && !isReviewMode) && (<button 
              onClick={() => {
                setEditingQuestionId(null);
                setQuestionForm({ text: '', type: 'Yes / No', required: false, allowComment: false, allowFileUpload: false, helpText: '', scope: 'transaction' });
                setShowAddQuestion(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors text-xs font-bold"
            >
              <Plus className="h-4 w-4" />
              Add Question</button>)}
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
              <p className="text-slate-400 mb-4">No questions defined for this transaction yet.</p>
              {(!isDistributor && !isReviewMode) && (<button 
                onClick={() => setShowAddQuestion(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-semibold text-sm inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add First Question
              </button>)}
            </div>
          ) : (
<div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
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
                              <input type="radio" disabled={!isDistributor || isReviewMode} name={`q_${q.dbId}`} value={opt} checked={responses[q.dbId] === opt} onChange={(e) => setResponses({...responses, [q.dbId]: e.target.value})} className="text-indigo-500 bg-slate-950 border-slate-700" />
                              <span className="text-sm text-slate-300">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {(q.answer_type === 'Yes / No / N/A') && (
                        <div className="flex gap-4">
                          {['Yes', 'No', 'N/A'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" disabled={!isDistributor || isReviewMode} name={`q_${q.dbId}`} value={opt} checked={responses[q.dbId] === opt} onChange={(e) => setResponses({...responses, [q.dbId]: e.target.value})} className="text-indigo-500 bg-slate-950 border-slate-700" />
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
        </div>

        {/* Footer */}
        {!isReviewMode && (
    <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-2xl shrink-0 flex justify-end gap-3">
      <button 
        onClick={() => onClose()}
        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-colors"
      >
        Cancel
      </button>
      <button 
        onClick={() => saveResponses('Submitted')}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg"
      >
        Save & Next
      </button>
    </div>
  )}
        
        {/* Add Question Overlay */}
        {showAddQuestion && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm rounded-2xl">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">
                {editingQuestionId ? 'Edit Question' : 'Add Question'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question *</label>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                    value={questionForm.text}
                    onChange={(e) => setQuestionForm({...questionForm, text: e.target.value})}
                    placeholder="Enter question text..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Answer Type</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                      value={questionForm.type}
                      onChange={(e) => setQuestionForm({...questionForm, type: e.target.value})}
                    >
                      {['Yes / No', 'Text', 'Number', 'Date', 'Dropdown', 'Checkbox', 'File Upload', 'Comment'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Required?</label>
                    <div className="flex items-center h-10 px-3 bg-slate-950 border border-slate-700 rounded-lg cursor-pointer" onClick={() => setQuestionForm({...questionForm, required: !questionForm.required})}>
                      <input 
                        type="checkbox" 
                        checked={questionForm.required} 
                        onChange={() => {}}
                        className="w-4 h-4 bg-slate-900 border-slate-700 text-indigo-500 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-slate-300 font-medium">This question is required</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Allow Comment?</label>
                    <div className="flex items-center h-10 px-3 bg-slate-950 border border-slate-700 rounded-lg cursor-pointer" onClick={() => setQuestionForm({...questionForm, allowComment: !questionForm.allowComment})}>
                      <input 
                        type="checkbox" 
                        checked={questionForm.allowComment} 
                        onChange={() => {}}
                        className="w-4 h-4 bg-slate-900 border-slate-700 text-indigo-500 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-slate-300 font-medium">ON</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Allow File Upload?</label>
                    <div className="flex items-center h-10 px-3 bg-slate-950 border border-slate-700 rounded-lg cursor-pointer" onClick={() => setQuestionForm({...questionForm, allowFileUpload: !questionForm.allowFileUpload})}>
                      <input 
                        type="checkbox" 
                        checked={questionForm.allowFileUpload} 
                        onChange={() => {}}
                        className="w-4 h-4 bg-slate-900 border-slate-700 text-indigo-500 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-slate-300 font-medium">ON</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Apply Question To:</label>
                  <div className="space-y-2 bg-slate-950 border border-slate-700 rounded-lg p-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="scope" value="transaction" checked={questionForm.scope === 'transaction'} onChange={() => setQuestionForm({...questionForm, scope: 'transaction'})} className="text-indigo-500 bg-slate-900 border-slate-700" />
                      <span className="text-sm text-slate-300">This Sample Only</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="scope" value="classification" checked={questionForm.scope === 'classification'} onChange={() => setQuestionForm({...questionForm, scope: 'classification'})} className="text-indigo-500 bg-slate-900 border-slate-700" />
                      <span className="text-sm text-slate-300">All Samples in this Testing Classification</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="scope" value="all" checked={questionForm.scope === 'all'} onChange={() => setQuestionForm({...questionForm, scope: 'all'})} className="text-indigo-500 bg-slate-900 border-slate-700" />
                      <span className="text-sm text-slate-300">All Samples in this Engagement</span>
                    </label>
                  </div>
                </div>

              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setShowAddQuestion(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveQuestion}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-bold text-sm shadow-lg"
                >
                  Save Question
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
