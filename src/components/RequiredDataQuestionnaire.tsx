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
  Send,
  Building2,
  Calendar,
  Receipt,
  DollarSign,
  AlertTriangle,
  History,
  Check,
  XCircle,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  KeyRound
} from 'lucide-react';
import { UserSession } from '../types';
import { CurrencyMode, formatFinancialAmount } from '../utils/currencyFormatter';
import { DocumentViewerModal } from './DocumentViewerModal';
import { EditAccessRequestModal } from './EditAccessRequestModal';

export interface UploadedDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  googleDriveFileId?: string;
  url?: string;
  dataUrl?: string;
}

export interface ItemResponseData {
  responseValue?: string;
  remarks?: string;
  files?: UploadedDocument[];
  reviewStatus?: 'Pending' | 'Accepted' | 'Clarification Required' | 'Rejected';
  clarificationMessage?: string;
  auditorDecisionAt?: string;
  auditorEmail?: string;
}

export interface ClarificationHistoryItem {
  id: string;
  timestamp: string;
  by: string;
  role: 'Auditor' | 'Distributor';
  message: string;
  action: 'Clarification Required' | 'Resubmitted' | 'Evidence Accepted' | 'Evidence Rejected' | 'Draft' | 'Submitted';
}

export interface QuestionnaireProps {
  transaction?: any;
  engagementId?: string;
  currentUser?: UserSession | null;
  onClose: () => void;
  isReviewMode?: boolean;
  isDistributorWorkflow?: boolean;
  currencyMode?: CurrencyMode | string;
  selectedDistributor?: string;
  distributorName?: string;
  selectedClient?: string;
  targetSampleId?: string;
  targetVoucherNo?: string;
  targetClassification?: string;
  isOpen?: boolean;
  isAuditor?: boolean;
  isDistributor?: boolean;
  onRefresh?: () => void;
  isLocked?: boolean;
}

export const RequiredDataQuestionnaire: React.FC<QuestionnaireProps> = (props) => {
  const {
    transaction,
    engagementId,
    currentUser,
    onClose,
    isReviewMode = false,
    isDistributorWorkflow = false,
    currencyMode = 'INR',
    selectedDistributor,
    distributorName,
    selectedClient,
    isLocked: propIsLocked = false
  } = props;

  const [isRequestEditModalOpen, setIsRequestEditModalOpen] = useState(false);

  const activeCurrency: CurrencyMode = currencyMode === 'USD' ? 'USD' : 'INR';
  const isDistributor = isDistributorWorkflow || currentUser?.role?.includes('Distributor') || currentUser?.role === 'Distributor';
  const isAuditor = !isDistributor;

  const targetSampleId = String(
    props.targetSampleId || transaction?.sampleId || transaction?.id || transaction?.voucherNo || ''
  );
  const targetVoucherNo = String(
    props.targetVoucherNo || transaction?.voucherNo || transaction?.testingReference || transaction?.id || ''
  );
  const activeDistributor =
    selectedDistributor || distributorName || transaction?.distributor || currentUser?.organization || 'Distributor';

  // Overall status
  const initialStatus =
    transaction?.questionnaireResponse?.status ||
    (transaction?.testingStatus === 'Tested' ? 'Accepted' : (transaction?.questionnaireStatus || 'Draft'));
  const [status, setStatus] = useState<string>(initialStatus);

  const isEvidenceAccepted =
    status === 'Accepted' ||
    transaction?.testingStatus === 'Tested' ||
    transaction?.questionnaireStatus === 'Accepted' ||
    transaction?.questionnaireResponse?.status === 'Accepted' ||
    transaction?.questionnaireResponse?.reviewDecision === 'Approved' ||
    transaction?.questionnaireResponse?.reviewDecision === 'Accepted';

  const isReadOnly = Boolean(isReviewMode) || isEvidenceAccepted;

  // State Management
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPushed, setIsPushed] = useState<boolean>(
    Boolean(transaction?.pushedAt || transaction?.questionnaireResponse?.isPushed || initialStatus !== 'Draft')
  );
  const [pushedAt, setPushedAt] = useState<string | null>(
    transaction?.pushedAt || transaction?.questionnaireResponse?.pushedAt || null
  );
  const [pushedBy, setPushedBy] = useState<string | null>(
    transaction?.pushedBy || transaction?.questionnaireResponse?.pushedBy || null
  );
  const [pushedTo, setPushedTo] = useState<string | null>(
    transaction?.questionnaireResponse?.pushedTo || activeDistributor
  );

  // Questions created by Auditor
  const [questions, setQuestions] = useState<any[]>([]);
  
  // Per-item response dictionary: key = question.id || question.dbId || question.question_id
  const [itemResponses, setItemResponses] = useState<Record<string, ItemResponseData>>({});

  // General notes & documents
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [generalFiles, setGeneralFiles] = useState<UploadedDocument[]>([]);

  // Clarification loop
  const [activeClarificationMessage, setActiveClarificationMessage] = useState<string>('');
  const [clarificationHistory, setClarificationHistory] = useState<ClarificationHistoryItem[]>([]);
  const [showClarificationModal, setShowClarificationModal] = useState<boolean>(false);
  const [clarificationTargetItem, setClarificationTargetItem] = useState<string | null>(null); // null = overall
  const [clarificationInputText, setClarificationInputText] = useState<string>('');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  // Question creation/edit modal
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [questionTextForm, setQuestionTextForm] = useState<string>('');
  const [questionTypeForm, setQuestionTypeForm] = useState<string>('Document Upload');
  const [questionHelpForm, setQuestionHelpForm] = useState<string>('');
  const [questionRequiredForm, setQuestionRequiredForm] = useState<boolean>(true);

  // File Upload handling
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null); // 'general' or questionId
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);

  // Load Questions & Existing Responses from DB on mount
  useEffect(() => {
    loadData();
  }, [targetSampleId, targetVoucherNo, engagementId]);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const headers = { 'x-user-email': currentUser?.email || '' };
      
      // 1. Fetch questions for this sample / voucher
      const qRes = await fetch(
        `/api/sampling/required-data/questions?auditId=${encodeURIComponent(engagementId || 'eng-101')}&sampleId=${encodeURIComponent(targetSampleId)}&voucherNo=${encodeURIComponent(targetVoucherNo)}&distributorId=${encodeURIComponent(activeDistributor)}`,
        { headers }
      );
      const qData = await qRes.json();
      let loadedQuestions: any[] = [];
      if (qData.success && Array.isArray(qData.questions)) {
        loadedQuestions = qData.questions;
      }

      // 2. Fetch existing responses
      const rRes = await fetch(
        `/api/sampling/required-data/responses?sampleId=${encodeURIComponent(targetSampleId)}&voucherNo=${encodeURIComponent(targetVoucherNo)}&distributorId=${encodeURIComponent(activeDistributor)}&auditId=${encodeURIComponent(engagementId || 'eng-101')}`,
        { headers }
      );
      const rData = await rRes.json();
      let resp: any = null;
      if (rData.success && Array.isArray(rData.responses) && rData.responses.length > 0) {
        resp = rData.responses[0];
      } else if (transaction?.questionnaireResponse) {
        resp = transaction.questionnaireResponse;
      }

      if (resp) {
        const respStatus = resp.status || (transaction?.testingStatus === 'Tested' ? 'Accepted' : (transaction?.questionnaireStatus || 'Draft'));
        setStatus(respStatus);
        const pushedFlag = resp.isPushed === true || resp.isPushed === 'true' || respStatus !== 'Draft';
        setIsPushed(pushedFlag);
        setPushedAt(resp.pushedAt || transaction?.pushedAt || null);
        setPushedBy(resp.pushedBy || transaction?.pushedBy || null);
        setPushedTo(resp.pushedTo || activeDistributor);
        setGeneralNotes(resp.notes || resp.distributorRemarks || '');
        setGeneralFiles(resp.uploadedFiles || []);
        setItemResponses(resp.itemResponses || {});
        setActiveClarificationMessage(resp.clarificationMessage || '');
        setClarificationHistory(resp.clarificationHistory || []);
      } else if (transaction?.questionnaireStatus) {
        setStatus(transaction.questionnaireStatus);
      }

      // Fallback: If no questions returned by endpoint, fetch from general questions
      if (loadedQuestions.length === 0) {
        try {
          const generalQRes = await fetch(
            `/api/sampling/questions?auditId=${encodeURIComponent(engagementId || 'eng-101')}&sampleId=${encodeURIComponent(targetSampleId)}&voucherNo=${encodeURIComponent(targetVoucherNo)}&distributorId=${encodeURIComponent(activeDistributor)}`,
            { headers }
          );
          if (generalQRes.ok) {
            const genData = await generalQRes.json();
            if (genData.success && Array.isArray(genData.questions) && genData.questions.length > 0) {
              loadedQuestions = genData.questions.map((q: any) => ({
                id: q.question_id || q.id,
                dbId: q.dbId,
                question_id: q.question_id || q.id,
                question_text: q.question_text || q.text,
                testing_classification: q.testing_classification || q.contextClass,
                required: q.required !== undefined ? q.required : true,
                scope: q.scope || 'transaction',
                help_text: q.help_text || ''
              }));
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // Reconcile any items present in resp.itemResponses that might not be in loadedQuestions
      if (resp && resp.itemResponses) {
        Object.keys(resp.itemResponses).forEach((qKey) => {
          const alreadyExists = loadedQuestions.some(
            q => String(q.dbId || q.question_id || q.id) === String(qKey) || String(q.question_text) === String(qKey)
          );
          if (!alreadyExists) {
            loadedQuestions.push({
              id: qKey,
              question_id: qKey,
              question_text: qKey,
              required: true,
              scope: 'transaction'
            });
          }
        });
      }

      setQuestions(loadedQuestions);
    } catch (err: any) {
      console.error('Failed to load questionnaire data:', err);
      setErrorMessage('Could not load questionnaire details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get consistent question key
  const getQuestionKey = (q: any) => String(q.dbId || q.question_id || q.id || '');

  // File Upload Handler
  const triggerFileUpload = (target: string) => {
    setUploadingTarget(target);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0 || !uploadingTarget) return;

    const newDocs: UploadedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // Read data URL for instant offline/in-memory preview support
      const dataUrlPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
      const dataUrl = await dataUrlPromise;

      let sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      if (file.size > 1024 * 1024) {
        sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      }

      // Try uploading to backend storage
      let uploadedDocUrl = dataUrl;
      let driveId = undefined;
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', 'EVIDENCE');
        formData.append('documentUsage', 'REQUIRED_DATA');
        formData.append('requirementId', targetVoucherNo || targetSampleId);
        formData.append('clientName', selectedClient || 'Apex Electronics Corp');
        formData.append('distributorName', activeDistributor);
        formData.append('auditName', engagementId || 'XYZ Distributor Audit 2026');

        const uploadRes = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'x-user-email': currentUser?.email || '' },
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.success && uploadData.file) {
          driveId = uploadData.file.googleDriveFileId;
          uploadedDocUrl = `/api/storage/download/${driveId}?fileName=${encodeURIComponent(uploadData.file.fileName || file.name)}`;
        }
      } catch (err) {
        console.warn('Storage upload fallback to dataUrl', err);
      }

      newDocs.push({
        id: docId,
        name: file.name,
        size: sizeStr,
        type: file.type || 'application/octet-stream',
        uploadDate: new Date().toISOString(),
        googleDriveFileId: driveId,
        url: uploadedDocUrl,
        dataUrl: dataUrl
      });
    }

    if (uploadingTarget === 'general') {
      setGeneralFiles(prev => [...prev, ...newDocs]);
    } else {
      const qKey = uploadingTarget;
      setItemResponses(prev => {
        const existing = prev[qKey] || {};
        const existingFiles = existing.files || [];
        return {
          ...prev,
          [qKey]: {
            ...existing,
            files: [...existingFiles, ...newDocs]
          }
        };
      });
    }

    if (isDistributor && newDocs.length > 0) {
      try {
        const fileNames = newDocs.map(d => d.name).join(', ');
        fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': currentUser?.email || ''
          },
          body: JSON.stringify({
            title: `Documents Uploaded: Voucher #${targetVoucherNo}`,
            message: `Distributor ${activeDistributor} uploaded supporting documents (${fileNames}) for Voucher #${targetVoucherNo}.`,
            category: 'Documents Uploaded',
            targetRole: 'Auditor',
            targetOrganization: activeDistributor,
            metadata: {
              voucherNo: targetVoucherNo,
              sampleId: targetSampleId,
              distributorName: activeDistributor,
              linkTab: 'sampling_review',
              targetRole: 'Auditor'
            }
          })
        }).then(() => {
          window.dispatchEvent(new CustomEvent('notification-updated'));
        }).catch(e => console.warn('Upload notification error:', e));
      } catch (e) {}
    }

    setUploadingTarget(null);
  };

  const removeFile = (target: string, fileId: string) => {
    if (target === 'general') {
      setGeneralFiles(prev => prev.filter(f => f.id !== fileId));
    } else {
      const qKey = target;
      setItemResponses(prev => {
        const existing = prev[qKey];
        if (!existing) return prev;
        return {
          ...prev,
          [qKey]: {
            ...existing,
            files: (existing.files || []).filter(f => f.id !== fileId)
          }
        };
      });
    }
  };

  const updateItemRemarks = (qKey: string, remarks: string) => {
    setItemResponses(prev => ({
      ...prev,
      [qKey]: {
        ...(prev[qKey] || {}),
        remarks
      }
    }));
  };

  const updateItemResponseValue = (qKey: string, responseValue: string) => {
    setItemResponses(prev => ({
      ...prev,
      [qKey]: {
        ...(prev[qKey] || {}),
        responseValue
      }
    }));
  };

  // AUDITOR: Add or Edit Question
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionTextForm('');
    setQuestionHelpForm('');
    setQuestionTypeForm('Document Upload');
    setQuestionRequiredForm(true);
    setShowAddQuestionModal(true);
  };

  const handleOpenEditQuestion = (q: any) => {
    setEditingQuestion(q);
    setQuestionTextForm(q.question_text || '');
    setQuestionHelpForm(q.help_text || q.instruction || q.comment || '');
    setQuestionTypeForm(q.answer_type || q.response_type || 'Document Upload');
    setQuestionRequiredForm(q.required !== undefined ? q.required : true);
    setShowAddQuestionModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionTextForm.trim()) return;

    setSaving(true);
    try {
      if (editingQuestion) {
        // Update existing question
        const qId = editingQuestion.dbId || editingQuestion.id;
        await fetch(`/api/sampling/required-data/questions/${qId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': currentUser?.email || ''
          },
          body: JSON.stringify({
            question_text: questionTextForm.trim(),
            help_text: questionHelpForm.trim(),
            instruction: questionHelpForm.trim(),
            comment: questionHelpForm.trim(),
            answer_type: questionTypeForm,
            response_type: questionTypeForm,
            required: questionRequiredForm
          })
        });

        setQuestions(prev => prev.map(q => {
          if ((q.dbId || q.id) === qId) {
            return {
              ...q,
              question_text: questionTextForm.trim(),
              help_text: questionHelpForm.trim(),
              instruction: questionHelpForm.trim(),
              comment: questionHelpForm.trim(),
              answer_type: questionTypeForm,
              response_type: questionTypeForm,
              required: questionRequiredForm
            };
          }
          return q;
        }));
      } else {
        // Create new question for this transaction
        const payload = {
          engagement_id: engagementId || 'eng-101',
          distributor_id: activeDistributor,
          sample_id: targetSampleId,
          voucher_no: targetVoucherNo,
          question_text: questionTextForm.trim(),
          help_text: questionHelpForm.trim(),
          instruction: questionHelpForm.trim(),
          comment: questionHelpForm.trim(),
          required: questionRequiredForm,
          scope: 'transaction',
          answer_type: questionTypeForm,
          response_type: questionTypeForm,
          allow_comment: true,
          allow_file_upload: true
        };

        const res = await fetch('/api/sampling/required-data/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': currentUser?.email || ''
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          const newQ = {
            dbId: data.dbId,
            ...payload
          };
          setQuestions(prev => [...prev, newQ]);
        }
      }
      setShowAddQuestionModal(false);
    } catch (err) {
      console.error('Error saving question:', err);
      alert('Failed to save question. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (q: any) => {
    if (!confirm('Are you sure you want to remove this required data item?')) return;
    const qId = q.dbId || q.id;
    try {
      await fetch(`/api/sampling/required-data/questions/${qId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      setQuestions(prev => prev.filter(item => (item.dbId || item.id) !== qId));
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  // AUDITOR: Push Questionnaire to Distributor
  const handlePushQuestionnaire = async () => {
    if (questions.length === 0) {
      alert('Please add at least one question / required data item before pushing to the distributor.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/sampling/required-data/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({
          engagementId: engagementId || 'eng-101',
          sampleId: targetSampleId,
          voucherNo: targetVoucherNo,
          distributorId: activeDistributor,
          distributorName: activeDistributor,
          questions
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsPushed(true);
        setStatus('Pending Submission');
        setPushedAt(new Date().toISOString());
        setPushedBy(currentUser?.email || 'Auditor');
        setPushedTo(activeDistributor);
        setSaveSuccessMsg(`Questionnaire successfully pushed to ${activeDistributor}!`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
        window.dispatchEvent(new CustomEvent('notification-updated'));
      } else {
        alert(data.error || 'Failed to push questionnaire.');
      }
    } catch (err: any) {
      console.error('Error pushing questionnaire:', err);
      alert('Failed to push questionnaire. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // DISTRIBUTOR / AUDITOR: Save Responses / Draft / Submit
  const handleSaveResponses = async (targetStatus: string = status) => {
    setSaving(true);
    setErrorMessage(null);
    try {
      const isSubmitting = targetStatus === 'Submitted';
      let updatedHistory = [...clarificationHistory];

      if (isSubmitting) {
        const isResubmit = status === 'Clarification Required' || status === 'Rejected';
        updatedHistory.push({
          id: `hist_${Date.now()}`,
          timestamp: new Date().toISOString(),
          by: currentUser?.email || (isDistributor ? 'Distributor' : 'Auditor'),
          role: isDistributor ? 'Distributor' : 'Auditor',
          message: isResubmit ? 'Provided updated evidence, remarks, and resubmitted required data.' : 'Submitted required data and documents.',
          action: isResubmit ? 'Resubmitted' : 'Submitted'
        });
      }

      const payload = {
        engagement_id: engagementId || 'eng-101',
        sample_id: targetSampleId,
        voucher_no: targetVoucherNo,
        distributor_id: activeDistributor,
        distributorName: activeDistributor,
        status: targetStatus,
        notes: generalNotes,
        uploadedFiles: generalFiles,
        itemResponses,
        isPushed,
        pushedAt,
        pushedBy,
        pushedTo,
        clarificationMessage: targetStatus === 'Submitted' ? '' : activeClarificationMessage,
        clarificationHistory: updatedHistory,
        actionRole: isDistributor ? 'Distributor' : 'Auditor',
        actionType: targetStatus === 'Draft' ? 'DRAFT_SAVED' : (status === 'Clarification Required' || status === 'Rejected' ? 'RESUBMITTED' : 'SUBMITTED')
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
        setClarificationHistory(updatedHistory);
        if (targetStatus === 'Submitted') {
          setActiveClarificationMessage('');
          setSaveSuccessMsg('Required data submitted successfully to the auditor!');
        } else if (targetStatus === 'Draft') {
          setSaveSuccessMsg('Draft saved successfully.');
        } else {
          setSaveSuccessMsg('Changes saved.');
        }
        setTimeout(() => setSaveSuccessMsg(null), 4000);
        window.dispatchEvent(new CustomEvent('notification-updated'));
      } else {
        alert(data.error || 'Failed to save.');
      }
    } catch (err: any) {
      console.error('Failed to save responses:', err);
      alert('Failed to save data. Please check your network connection.');
    } finally {
      setSaving(false);
    }
  };

  // AUDITOR: Item-level Decision (Accept, Clarification, Reject)
  const handleItemDecision = async (qKey: string, newReviewStatus: 'Accepted' | 'Clarification Required' | 'Rejected') => {
    if (newReviewStatus === 'Clarification Required') {
      setClarificationTargetItem(qKey);
      setClarificationInputText(itemResponses[qKey]?.clarificationMessage || '');
      setShowClarificationModal(true);
      return;
    }

    const updatedItems = {
      ...itemResponses,
      [qKey]: {
        ...(itemResponses[qKey] || {}),
        reviewStatus: newReviewStatus,
        auditorDecisionAt: new Date().toISOString(),
        auditorEmail: currentUser?.email || 'Auditor'
      }
    };
    setItemResponses(updatedItems);

    // Save immediately so decision persists in DB and triggers notification
    try {
      const payload = {
        engagement_id: engagementId || 'eng-101',
        sample_id: targetSampleId,
        voucher_no: targetVoucherNo,
        distributor_id: activeDistributor,
        distributorName: activeDistributor,
        status: status === 'Draft' || !status ? 'Pending Submission' : status,
        notes: generalNotes,
        uploadedFiles: generalFiles,
        itemResponses: updatedItems,
        isPushed: true,
        actionRole: 'Auditor',
        actionType: 'ITEM_DECISION',
        itemKey: qKey,
        itemDecision: newReviewStatus
      };
      await fetch('/api/sampling/required-data/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify(payload)
      });
      setSaveSuccessMsg(`Item marked as ${newReviewStatus}.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (e) {
      console.warn('Auto-save item decision error:', e);
    }
  };

  // AUDITOR: Clarification Modal Submit
  const handleSendClarification = async () => {
    if (!clarificationInputText.trim()) {
      alert('Please enter clarification instructions for the distributor.');
      return;
    }

    const message = clarificationInputText.trim();
    const updatedHistory: ClarificationHistoryItem[] = [
      ...clarificationHistory,
      {
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        by: currentUser?.email || 'Auditor',
        role: 'Auditor',
        message: clarificationTargetItem 
          ? `[Item Specific] ${message}` 
          : message,
        action: 'Clarification Required'
      }
    ];

    let updatedItemResponses = { ...itemResponses };
    if (clarificationTargetItem) {
      updatedItemResponses[clarificationTargetItem] = {
        ...(updatedItemResponses[clarificationTargetItem] || {}),
        reviewStatus: 'Clarification Required',
        clarificationMessage: message,
        auditorDecisionAt: new Date().toISOString(),
        auditorEmail: currentUser?.email || 'Auditor'
      };
    }

    setSaving(true);
    try {
      const payload = {
        engagement_id: engagementId || 'eng-101',
        sample_id: targetSampleId,
        voucher_no: targetVoucherNo,
        distributor_id: activeDistributor,
        distributorName: activeDistributor,
        status: 'Clarification Required',
        notes: generalNotes,
        uploadedFiles: generalFiles,
        itemResponses: updatedItemResponses,
        isPushed: true,
        clarificationMessage: message,
        clarificationHistory: updatedHistory,
        actionRole: 'Auditor',
        actionType: 'CLARIFICATION_REQUESTED'
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
        setStatus('Clarification Required');
        setActiveClarificationMessage(message);
        setItemResponses(updatedItemResponses);
        setClarificationHistory(updatedHistory);
        setShowClarificationModal(false);
        setClarificationTargetItem(null);
        setClarificationInputText('');
        setSaveSuccessMsg('Clarification request sent to distributor.');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
        window.dispatchEvent(new CustomEvent('notification-updated'));
      }
    } catch (err) {
      console.error('Error sending clarification:', err);
      alert('Failed to send clarification request.');
    } finally {
      setSaving(false);
    }
  };

  // AUDITOR: Overall Decision (Accept All, Reject)
  const handleOverallDecision = async (newStatus: 'Accepted' | 'Rejected') => {
    setSaving(true);
    try {
      const updatedHistory: ClarificationHistoryItem[] = [
        ...clarificationHistory,
        {
          id: `hist_${Date.now()}`,
          timestamp: new Date().toISOString(),
          by: currentUser?.email || 'Auditor',
          role: 'Auditor',
          message: newStatus === 'Accepted' ? 'All submitted evidence accepted.' : 'Submitted evidence rejected.',
          action: newStatus === 'Accepted' ? 'Evidence Accepted' : 'Evidence Rejected'
        }
      ];

      // Also set all item statuses
      const updatedItems = { ...itemResponses };
      questions.forEach(q => {
        const k = getQuestionKey(q);
        updatedItems[k] = {
          ...(updatedItems[k] || {}),
          reviewStatus: newStatus,
          auditorDecisionAt: new Date().toISOString(),
          auditorEmail: currentUser?.email || 'Auditor'
        };
      });

      const payload = {
        engagement_id: engagementId || 'eng-101',
        sample_id: targetSampleId,
        voucher_no: targetVoucherNo,
        distributor_id: activeDistributor,
        distributorName: activeDistributor,
        status: newStatus,
        notes: generalNotes,
        uploadedFiles: generalFiles,
        itemResponses: updatedItems,
        isPushed: true,
        clarificationMessage: '',
        clarificationHistory: updatedHistory,
        actionRole: 'Auditor',
        actionType: newStatus === 'Accepted' ? 'EVIDENCE_ACCEPTED' : 'EVIDENCE_REJECTED'
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
        setStatus(newStatus);
        setItemResponses(updatedItems);
        setClarificationHistory(updatedHistory);
        setSaveSuccessMsg(`Questionnaire status updated to: ${newStatus}`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
        window.dispatchEvent(new CustomEvent('notification-updated'));
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  // Helper Icon for file types
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
    }
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return <ImageIcon className="h-5 w-5 text-amber-400" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className="h-5 w-5 text-rose-400" />;
    }
    return <File className="h-5 w-5 text-indigo-400" />;
  };

  const handleDownloadFile = (doc: UploadedDocument) => {
    const link = document.createElement('a');
    link.href = doc.url || doc.dataUrl || '#';
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Hidden File Input */}
        <input 
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt,.zip,.rtf"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Required Data & Questionnaire
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                  Voucher #{targetVoucherNo}
                </span>
                
                {/* Status Badge */}
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  status === 'Accepted'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : status === 'Clarification Required'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : status === 'Submitted'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : status === 'Pending Submission'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : status === 'Rejected'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {status === 'Accepted' && <CheckCircle2 className="h-3 w-3" />}
                  {status === 'Clarification Required' && <AlertTriangle className="h-3 w-3" />}
                  {status === 'Submitted' && <Clock className="h-3 w-3" />}
                  {status === 'Pending Submission' && <Send className="h-3 w-3" />}
                  {status === 'Rejected' && <XCircle className="h-3 w-3" />}
                  {status}
                </span>

                {isReadOnly && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                    Final Review Only • Read-Only
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Engagement: <span className="text-slate-300 font-medium">{engagementId || 'General Audit'}</span> • Distributor: <span className="text-slate-300 font-medium">{activeDistributor}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {clarificationHistory.length > 0 && (
              <button
                onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                title="View History & Clarification Logs"
              >
                <History className="h-3.5 w-3.5 text-indigo-400" />
                <span>History ({clarificationHistory.length})</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {saveSuccessMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Error Toast */}
        {errorMessage && (
          <div className="bg-rose-500/20 border-b border-rose-500/30 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Read-Only Notice for Final Review */}
          {isReadOnly && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Final Review Only — Read-Only Mode</span>
                  <span className="text-emerald-300/90">This questionnaire and its submitted evidence have been accepted. All questions, responses, documents, remarks, and auditor review decisions are displayed in read-only format.</span>
                </div>
              </div>
            </div>
          )}

          {/* 1. Transaction Summary Card */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</span>
                <span className="font-mono text-slate-200 font-semibold">{transaction?.date || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account</span>
                <span className="text-slate-200 font-semibold truncate block" title={transaction?.accountDescription}>
                  {transaction?.accountDescription || transaction?.accountNumber || '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Debit</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {Number(transaction?.debit) > 0 ? formatFinancialAmount(Number(transaction.debit), activeCurrency) : '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Credit</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {Number(transaction?.credit) > 0 ? formatFinancialAmount(Number(transaction.credit), activeCurrency) : '—'}
                </span>
              </div>
            </div>
            {transaction?.description && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-800/60 text-xs text-slate-300">
                <span className="font-bold text-slate-400 mr-2">Description:</span>
                <span>{transaction.description}</span>
                {transaction?.narration && transaction.narration !== transaction.description && (
                  <span className="text-slate-500 ml-2">({transaction.narration})</span>
                )}
              </div>
            )}
          </div>

          {/* 2. Clarification Active Alert Box */}
          {status === 'Clarification Required' && activeClarificationMessage && (
            <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-sm font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>Auditor Clarification Request</span>
              </div>
              <p className="text-xs text-amber-100 bg-slate-900/60 p-3 rounded-lg border border-amber-500/20 font-medium leading-relaxed">
                {activeClarificationMessage}
              </p>
              <p className="text-[11px] text-amber-400/80">
                {isDistributor 
                  ? 'Please review the requested changes, attach any missing documents or updated remarks, and click "Resubmit Required Data" below.'
                  : 'Clarification has been requested from the distributor. Awaiting updated submission.'}
              </p>
            </div>
          )}

          {/* Rejection Alert Box */}
          {status === 'Rejected' && (
            <div className="bg-rose-500/10 border border-rose-500/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 text-sm font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>Auditor Review: Evidence Rejected</span>
              </div>
              {activeClarificationMessage && (
                <p className="text-xs text-rose-100 bg-slate-900/60 p-3 rounded-lg border border-rose-500/20 font-medium leading-relaxed">
                  {activeClarificationMessage}
                </p>
              )}
              <p className="text-[11px] text-rose-300/80">
                {isDistributor 
                  ? 'The submitted documentation for this voucher was rejected by the auditor. Please review comments/discrepancies, attach corrected documents or remarks, and click "Resubmit Required Data" below.'
                  : 'Submitted evidence has been rejected. The distributor has been notified to provide replacement documentation.'}
              </p>
            </div>
          )}

          {/* Evidence Accepted Alert Box */}
          {status === 'Accepted' && (
            <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-3.5 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-emerald-300">Auditor Review: Evidence Accepted</span>
                <p className="text-[11px] text-emerald-200/80 mt-0.5">
                  All submitted documentation and responses for this voucher have been verified and approved by the auditor.
                </p>
              </div>
            </div>
          )}

          {/* 3. Clarification History Drawer (Collapsible) */}
          {showHistoryDrawer && clarificationHistory.length > 0 && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <History className="h-4 w-4 text-indigo-400" />
                  <span>Audit Trail & Clarification History</span>
                </div>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Close
                </button>
              </div>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {clarificationHistory.map((item, idx) => (
                  <div key={item.id || idx} className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-bold text-slate-400">{item.role} ({item.by})</span>
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-indigo-300">
                        {item.action}
                      </span>
                      <p className="text-slate-200">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Main Section: Required Data Items / Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  Required Information & Evidence Items ({questions.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAuditor 
                    ? 'Specify the exact documents, certifications, or explanations required from the distributor for this transaction.'
                    : 'Provide the requested supporting documents and remarks for each item below.'}
                </p>
              </div>

              {/* Auditor Add Question Button */}
              {isAuditor && !isReadOnly && (
                <button
                  onClick={handleOpenAddQuestion}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Item</span>
                </button>
              )}
            </div>

            {/* Questions List */}
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <div className="inline-block animate-spin mb-2">⟳</div>
                <p>Loading required data questionnaire...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center bg-slate-950/30 space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-300">No Required Data Items Defined</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {isAuditor 
                      ? 'No questions have been configured for this transaction.'
                      : 'No specific required data items have been requested for this transaction yet. You can attach general supporting documents and notes below.'}
                  </p>
                </div>
                {isAuditor && !isReadOnly && (
                  <button
                    onClick={handleOpenAddQuestion}
                    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add First Item
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const qKey = getQuestionKey(q);
                  const itemData = itemResponses[qKey] || {};
                  const itemFiles = itemData.files || [];
                  const itemRemarks = itemData.remarks || '';
                  const itemReviewStatus = itemData.reviewStatus || 'Pending';

                  return (
                    <div 
                      key={qKey || idx} 
                      className={`border rounded-xl p-5 bg-slate-950/50 space-y-4 transition-colors ${
                        itemReviewStatus === 'Accepted'
                          ? 'border-emerald-500/40 bg-emerald-950/10'
                          : itemReviewStatus === 'Clarification Required'
                          ? 'border-amber-500/40 bg-amber-950/10'
                          : itemReviewStatus === 'Rejected'
                          ? 'border-rose-500/40 bg-rose-950/10'
                          : 'border-slate-800'
                      }`}
                    >
                      {/* Item Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                              Item #{idx + 1}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {q.answer_type || q.response_type || 'Document Upload'}
                            </span>
                            {q.required && (
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/60">
                                * Required
                              </span>
                            )}
                            {/* Item Review Status Badge */}
                            {itemReviewStatus !== 'Pending' && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                itemReviewStatus === 'Accepted'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : itemReviewStatus === 'Clarification Required'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}>
                                {itemReviewStatus}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                            {q.question_text}
                          </h4>

                          {(q.help_text || q.instruction || q.comment) && (
                            <p className="text-xs text-indigo-300/90 bg-indigo-950/40 border border-indigo-900/50 rounded-md px-2.5 py-1.5">
                              <strong className="text-indigo-200">Comment / Instruction:</strong> {q.help_text || q.instruction || q.comment}
                            </p>
                          )}
                        </div>

                        {/* Auditor Actions on the question itself */}
                        {isAuditor && !isReadOnly && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditQuestion(q)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Question"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Specific Item Clarification Callout */}
                      {itemReviewStatus === 'Clarification Required' && itemData.clarificationMessage && (
                        <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg p-3 text-xs space-y-1">
                          <span className="font-bold text-amber-300 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                            Auditor Clarification Request for Item #{idx + 1}:
                          </span>
                          <p className="text-amber-100 font-medium">{itemData.clarificationMessage}</p>
                        </div>
                      )}

                      {/* Response Input for Non-Document Question Types */}
                      {(q.answer_type === 'Yes / No / N/A' || q.response_type === 'Yes / No / N/A' || q.answer_type === 'Yes / No' || q.response_type === 'Yes / No') && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                            <span>Response Selection:</span>
                            {q.required && <span className="text-rose-400">*</span>}
                          </label>
                          {isDistributor && !isReadOnly ? (
                            <div className="flex items-center gap-2">
                              {['Yes', 'No', 'N/A'].map((opt) => {
                                const isSelected = itemData.responseValue === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => updateItemResponseValue(qKey, opt)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                      isSelected
                                        ? opt === 'Yes'
                                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                          : opt === 'No'
                                          ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                                          : 'bg-slate-700 text-white border-slate-600 shadow-sm'
                                        : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-slate-200">
                              {itemData.responseValue ? (
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                                  itemData.responseValue === 'Yes' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                                  itemData.responseValue === 'No' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                                  'bg-slate-800 text-slate-300 border-slate-700'
                                }`}>
                                  {itemData.responseValue}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">No response selected yet</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {(q.answer_type === 'Text' || q.response_type === 'Text') && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                            <span>Text Response:</span>
                            {q.required && <span className="text-rose-400">*</span>}
                          </label>
                          {isDistributor && !isReadOnly ? (
                            <textarea
                              value={itemData.responseValue || ''}
                              onChange={(e) => updateItemResponseValue(qKey, e.target.value)}
                              placeholder="Type your response here..."
                              rows={2}
                              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                          ) : (
                            <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-200">
                              {itemData.responseValue || <span className="text-slate-500 italic">No text response provided.</span>}
                            </div>
                          )}
                        </div>
                      )}

                      {(q.answer_type === 'Number / Amount' || q.response_type === 'Number / Amount') && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                            <span>Number / Amount:</span>
                            {q.required && <span className="text-rose-400">*</span>}
                          </label>
                          {isDistributor && !isReadOnly ? (
                            <input
                              type="number"
                              step="any"
                              value={itemData.responseValue || ''}
                              onChange={(e) => updateItemResponseValue(qKey, e.target.value)}
                              placeholder="Enter number or amount (e.g. 5000.00)..."
                              className="w-full max-w-xs bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                          ) : (
                            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-bold text-slate-200 inline-block">
                              {itemData.responseValue ? `${itemData.responseValue}` : <span className="text-slate-500 font-normal italic">No amount entered.</span>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Supporting Documents for this item */}
                      <div className="space-y-2 pt-1 border-t border-slate-800/60">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                          <span>
                            {q.answer_type === 'Document Upload' || q.response_type === 'Document Upload' || (!q.answer_type && !q.response_type)
                              ? `Attached Evidence Documents (${itemFiles.length})`
                              : `Supporting Attachment / Evidence (${itemFiles.length})`}
                          </span>
                          {/* Upload button for Distributor */}
                          {isDistributor && !isReadOnly && (
                            <button
                              onClick={() => triggerFileUpload(qKey)}
                              className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Upload className="h-3 w-3" /> Upload Document
                            </button>
                          )}
                        </div>

                        {itemFiles.length === 0 ? (
                          <div className="py-4 px-3 border border-slate-800/80 rounded-lg bg-slate-900/30 text-center text-xs text-slate-500">
                            {isDistributor 
                              ? 'No supporting files attached yet for this item.'
                              : 'No documents submitted for this item yet.'}
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
                            {itemFiles.map((doc) => (
                              <div key={doc.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  {getFileIcon(doc.name)}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-slate-200 truncate" title={doc.name}>
                                      {doc.name}
                                    </p>
                                    <span className="text-[10px] text-slate-500">
                                      {doc.size} • {new Date(doc.uploadDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => setPreviewDoc(doc)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium flex items-center gap-1"
                                    title="View / Preview"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownloadFile(doc)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium flex items-center gap-1"
                                    title="Download"
                                  >
                                    <Download className="h-3 w-3" />
                                    <span>Download</span>
                                  </button>
                                  {isDistributor && !isReadOnly && (
                                    <button
                                      onClick={() => removeFile(qKey, doc.id)}
                                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                                      title="Remove"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Remarks / Notes for this item */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-bold text-slate-400">
                          {isDistributor && !isReadOnly ? 'Distributor Notes / Remarks for this item:' : 'Distributor Remarks:'}
                        </label>
                        {isDistributor && !isReadOnly ? (
                          <textarea
                            value={itemRemarks}
                            onChange={(e) => updateItemRemarks(qKey, e.target.value)}
                            placeholder="Provide any explanations, voucher references, or context for this item..."
                            rows={2}
                            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300 min-h-[38px]">
                            {itemRemarks || <span className="text-slate-500 italic">No remarks entered by distributor.</span>}
                          </div>
                        )}
                      </div>

                      {/* Auditor Review Controls for this Item */}
                      {isAuditor && (
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap bg-slate-900/30 -mx-5 -mb-5 p-3 rounded-b-xl">
                          <span className="text-xs font-bold text-slate-400">
                            Auditor Review & Decision:
                          </span>
                          {isReadOnly ? (
                            <div className="flex items-center gap-2 text-xs flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                {itemReviewStatus === 'Pending' ? 'Accepted' : itemReviewStatus}
                              </span>
                              {itemData.auditorEmail && (
                                <span className="text-slate-400 text-[11px]">
                                  Reviewed by: <strong className="text-slate-200">{itemData.auditorEmail}</strong>
                                </span>
                              )}
                              {itemData.auditorDecisionAt && (
                                <span className="text-slate-500 text-[11px]">
                                  ({new Date(itemData.auditorDecisionAt).toLocaleString()})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleItemDecision(qKey, 'Accepted')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                  itemReviewStatus === 'Accepted'
                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                                    : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white'
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" /> Accept Evidence
                              </button>

                              <button
                                onClick={() => handleItemDecision(qKey, 'Clarification Required')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                  itemReviewStatus === 'Clarification Required'
                                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                                    : 'bg-amber-600/20 text-amber-300 hover:bg-amber-600 hover:text-white'
                                }`}
                              >
                                <HelpCircle className="h-3.5 w-3.5" /> Require Clarification
                              </button>

                              <button
                                onClick={() => handleItemDecision(qKey, 'Rejected')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                  itemReviewStatus === 'Rejected'
                                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                                    : 'bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white'
                                }`}
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. General Supporting Documents & Overall Remarks */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-200">
                  General Supporting Documents & Remarks
                </h4>
                <p className="text-xs text-slate-400">
                  Additional transaction-level files, authorization memos, or general distributor remarks.
                </p>
              </div>
              {isDistributor && !isReadOnly && (
                <button
                  onClick={() => triggerFileUpload('general')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <Upload className="h-3 w-3 text-indigo-400" />
                  <span>Attach General File</span>
                </button>
              )}
            </div>

            {/* General Files List */}
            {generalFiles.length > 0 && (
              <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
                {generalFiles.map((doc) => (
                  <div key={doc.id} className="p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {getFileIcon(doc.name)}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-200 truncate" title={doc.name}>{doc.name}</p>
                        <span className="text-[10px] text-slate-500">{doc.size} • {new Date(doc.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                      <button
                        onClick={() => handleDownloadFile(doc)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" /> Download
                      </button>
                      {isDistributor && !isReadOnly && (
                        <button
                          onClick={() => removeFile('general', doc.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* General Notes Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Overall Remarks:</label>
              {isDistributor && !isReadOnly ? (
                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Enter any overall explanation or notes for the audit team..."
                  rows={2}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300 min-h-[38px]">
                  {generalNotes || <span className="text-slate-500 italic">No overall remarks entered.</span>}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-4 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            {status === 'Accepted' || isEvidenceAccepted ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Evidence Accepted • Final Review Verified
              </span>
            ) : isPushed || status === 'Submitted' || status === 'Clarification Required' ? (
              <span className="text-xs text-indigo-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-400" />
                Pushed to {activeDistributor}{pushedAt ? ` (${new Date(pushedAt).toLocaleDateString()})` : ''}
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Not pushed to distributor yet
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* READ-ONLY / FINAL REVIEW CONTROLS */}
            {isReadOnly || propIsLocked ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  <span>Read-Only Mode</span>
                </div>
                {isDistributor && (
                  <button
                    type="button"
                    onClick={() => setIsRequestEditModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Request Edit Access</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* DISTRIBUTOR ACTIONS */}
                {isDistributor && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveResponses('Draft')}
                      disabled={saving}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700 disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveResponses('Submitted')}
                      disabled={saving}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{status === 'Clarification Required' || status === 'Rejected' ? 'Resubmit Required Data' : 'Submit Required Data'}</span>
                    </button>
                  </>
                )}

                {/* AUDITOR ACTIONS */}
                {isAuditor && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveResponses(status)}
                      disabled={saving}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700 disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Changes</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePushQuestionnaire}
                      disabled={saving || questions.length === 0}
                      className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Push to Distributor</span>
                    </button>

                    {/* Clarification Button for Auditor */}
                    <button
                      type="button"
                      onClick={() => {
                        setClarificationTargetItem(null);
                        setClarificationInputText(activeClarificationMessage || '');
                        setShowClarificationModal(true);
                      }}
                      disabled={saving}
                      className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Require Clarification</span>
                    </button>

                    {/* Overall Reject Button */}
                    <button
                      type="button"
                      onClick={() => handleOverallDecision('Rejected')}
                      disabled={saving}
                      className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject Evidence</span>
                    </button>

                    {/* Overall Accept Button */}
                    <button
                      type="button"
                      onClick={() => handleOverallDecision('Accepted')}
                      disabled={saving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Accept Evidence</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Add / Edit Question Modal (AUDITOR ONLY) */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                {editingQuestion ? 'Edit Required Item' : 'Add Required Item'}
              </h3>
              <button onClick={() => setShowAddQuestionModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Question / Request <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={questionTextForm}
                  onChange={(e) => setQuestionTextForm(e.target.value)}
                  placeholder="Enter the specific required data, document, or question (e.g. Provide signed vendor delivery receipt and confirmation of receipt)..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Response Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Response Type <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Document Upload', label: 'Document Upload', desc: 'PDF, Excel, Word, PPT, images, CSV' },
                    { id: 'Yes / No / N/A', label: 'Yes / No / N/A', desc: 'Select Yes, No, or N/A' },
                    { id: 'Text', label: 'Text', desc: 'Descriptive narrative response' },
                    { id: 'Number / Amount', label: 'Number / Amount', desc: 'Financial quantity or amount' }
                  ].map((typeOption) => {
                    const isSelected = questionTypeForm === typeOption.id;
                    return (
                      <button
                        key={typeOption.id}
                        type="button"
                        onClick={() => setQuestionTypeForm(typeOption.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/80 border-indigo-500 ring-1 ring-indigo-500/50'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <div className={`text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                          {typeOption.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {typeOption.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Optional Comment / Instruction <span className="text-slate-500 font-normal">(Applies to all response types)</span>
                </label>
                <textarea
                  value={questionHelpForm}
                  onChange={(e) => setQuestionHelpForm(e.target.value)}
                  placeholder="e.g. Include authorized finance manager signature, stamp, and reference to purchase order..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req_checkbox"
                  checked={questionRequiredForm}
                  onChange={(e) => setQuestionRequiredForm(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950 h-4 w-4"
                />
                <label htmlFor="req_checkbox" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Mandatory question for distributor response
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                disabled={!questionTextForm.trim() || saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{editingQuestion ? 'Update Item' : 'Add Item'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clarification Instructions Modal (AUDITOR ONLY) */}
      {showClarificationModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {clarificationTargetItem ? 'Require Item Clarification' : 'Require Overall Clarification'}
                </h3>
              </div>
              <button onClick={() => setShowClarificationModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your specific clarification instructions for the distributor. The distributor will be notified and will be able to upload missing evidence or revised remarks.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300">
                Clarification Message / Instructions:
              </label>
              <textarea
                value={clarificationInputText}
                onChange={(e) => setClarificationInputText(e.target.value)}
                placeholder="e.g. The uploaded invoice is missing Page 2 showing the manager signature. Please upload the complete tax invoice and debit note..."
                rows={4}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowClarificationModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendClarification}
                disabled={!clarificationInputText.trim() || saving}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Clarification Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentViewerModal
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* Edit Access Request Modal */}
      <EditAccessRequestModal
        isOpen={isRequestEditModalOpen}
        onClose={() => setIsRequestEditModalOpen(false)}
        client={selectedClient || 'Apex Electronics Corp'}
        distributor={activeDistributor}
        auditId={engagementId || 'eng-101'}
        currentUser={currentUser}
        onSuccess={() => {
          if (props.onRefresh) props.onRefresh();
          window.dispatchEvent(new CustomEvent('edit-access-updated'));
        }}
      />
    </div>
  );
};
