import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Save, 
  Trash2, 
  Edit2, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  Eye, 
  RefreshCw, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  File, 
  HelpCircle,
  ArrowRight,
  Send,
  Building2,
  Calendar,
  Receipt,
  DollarSign
} from 'lucide-react';
import { UserSession } from '../types';

export interface UploadedDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  googleDriveFileId?: string;
  url?: string;
}

interface QuestionnaireProps {
  transaction: any;
  engagementId: string | undefined;
  currentUser: UserSession | null;
  onClose: () => void;
  isReviewMode?: boolean;
  isDistributorWorkflow?: boolean;
}

export const RequiredDataQuestionnaire: React.FC<QuestionnaireProps> = ({
  transaction,
  engagementId,
  currentUser,
  onClose,
  isReviewMode = false,
  isDistributorWorkflow = false
}) => {
  const isDistributor = isDistributorWorkflow || currentUser?.role?.includes('Distributor') || currentUser?.role === 'Distributor';
  
  // Core Required Data States
  const [notes, setNotes] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([]);
  const [status, setStatus] = useState<string>('Draft');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // File Inputs Refs
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetIndexRef = useRef<number | null>(null);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);

  // Optional Auditor Questions
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState({
    text: '',
    type: 'Yes / No',
    required: false,
    allowComment: false,
    allowFileUpload: false,
    helpText: '',
    scope: 'transaction'
  });

  const classification = transaction?.testingClassification?.[0] || 'General';
  const targetSampleId = transaction?.id || transaction?.sampleId || transaction?.voucherNo || 'TX-1';
  const targetVoucherNo = transaction?.voucherNo || transaction?.id || '';

  useEffect(() => {
    fetchQuestionsAndResponses();
  }, [transaction?.id, transaction?.voucherNo]);

  const fetchQuestionsAndResponses = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Questions for this engagement
      const qRes = await fetch(`/api/sampling/required-data/questions?auditId=${encodeURIComponent(engagementId || '')}`, {
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      const qData = await qRes.json();
      
      if (qData.success && Array.isArray(qData.questions)) {
        const applicable = qData.questions.filter((q: any) => {
          if (q.scope === 'all') return true;
          if (q.scope === 'classification' && q.testing_classification === classification) return true;
          if (q.scope === 'transaction' && (q.sample_id === targetSampleId || q.sample_id === targetVoucherNo)) return true;
          return false;
        });
        setQuestions(applicable);
      }

      // 2. Fetch Existing Response & Files for this transaction
      const rRes = await fetch(`/api/sampling/required-data/responses?sampleId=${encodeURIComponent(targetSampleId)}`, {
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      const rData = await rRes.json();

      if (rData.success && Array.isArray(rData.responses) && rData.responses.length > 0) {
        const respRecord = rData.responses[0];
        setStatus(respRecord.status || 'Draft');
        
        // Notes / explanations
        const existingNotes = respRecord.notes || 
                              respRecord.responses?.notes || 
                              respRecord.responses?.comments?.general || 
                              '';
        setNotes(existingNotes);

        // Uploaded files list
        const existingFiles: UploadedDocument[] = 
          respRecord.uploadedFiles || 
          respRecord.responses?.uploadedFiles || 
          [];

        // Also check if legacy single documents existed per question
        const legacyDocs = respRecord.responses?.documents || {};
        const legacyFileEntries: UploadedDocument[] = Object.keys(legacyDocs).map((qId, idx) => ({
          id: `legacy-${idx}-${Date.now()}`,
          name: legacyDocs[qId],
          size: '1.0 MB',
          type: 'application/octet-stream',
          uploadDate: respRecord.updated_at || new Date().toISOString()
        }));

        if (existingFiles.length === 0 && legacyFileEntries.length > 0) {
          setUploadedFiles(legacyFileEntries);
        } else {
          setUploadedFiles(existingFiles);
        }

        setResponses(respRecord.responses?.answers || {});
        setComments(respRecord.responses?.comments || {});
      } else {
        setStatus('Draft');
        setNotes('');
        setUploadedFiles([]);
        setResponses({});
        setComments({});
      }
    } catch (err) {
      console.error('Error loading questionnaire data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, mimeType?: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || mimeType?.includes('pdf')) {
      return <FileText className="h-5 w-5 text-rose-400 shrink-0" />;
    }
    if (['doc', 'docx', 'rtf'].includes(ext) || mimeType?.includes('word')) {
      return <FileText className="h-5 w-5 text-blue-400 shrink-0" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType?.includes('sheet') || mimeType?.includes('csv')) {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-400 shrink-0" />;
    }
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || mimeType?.includes('image')) {
      return <ImageIcon className="h-5 w-5 text-purple-400 shrink-0" />;
    }
    return <File className="h-5 w-5 text-amber-400 shrink-0" />;
  };

  // Upload handler for multiple files or replacement
  const handleUploadFiles = async (files: FileList | File[], replaceIndex?: number) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileArray = Array.from(files);
    const newlyUploaded: UploadedDocument[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadProgressText(`Uploading ${file.name} (${i + 1}/${fileArray.length})...`);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', 'EVIDENCE');
        formData.append('documentUsage', 'REQUIRED_DATA');
        formData.append('requirementId', targetVoucherNo || targetSampleId);
        formData.append('clientName', 'XYZ');
        formData.append('distributorName', currentUser?.organization || 'Distributor');
        formData.append('auditName', engagementId || 'XYZ Distributor Audit 2026');

        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'x-user-email': currentUser?.email || '' },
          body: formData
        });

        const data = await res.json();
        if (res.ok && data.success) {
          const docId = data.file?.googleDriveFileId || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const docRecord: UploadedDocument = {
            id: docId,
            name: data.file?.fileName || file.name,
            size: data.file?.fileSizeMB ? `${data.file.fileSizeMB} MB` : formatFileSize(file.size),
            type: file.type || 'application/octet-stream',
            googleDriveFileId: data.file?.googleDriveFileId,
            uploadDate: new Date().toISOString(),
            url: `/api/storage/download/${data.file?.googleDriveFileId || docId}?fileName=${encodeURIComponent(data.file?.fileName || file.name)}`
          };
          newlyUploaded.push(docRecord);
        } else {
          // Fallback offline mock entry if storage unavailable in demo
          const fallbackDoc: UploadedDocument = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type || 'application/octet-stream',
            uploadDate: new Date().toISOString()
          };
          newlyUploaded.push(fallbackDoc);
        }
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
        const fallbackDoc: UploadedDocument = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type || 'application/octet-stream',
          uploadDate: new Date().toISOString()
        };
        newlyUploaded.push(fallbackDoc);
      }
    }

    if (replaceIndex !== undefined && replaceIndex >= 0 && newlyUploaded.length > 0) {
      // Replace existing file at index
      setUploadedFiles(prev => {
        const updated = [...prev];
        updated[replaceIndex] = newlyUploaded[0];
        return updated;
      });
    } else {
      // Append new files
      setUploadedFiles(prev => [...prev, ...newlyUploaded]);
    }

    setIsUploading(false);
    setUploadProgressText('');
  };

  // Trigger file replacement for a specific file index
  const triggerReplace = (index: number) => {
    replaceTargetIndexRef.current = index;
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = '';
      replaceFileInputRef.current.click();
    }
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // View / Open File
  const handleViewFile = (file: UploadedDocument) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || file.type.includes('image');
    
    if (isImg) {
      setPreviewDoc(file);
    } else {
      const downloadUrl = file.url || `/api/storage/download/${file.googleDriveFileId || file.id}?fileName=${encodeURIComponent(file.name)}`;
      window.open(downloadUrl, '_blank');
    }
  };

  // Download File
  const handleDownloadFile = (file: UploadedDocument) => {
    const downloadUrl = file.url || `/api/storage/download/${file.googleDriveFileId || file.id}?fileName=${encodeURIComponent(file.name)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Save / Submit required data
  const handleSave = async (targetStatus: 'Draft' | 'Submitted') => {
    try {
      setSaving(true);
      setSaveSuccessMsg(null);

      if (targetStatus === 'Submitted') {
        // Optional validation: check if required questions are filled (Auditor only)
        if (!isDistributor) {
          const missing = questions.filter(q => q.required && !responses[q.dbId]);
          if (missing.length > 0) {
            alert(`Please answer the required question: "${missing[0].question_text}"`);
            setSaving(false);
            return;
          }
        }
      }

      const payload = {
        engagement_id: engagementId || 'eng-101',
        sample_id: targetSampleId,
        voucher_no: targetVoucherNo,
        voucherNo: targetVoucherNo,
        status: targetStatus,
        notes: notes,
        uploadedFiles: uploadedFiles,
        responses: {
          notes: notes,
          uploadedFiles: uploadedFiles,
          answers: responses,
          comments: comments
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
        setStatus(targetStatus);
        setSaveSuccessMsg(targetStatus === 'Submitted' ? 'Required data submitted successfully!' : 'Draft saved successfully!');
        
        if (targetStatus === 'Submitted') {
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setTimeout(() => {
            setSaveSuccessMsg(null);
          }, 3500);
        }
      } else {
        alert('Failed to save data. Please try again.');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  // Auditor question handlers
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
        sample_id: questionForm.scope === 'transaction' ? targetSampleId : null,
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col relative overflow-hidden my-auto">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm flex justify-between items-start shrink-0">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    Required Data Submission
                  </h2>
                  {status === 'Submitted' || status === 'Completed' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950/40">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Submitted
                    </span>
                  ) : status === 'Draft' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Clock className="h-3.5 w-3.5" />
                      Draft
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Pending Submission
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Provide supporting documents, invoice records, and explanatory notes for this specific audit transaction.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Transaction Metadata Banner */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-6 py-3 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Transaction / ID</span>
              <span className="text-indigo-300 font-semibold">{targetSampleId}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Voucher No</span>
              <span className="text-slate-200 font-semibold">{transaction?.voucherNo || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Date</span>
              <span className="text-slate-300">{transaction?.date || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Account</span>
              <span className="text-slate-300 truncate block" title={transaction?.accountName || transaction?.accountCode}>
                {transaction?.accountName || transaction?.accountCode || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Debit / Credit</span>
              <span className="text-slate-200">
                {transaction?.debit ? `Dr: $${Number(transaction.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 
                 transaction?.credit ? `Cr: $${Number(transaction.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Description</span>
              <span className="text-slate-400 truncate block" title={transaction?.description}>
                {transaction?.description || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-900/40">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
              <p className="text-sm font-medium">Loading transaction questionnaire and responses...</p>
            </div>
          ) : (
            <>
              {/* SECTION 1: Additional Notes, Explanations & Comments */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit2 className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Additional Notes, Explanations & Comments
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Provide context, business purpose, or clarifications
                  </span>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isReviewMode}
                  placeholder="Enter supporting details, transaction explanations, justification, invoice reference numbers, approvals, or any relevant comments for the audit team..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-y min-h-[100px]"
                />
                
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Formatting: Free text. All explanations are saved with this transaction record.</span>
                  <span>{notes.length} characters</span>
                </div>
              </div>

              {/* SECTION 2: Supporting Documents & Files Upload */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Supporting Documents & Evidence Files
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700">
                      {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 hidden sm:block">
                    PDF, Word, Excel, CSV, Images (JPG/PNG), TXT, ZIP
                  </div>
                </div>

                {/* Upload Drag & Drop Zone */}
                {!isReviewMode && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files) {
                        handleUploadFiles(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => multiFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      isDragging 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-950/40 hover:bg-slate-950/80'
                    }`}
                  >
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                      <Upload className="h-6 w-6" />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-200">
                        Click to browse or drag and drop supporting files
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Invoices, delivery challans, purchase orders, approval emails, bank vouchers, or calculation sheets
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">PDF</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">Word (DOC/DOCX)</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">Excel / CSV</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">Images (JPG/PNG)</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">Max 50MB</span>
                    </div>

                    {isUploading && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/40 rounded-lg text-indigo-300 text-xs font-semibold animate-pulse">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>{uploadProgressText || 'Uploading documents...'}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Hidden File Inputs */}
                <input
                  ref={multiFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp,.txt,.zip,.rtf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleUploadFiles(e.target.files);
                    }
                  }}
                />

                <input
                  ref={replaceFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp,.txt,.zip,.rtf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0] && replaceTargetIndexRef.current !== null) {
                      handleUploadFiles([e.target.files[0]], replaceTargetIndexRef.current);
                      replaceTargetIndexRef.current = null;
                    }
                  }}
                />

                {/* Uploaded Documents List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                    <span>Attached Documents ({uploadedFiles.length})</span>
                    {!isReviewMode && uploadedFiles.length > 0 && (
                      <button
                        onClick={() => multiFileInputRef.current?.click()}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add More Files
                      </button>
                    )}
                  </div>

                  {uploadedFiles.length === 0 ? (
                    <div className="py-6 px-4 border border-slate-800/80 rounded-xl bg-slate-950/20 text-center text-xs text-slate-500">
                      No supporting documents attached yet. Click or drop files above to attach evidence for this transaction.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                      {uploadedFiles.map((doc, idx) => (
                        <div key={doc.id || idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                              {getFileIcon(doc.name, doc.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-200 truncate" title={doc.name}>
                                {doc.name}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                                <span>{doc.size || '1.0 MB'}</span>
                                <span>•</span>
                                <span>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'Ready'}</span>
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                  <CheckCircle2 className="h-3 w-3" /> Attached
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: View, Download, Replace, Remove */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleViewFile(doc)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                              title="View / Preview Document"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-400" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadFile(doc)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                              title="Download Document"
                            >
                              <Download className="h-3.5 w-3.5 text-slate-400" />
                              <span>Download</span>
                            </button>

                            {!isReviewMode && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => triggerReplace(idx)}
                                  className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/40 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                                  title="Replace with another file"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  <span>Replace</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeFile(idx)}
                                  className="p-1.5 bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                                  title="Remove this document"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: Auditor Defined Questions (Only shown in Auditor mode; hidden in Distributor workflow) */}
              {!isDistributor && questions.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        Audit Questionnaire & Compliance Verification
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-bold text-indigo-300 border border-slate-700">
                        {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                      </span>
                    </div>

                    {!isDistributor && !isReviewMode && (
                      <button 
                        onClick={() => {
                          setEditingQuestionId(null);
                          setQuestionForm({ text: '', type: 'Yes / No', required: false, allowComment: false, allowFileUpload: false, helpText: '', scope: 'transaction' });
                          setShowAddQuestion(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors text-xs font-bold cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Question
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {questions.map((q, idx) => (
                      <div key={q.dbId || idx} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="font-bold text-indigo-400 text-xs mt-0.5">{idx + 1}.</span>
                            <div>
                              <p className="font-semibold text-slate-200 text-sm">
                                {q.question_text}
                                {q.required && <span className="text-rose-500 ml-1" title="Required">*</span>}
                              </p>
                              {q.help_text && <p className="text-xs text-slate-500 mt-1">{q.help_text}</p>}
                            </div>
                          </div>

                          {!isDistributor && !isReviewMode && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingQuestionId(q.dbId);
                                  setQuestionForm({
                                    text: q.question_text,
                                    type: q.answer_type || 'Yes / No',
                                    required: q.required,
                                    helpText: q.help_text || '',
                                    scope: q.scope || 'transaction',
                                    allowComment: q.allow_comment || false,
                                    allowFileUpload: q.allow_file_upload || false
                                  });
                                  setShowAddQuestion(true);
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                                title="Edit Question"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.dbId)}
                                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                                title="Remove Question"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Answer Input */}
                        <div className="pt-1">
                          {q.answer_type === 'Yes / No' && (
                            <div className="flex items-center gap-6">
                              {['Yes', 'No'].map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                                  <input 
                                    type="radio" 
                                    name={`q_${q.dbId}`} 
                                    value={opt} 
                                    disabled={isReviewMode}
                                    checked={responses[q.dbId] === opt} 
                                    onChange={(e) => setResponses({...responses, [q.dbId]: e.target.value})}
                                    className="text-indigo-500 focus:ring-indigo-500 h-4 w-4 bg-slate-950 border-slate-700" 
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {q.answer_type === 'Yes / No / N/A' && (
                            <div className="flex items-center gap-6">
                              {['Yes', 'No', 'N/A'].map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                                  <input 
                                    type="radio" 
                                    name={`q_${q.dbId}`} 
                                    value={opt} 
                                    disabled={isReviewMode}
                                    checked={responses[q.dbId] === opt} 
                                    onChange={(e) => setResponses({...responses, [q.dbId]: e.target.value})}
                                    className="text-indigo-500 focus:ring-indigo-500 h-4 w-4 bg-slate-950 border-slate-700" 
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {(q.answer_type === 'Text' || !q.answer_type) && (
                            <input
                              type="text"
                              disabled={isReviewMode}
                              placeholder="Enter answer..."
                              value={responses[q.dbId] || ''}
                              onChange={(e) => setResponses({...responses, [q.dbId]: e.target.value})}
                              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                          )}

                          {q.answer_type === 'Number' && (
                            <input
                              type="number"
                              disabled={isReviewMode}
                              placeholder="Enter numeric value..."
                              value={responses[q.dbId] || ''}
                              onChange={(e) => setResponses({...responses, [q.dbId]: e.target.value})}
                              className="w-full sm:w-64 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                          )}

                          {q.answer_type === 'Date' && (
                            <input
                              type="date"
                              disabled={isReviewMode}
                              value={responses[q.dbId] || ''}
                              onChange={(e) => setResponses({...responses, [q.dbId]: e.target.value})}
                              className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          )}

                          {q.answer_type === 'Checkbox' && (
                            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-300">
                              <input 
                                type="checkbox"
                                disabled={isReviewMode}
                                checked={responses[q.dbId] === 'true'}
                                onChange={(e) => setResponses({...responses, [q.dbId]: e.target.checked ? 'true' : 'false'})}
                                className="w-4 h-4 rounded text-indigo-500 bg-slate-950 border-slate-700 focus:ring-indigo-500"
                              />
                              <span>Confirmed / Verified</span>
                            </label>
                          )}

                          {/* Specific Question Comment */}
                          {q.allow_comment && (
                            <div className="mt-2">
                              <input
                                type="text"
                                disabled={isReviewMode}
                                placeholder="Add specific clarification for this item..."
                                value={comments[q.dbId] || ''}
                                onChange={(e) => setComments({...comments, [q.dbId]: e.target.value})}
                                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900 rounded-b-2xl shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 order-2 sm:order-1">
            {saveSuccessMsg ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="h-4 w-4" />
                {saveSuccessMsg}
              </span>
            ) : (
              <span>
                Status: <strong className="text-slate-200">{status}</strong>
                {uploadedFiles.length > 0 && ` • ${uploadedFiles.length} supporting files attached`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {!isReviewMode && (
              <>
                <button
                  type="button"
                  disabled={saving || isUploading}
                  onClick={() => handleSave('Draft')}
                  className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Draft'}</span>
                </button>

                <button
                  type="button"
                  disabled={saving || isUploading}
                  onClick={() => handleSave('Submitted')}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{saving ? 'Submitting...' : 'Submit Required Data'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inline Image Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-5 space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-purple-400" />
                  <span className="font-bold text-white text-sm truncate max-w-md">{previewDoc.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFile(previewDoc)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto flex items-center justify-center bg-black/50 rounded-xl p-4 min-h-[300px]">
                <img
                  src={previewDoc.url || `/api/storage/download/${previewDoc.googleDriveFileId || previewDoc.id}?fileName=${encodeURIComponent(previewDoc.name)}`}
                  alt={previewDoc.name}
                  className="max-h-[65vh] max-w-full object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Auditor Add Question Modal */}
        {showAddQuestion && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">
                {editingQuestionId ? 'Edit Audit Question' : 'Add Audit Question'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question Text *</label>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                    value={questionForm.text}
                    onChange={(e) => setQuestionForm({...questionForm, text: e.target.value})}
                    placeholder="e.g. Confirm availability of stamped invoice and delivery receipt..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Answer Type</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                      value={questionForm.type}
                      onChange={(e) => setQuestionForm({...questionForm, type: e.target.value})}
                    >
                      {['Yes / No', 'Yes / No / N/A', 'Text', 'Number', 'Date', 'Checkbox'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Required?</label>
                    <div 
                      className="flex items-center h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl cursor-pointer" 
                      onClick={() => setQuestionForm({...questionForm, required: !questionForm.required})}
                    >
                      <input 
                        type="checkbox" 
                        checked={questionForm.required} 
                        onChange={() => {}}
                        className="w-4 h-4 bg-slate-900 border-slate-700 text-indigo-500 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-xs text-slate-300 font-medium">Answer is required</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input 
                      type="checkbox"
                      checked={questionForm.allowComment}
                      onChange={(e) => setQuestionForm({...questionForm, allowComment: e.target.checked})}
                      className="w-4 h-4 rounded text-indigo-500 bg-slate-950 border-slate-700"
                    />
                    <span>Allow Distributor Comment</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button 
                  onClick={() => setShowAddQuestion(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveQuestion}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg"
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
