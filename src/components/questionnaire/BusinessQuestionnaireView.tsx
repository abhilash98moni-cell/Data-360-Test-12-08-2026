import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Upload,
  Paperclip,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  Lock,
  Sparkles,
  ExternalLink,
  HelpCircle,
  FolderOpen,
  Filter,
  Check,
  Flag,
  Bookmark,
  Eye,
  RefreshCw
} from 'lucide-react';
import {
  BUSINESS_QUESTIONNAIRE_SECTIONS,
  TOTAL_BUSINESS_QUESTIONNAIRE_QUESTIONS,
  QuestionnaireSectionDefinition,
  QuestionnaireQuestionDefinition
} from '../../data/questionnaireData';
import { INITIAL_IIR_REQUESTS } from '../../data/iirData';
import {
  fetchQuestionnaireState,
  saveQuestionnaireAnswers,
  submitQuestionnaire,
  saveQuestionnaireAuditorNotes,
  requestEditAccessQuestionnaire,
  reviewEditAccessQuestionnaire,
  customizeQuestionnaire,
  getAuthHeaders
} from '../../services/questionnaireApiClient';
import {
  AuthoritativeQuestionnaireState,
  QuestionnaireAnswerItem,
  QuestionnaireAuditorNoteItem
} from '../../services/questionnaireService';
import { UserSession } from '../AuthModal';
import { EngagementWorkspaceActionBar } from '../EngagementWorkspaceActionBar';
import { executeEngagementPush } from '../../services/unifiedEngagementPush';
import { getDistributorsForClient } from '../../data/clientsAndDistributors';

interface BusinessQuestionnaireViewProps {
  selectedClient: string;
  selectedDistributor: string;
  currentUser: UserSession | null;
  onNavigateToIRL?: (refNumber?: string) => void;
}

export const BusinessQuestionnaireView: React.FC<BusinessQuestionnaireViewProps & { currentUser: any }> = ({
  selectedClient,
  selectedDistributor,
  currentUser,
  onNavigateToIRL
}) => {
  const isDistributor = currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor');
  const isAuditor = !isDistributor;

  // Active section index (0-indexed)
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // State loaded from authoritative Supabase API
  const [questionnaireState, setQuestionnaireState] = useState<AuthoritativeQuestionnaireState | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<string, QuestionnaireAnswerItem>>({});
  const [localAuditorNotes, setLocalAuditorNotes] = useState<Record<string, QuestionnaireAuditorNoteItem>>({});

  // Loading & Sync status
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // UI helpers
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'unanswered' | 'flagged'>('all');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState<boolean>(false);
  const [customSectionsDraft, setCustomSectionsDraft] = useState<any[]>([]);
  const [isEditRequesting, setIsEditRequesting] = useState<boolean>(false);
  const [isEditReviewing, setIsEditReviewing] = useState<boolean>(false);
  const [isRequestEditModalOpen, setIsRequestEditModalOpen] = useState<boolean>(false);
  const [editRequestReason, setEditRequestReason] = useState<string>("");
  const [isReviewEditModalOpen, setIsReviewEditModalOpen] = useState<boolean>(false);

  // Unified Push State
  const activeDistributors = useMemo(() => getDistributorsForClient(selectedClient), [selectedClient]);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushToast, setPushToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Evidence Attachment Preview Modal State
  interface AttachmentPreviewState {
    isOpen: boolean;
    fileId: string;
    fileName: string;
    fileSizeMB?: number;
    mimeType?: string;
    blobUrl?: string;
    textContent?: string;
    htmlContent?: string;
    isLoading: boolean;
    error?: string;
    isUnsupported?: boolean;
    attachment?: any;
  }
  const [previewModal, setPreviewModal] = useState<AttachmentPreviewState | null>(null);

  const showPushToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setPushToast({ message, type });
    setTimeout(() => setPushToast(null), 5000);
  };
  const showToast = showPushToast;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Moved below

  // Load state from API
  const loadState = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchQuestionnaireState(
        selectedClient,
        selectedDistributor,
        'eng-101',
        currentUser?.role,
        currentUser?.organization
      );

      if (res.success && res.state) {
        setQuestionnaireState(res.state);
        setLocalAnswers(res.state.answers || {});
        if (res.state.auditorNotes) {
          setLocalAuditorNotes(res.state.auditorNotes);
        }
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        setErrorMessage(res.error || 'Unable to load authoritative state from Supabase.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with server.');
    } finally {
      setIsLoading(false);
    }
  };


  const activeSections = useMemo(() => {
    return questionnaireState?.customSections || BUSINESS_QUESTIONNAIRE_SECTIONS;
  }, [questionnaireState]);

  const activeSection = activeSections[activeSectionIdx] || activeSections[0];

  const handleRequestEditAccess = async () => {
    if (!questionnaireState || isEditRequesting) return;
    const trimmed = editRequestReason.trim();
    if (trimmed.length < 50) {
      if (showToast) showToast(`Request reason must be at least 50 characters long (${trimmed.length}/50).`, 'error');
      return;
    }
    setIsEditRequesting(true);
    setSyncStatus('saving');
    try {
      const res = await requestEditAccessQuestionnaire(selectedClient, selectedDistributor, undefined, (currentUser?.email || 'user@example.com'), (currentUser?.name || 'User'), trimmed);
      if (res.success && res.state) {
        setQuestionnaireState(res.state);
        setSyncStatus('synced');
        setLastSyncTime('Just now');
        setIsRequestEditModalOpen(false);
        if (showToast) showToast('Edit access requested successfully.', 'success');
      } else {
        throw new Error(res.error || 'Failed to request edit access');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err.message);
      if (showToast) showToast(err.message, 'error');
    } finally {
      setIsEditRequesting(false);
    }
  };

  const handleReviewEditAccess = async (action: 'APPROVE' | 'REJECT') => {
    if (!questionnaireState || isEditReviewing) return;
    setIsEditReviewing(true);
    setSyncStatus('saving');
    try {
      const res = await reviewEditAccessQuestionnaire(selectedClient, selectedDistributor, undefined, action, (currentUser?.email || 'user@example.com'), (currentUser?.name || 'User'));
      if (res.success && res.state) {
        setQuestionnaireState(res.state);
        setSyncStatus('synced');
        setLastSyncTime('Just now');
        setIsReviewEditModalOpen(false);
      } else {
        throw new Error(res.error || 'Failed to review edit access');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err.message);
    } finally {
      setIsEditReviewing(false);
    }
  };

  const handleSaveCustomization = async (updatedSections: any[]) => {
    if (!questionnaireState) return;
    setSyncStatus('saving');
    try {
      const res = await customizeQuestionnaire(selectedClient, selectedDistributor, undefined, updatedSections, (currentUser?.email || 'user@example.com'), (currentUser?.name || 'User'));
      if (res.success && res.state) {
        setQuestionnaireState(res.state);
        setSyncStatus('synced');
        setLastSyncTime('Just now');
        setIsCustomizeModalOpen(false);
      } else {
        throw new Error(res.error || 'Failed to customize questionnaire');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err.message);
    }
  };

  useEffect(() => {
    loadState();
  }, [selectedClient, selectedDistributor, currentUser?.role, currentUser?.organization]);

  // Section completion counts
  const sectionStats = useMemo(() => {
    return activeSections.map((sec) => {
      let answered = 0;
      let flagged = 0;
      sec.questions.forEach((q) => {
        const ans = localAnswers[q.id];
        if (ans && ans.responseValue && ans.responseValue.trim().length > 0) {
          answered++;
        }
        const note = localAuditorNotes[q.id];
        if (note?.isFlaggedForFollowUp) {
          flagged++;
        }
      });
      const total = sec.questions.length;
      const isComplete = answered === total;
      return {
        sectionId: sec.id,
        answered,
        total,
        flagged,
        isComplete,
        percent: total > 0 ? Math.round((answered / total) * 100) : 0
      };
    });
  }, [localAnswers, localAuditorNotes]);

  // Overall completion
  const overallStats = useMemo(() => {
    const total = TOTAL_BUSINESS_QUESTIONNAIRE_QUESTIONS;
    let answered = 0;
    let flaggedTotal = 0;
    activeSections.forEach((sec) => {
      sec.questions.forEach((q) => {
        const ans = localAnswers[q.id];
        if (ans && ans.responseValue && ans.responseValue.trim().length > 0) {
          answered++;
        }
        const note = localAuditorNotes[q.id];
        if (note?.isFlaggedForFollowUp) {
          flaggedTotal++;
        }
      });
    });
    const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { answered, total, percent, flaggedTotal };
  }, [localAnswers, localAuditorNotes, activeSections]);

  const clarificationCount = useMemo(() => {
    let count = 0;
    Object.values(localAuditorNotes).forEach((note: any) => {
      if (note?.isFlaggedForFollowUp || (note?.followUpNote && note.followUpNote.trim().length > 0)) {
        count++;
      }
    });
    return count || overallStats.flaggedTotal || 0;
  }, [localAuditorNotes, overallStats.flaggedTotal]);

  const handleOpenCustomizeModal = () => {
    const initial = questionnaireState?.customSections && questionnaireState.customSections.length > 0
      ? JSON.parse(JSON.stringify(questionnaireState.customSections))
      : JSON.parse(JSON.stringify(BUSINESS_QUESTIONNAIRE_SECTIONS));
    setCustomSectionsDraft(initial);
    setIsCustomizeModalOpen(true);
  };

  const handlePushToDistributor = async () => {
    setIsPushing(true);
    try {
      const res = await executeEngagementPush({
        tab: 'questionnaire',
        action: 'push_single',
        client: selectedClient,
        targetDistributor: selectedDistributor,
        allDistributors: activeDistributors,
        data: {
          customSections: customSectionsDraft.length > 0 ? customSectionsDraft : questionnaireState?.customSections,
          totalCount: overallStats.total
        },
        currentUser
      });

      if (res.success) {
        showPushToast(`Business Questionnaire pushed to ${selectedDistributor} successfully! (${overallStats.total} questions released)`, 'success');
        loadState();
      } else {
        showPushToast(res.message, 'error');
      }
    } catch (err: any) {
      showPushToast(err.message || 'Push failed', 'error');
    } finally {
      setIsPushing(false);
    }
  };

  const handlePushToAllDistributors = async () => {
    setIsPushing(true);
    try {
      const res = await executeEngagementPush({
        tab: 'questionnaire',
        action: 'push_all',
        client: selectedClient,
        targetDistributor: selectedDistributor,
        allDistributors: activeDistributors,
        data: {
          customSections: customSectionsDraft.length > 0 ? customSectionsDraft : questionnaireState?.customSections,
          totalCount: overallStats.total
        },
        currentUser
      });

      if (res.success) {
        showPushToast(`Business Questionnaire pushed to ALL (${activeDistributors.length}) Distributors! Released for compliance completion.`, 'success');
        loadState();
      } else {
        showPushToast(res.message, 'error');
      }
    } catch (err: any) {
      showPushToast(err.message || 'Push to all failed', 'error');
    } finally {
      setIsPushing(false);
    }
  };

  const handleSendClarificationsBack = async () => {
    if (clarificationCount === 0) return;
    setIsPushing(true);
    try {
      const res = await executeEngagementPush({
        tab: 'questionnaire',
        action: 'send_clarifications',
        client: selectedClient,
        targetDistributor: selectedDistributor,
        allDistributors: activeDistributors,
        clarificationCount,
        currentUser
      });

      if (res.success) {
        showPushToast(`${clarificationCount} question(s) sent back to ${selectedDistributor} with reviewer feedback. Distributor questionnaire unlocked for edits.`, 'success');
        loadState();
      } else {
        showPushToast(res.message, 'error');
      }
    } catch (err: any) {
      showPushToast(err.message || 'Failed to send clarifications back', 'error');
    } finally {
      setIsPushing(false);
    }
  };

  // Save answer handler
  const handleAnswerChange = (questionId: string, value: string, explanation?: string) => {
    if (questionnaireState?.isLocked && isDistributor) return;

    const existing = localAnswers[questionId] || {
      questionId,
      responseValue: '',
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Distributor User'
    };

    const updated: QuestionnaireAnswerItem = {
      ...existing,
      questionId,
      responseValue: value,
      explanation: explanation !== undefined ? explanation : existing.explanation,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Distributor User'
    };

    const newAnswers = {
      ...localAnswers,
      [questionId]: updated
    };

    setLocalAnswers(newAnswers);
  };

  // Explicit Save Draft Button
  const handleSaveDraft = async () => {
    setSyncStatus('saving');
    try {
      const res = await saveQuestionnaireAnswers(
        selectedClient,
        selectedDistributor,
        'eng-101',
        localAnswers,
        currentUser?.email || 'distributor@example.com',
        currentUser?.name || 'Distributor User',
        questionnaireState?.version || 1,
        currentUser?.role,
        currentUser?.organization
      );

      if (res.success && res.state) {
        setQuestionnaireState(res.state);
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        setSyncStatus('error');
        setErrorMessage(res.error || 'Failed to save draft to Supabase.');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err.message || 'Network error saving draft.');
    }
  };

  // Auditor Note Update
  const handleAuditorNoteChange = (
    questionId: string,
    field: keyof QuestionnaireAuditorNoteItem,
    val: any
  ) => {
    const existing = localAuditorNotes[questionId] || {
      questionId,
      internalNotes: '',
      isFlaggedForFollowUp: false,
      followUpNote: '',
      riskRating: 'Low'
    };

    const updated: QuestionnaireAuditorNoteItem = {
      ...existing,
      [field]: val,
      reviewedBy: currentUser?.name || 'Auditor',
      reviewedAt: new Date().toISOString()
    };

    const newNotes = {
      ...localAuditorNotes,
      [questionId]: updated
    };

    setLocalAuditorNotes(newNotes);
  };

  const handleSaveAuditorNotes = async () => {
    setSyncStatus('saving');
    try {
      const res = await saveQuestionnaireAuditorNotes(
        selectedClient,
        selectedDistributor,
        'eng-101',
        localAuditorNotes,
        currentUser?.email || 'auditor@example.com',
        currentUser?.name || 'Audit Lead',
        currentUser?.role || 'Auditor'
      );

      if (res.success) {
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        setSyncStatus('error');
        setErrorMessage(res.error || 'Failed to save auditor notes to Supabase.');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err.message || 'Error saving auditor notes.');
    }
  };

  // Submit Final
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitQuestionnaire(
        selectedClient,
        selectedDistributor,
        'eng-101',
        currentUser?.email || 'distributor@example.com',
        currentUser?.name || 'Distributor User',
        currentUser?.role,
        currentUser?.organization
      );

      if (res.success && res.state) {
        setQuestionnaireState(res.state);
        setIsSubmitModalOpen(false);
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        setErrorMessage(res.error || 'Submission failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error submitting questionnaire.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Business Questionnaire Evidence File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, questionId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQuestionId(questionId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientName', selectedClient || 'Apex Group');
      formData.append('client', selectedClient || 'Apex Group');
      formData.append('distributorName', selectedDistributor || 'Apex Distribution LLC');
      formData.append('distributor', selectedDistributor || 'Apex Distribution LLC');
      formData.append('auditName', 'FY26 Distributor Channel Audit');
      formData.append('requirementId', `BQ-${questionId}`);
      formData.append('uploadedBy', currentUser?.name || 'Distributor User');
      formData.append('isReferenceMaterial', 'false');
      formData.append('documentType', 'EVIDENCE');
      formData.append('documentUsage', 'EVIDENCE');

      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: {
          'x-user-role': currentUser?.role || 'Distributor',
          'x-user-org': currentUser?.organization || selectedDistributor,
          'x-user-email': currentUser?.email || 'distributor@example.com',
          ...getAuthHeaders()
        },
        body: formData
      });

      if (!uploadRes.ok) {
        let errMessage = 'File upload failed.';
        try {
          const errData = await uploadRes.json();
          if (errData.error) errMessage = errData.error;
        } catch (_) {}
        throw new Error(errMessage);
      }

      const data = await uploadRes.json();
      const realStorageId = data.file?.googleDriveFileId || data.file?.id || data.fileId;
      if (!realStorageId) {
        throw new Error(data.error || 'The storage engine did not return a valid file reference.');
      }

      const existing = localAnswers[questionId] || {
        questionId,
        responseValue: '',
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.name || 'Distributor User'
      };

      const newAttachment = {
        id: `att-${Date.now()}`,
        fileName: file.name,
        fileSizeMB: data.file?.fileSizeMB || Number((file.size / (1024 * 1024)).toFixed(2)),
        fileType: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        googleDriveFileId: realStorageId,
        uploadedBy: currentUser?.name || 'Distributor User',
        uploadedDate: new Date().toISOString(),
        webViewLink: data.file?.webViewLink || ''
      };

      const updatedAttachments = [...(existing.attachments || []), newAttachment];
      const updated: QuestionnaireAnswerItem = {
        ...existing,
        attachments: updatedAttachments,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.name || 'Distributor User'
      };

      const newAnswers = {
        ...localAnswers,
        [questionId]: updated
      };
      setLocalAnswers(newAnswers);

      // Auto persist
      await saveQuestionnaireAnswers(
        selectedClient,
        selectedDistributor,
        'eng-101',
        newAnswers,
        currentUser?.email || 'distributor@example.com',
        currentUser?.name || 'Distributor User',
        questionnaireState?.version || 1,
        currentUser?.role,
        currentUser?.organization
      );

      showPushToast(`Uploaded "${file.name}" successfully.`, 'success');
    } catch (err: any) {
      setErrorMessage(`File upload error: ${err.message}`);
      showPushToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingQuestionId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getAttachmentDownloadUrl = (att: any) => {
    const targetId = att?.googleDriveFileId || att?.id || att?.fileName || '';
    const downloadFileName = att?.fileName || 'document';
    const queryParams = new URLSearchParams({
      fileId: targetId,
      fileName: downloadFileName,
      distributor: selectedDistributor || ''
    });
    return `/api/storage/download?${queryParams.toString()}`;
  };

  const handlePreviewAttachment = async (att: any) => {
    const targetId = att.googleDriveFileId || att.id || att.fileName;
    if (!targetId) {
      showPushToast('Invalid or missing file reference.', 'error');
      return;
    }

    const targetFileName = att.fileName || 'document';

    setPreviewModal({
      isOpen: true,
      fileId: targetId,
      fileName: targetFileName,
      fileSizeMB: att.fileSizeMB,
      isLoading: true,
      attachment: att
    });

    try {
      // 1. Try requesting JSON formatted preview first (supports rich HTML for DOCX/XLSX/PPTX and instant base64)
      const queryParams = new URLSearchParams({
        fileId: targetId,
        fileName: targetFileName,
        distributor: selectedDistributor || '',
        format: 'json'
      });
      const res = await fetch(`/api/storage/preview?${queryParams.toString()}`, {
        headers: {
          'x-user-role': currentUser?.role || 'Auditor',
          'x-user-org': currentUser?.organization || selectedDistributor,
          'x-user-email': currentUser?.email || 'auditor@example.com',
          ...getAuthHeaders()
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.html) {
          setPreviewModal(prev => prev ? {
            ...prev,
            isLoading: false,
            mimeType: data.mimeType || 'text/html',
            htmlContent: data.html,
            isUnsupported: false
          } : null);
          return;
        }

        if (data.textContent) {
          setPreviewModal(prev => prev ? {
            ...prev,
            isLoading: false,
            mimeType: data.mimeType || 'text/plain',
            textContent: data.textContent,
            isUnsupported: false
          } : null);
          return;
        }

        if (data.base64Url || data.binaryUrl) {
          setPreviewModal(prev => prev ? {
            ...prev,
            isLoading: false,
            mimeType: data.mimeType || (targetFileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
            blobUrl: data.base64Url || data.binaryUrl,
            isUnsupported: false
          } : null);
          return;
        }
      }

      // 2. Fallback: Fetch direct binary stream
      const binaryParams = new URLSearchParams({
        fileId: targetId,
        fileName: targetFileName,
        distributor: selectedDistributor || ''
      });
      const binaryRes = await fetch(`/api/storage/preview?${binaryParams.toString()}`, {
        headers: {
          'x-user-role': currentUser?.role || 'Auditor',
          'x-user-org': currentUser?.organization || selectedDistributor,
          'x-user-email': currentUser?.email || 'auditor@example.com',
          ...getAuthHeaders()
        }
      });

      if (!binaryRes.ok) {
        let errText = 'Failed to load document preview.';
        try {
          const errJson = await binaryRes.json();
          if (errJson.error) errText = errJson.error;
        } catch (_) {}
        setPreviewModal(prev => prev ? { ...prev, isLoading: false, error: errText } : null);
        return;
      }

      const blob = await binaryRes.blob();
      const contentType = blob.type || '';
      const fileNameLower = targetFileName.toLowerCase();
      const ext = fileNameLower.split('.').pop() || '';

      const isPdf = contentType === 'application/pdf' || ext === 'pdf';
      const isImage = contentType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);
      const isText = contentType.startsWith('text/') || ['txt', 'csv', 'json', 'log', 'md'].includes(ext);
      const isOffice = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext);

      let textContent = '';
      if (isText && !isPdf && !isImage) {
        try {
          textContent = await blob.text();
        } catch (_) {}
      }

      const blobUrl = URL.createObjectURL(blob);
      const isUnsupported = !isPdf && !isImage && !isText && !isOffice;

      setPreviewModal(prev => prev ? {
        ...prev,
        isLoading: false,
        mimeType: contentType,
        blobUrl,
        textContent,
        isUnsupported
      } : null);
    } catch (err: any) {
      setPreviewModal(prev => prev ? {
        ...prev,
        isLoading: false,
        error: err.message || 'An unexpected error occurred while retrieving preview.'
      } : null);
    }
  };

  const handleClosePreview = () => {
    if (previewModal?.blobUrl && previewModal.blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewModal.blobUrl);
    }
    setPreviewModal(null);
  };

  const handleDownloadAttachment = async (att: any) => {
    const targetId = att.googleDriveFileId || att.id || att.fileName;
    if (!targetId) {
      showPushToast('Invalid or missing file reference.', 'error');
      return;
    }

    const downloadFileName = att.fileName || 'Tie_out_Report.docx';
    const downloadUrl = getAttachmentDownloadUrl(att);

    showPushToast(`Downloading "${downloadFileName}"...`, 'info');

    // Method 1: Programmatic link click with target="_blank"
    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', downloadFileName);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
      }, 5000);
    } catch (e) {
      console.warn('Native link trigger note:', e);
    }

    // Method 2: Fetch blob in parallel for environments restricting direct anchor downloads
    try {
      const res = await fetch(downloadUrl, {
        headers: {
          'x-user-role': currentUser?.role || 'Distributor',
          'x-user-org': currentUser?.organization || selectedDistributor,
          'x-user-email': currentUser?.email || 'distributor@example.com',
          ...getAuthHeaders()
        }
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json') && !contentType.includes('text/html')) {
          const blob = await res.blob();
          if (blob.size > 0) {
            const blobUrl = window.URL.createObjectURL(blob);
            const blobLink = document.createElement('a');
            blobLink.href = blobUrl;
            blobLink.download = downloadFileName;
            document.body.appendChild(blobLink);
            blobLink.click();
            // Retain URL alive for 60 seconds so browser download manager can safely complete
            setTimeout(() => {
              window.URL.revokeObjectURL(blobUrl);
              if (document.body.contains(blobLink)) document.body.removeChild(blobLink);
            }, 60000);
          }
        }
      }
    } catch (err: any) {
      console.warn('Blob download fetch note:', err);
    }

    showPushToast(`Downloaded "${downloadFileName}" successfully.`, 'success');
  };

  const handleRemoveAttachment = (questionId: string, attachmentId: string) => {
    const existing = localAnswers[questionId];
    if (!existing || !existing.attachments) return;

    const updatedAttachments = existing.attachments.filter((a) => a.id !== attachmentId);
    const updated: QuestionnaireAnswerItem = {
      ...existing,
      attachments: updatedAttachments,
      lastUpdated: new Date().toISOString()
    };

    setLocalAnswers({
      ...localAnswers,
      [questionId]: updated
    });
  };

  // Filter questions in active section
  const visibleQuestions = useMemo(() => {
    return activeSection.questions.filter((q) => {
      // Search
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchText = q.questionText.toLowerCase().includes(query);
        const matchNum = q.questionNumber.toLowerCase().includes(query);
        const matchGuidance = q.guidance?.toLowerCase().includes(query);
        if (!matchText && !matchNum && !matchGuidance) return false;
      }

      // Filter Mode
      if (filterMode === 'unanswered') {
        const ans = localAnswers[q.id];
        return !ans || !ans.responseValue || ans.responseValue.trim().length === 0;
      }
      if (filterMode === 'flagged') {
        const note = localAuditorNotes[q.id];
        return Boolean(note?.isFlaggedForFollowUp);
      }
      return true;
    });
  }, [activeSection, searchQuery, filterMode, localAnswers, localAuditorNotes]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">

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
                          id: `q-${section.sectionNumber}.${newDraft[sIdx].questions.length + 1}-custom`,
                          sectionId: section.id,
                          questionNumber: `${section.sectionNumber}.${newDraft[sIdx].questions.length + 1}`,
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
                      <div key={q.id} className={`p-4 rounded-lg border ${q.isActive !== false ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
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
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${q.isActive !== false ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
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
                              id={`req-${q.id}`}
                              className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500/20"
                            />
                            <label htmlFor={`req-${q.id}`} className="text-slate-400">Required</label>
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
                              id={`att-${q.id}`}
                              className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500/20"
                            />
                            <label htmlFor={`att-${q.id}`} className="text-slate-400">Allow Attachment</label>
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

      {/* Top Banner / Context Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            {questionnaireState?.isLocked && (
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                  <Lock className="h-3 w-3" /> Submitted & Locked
                </span>
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-400" />
              Business Questionnaire
            </h1>
          </div>

          {/* Sync status & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400 shadow-inner">
              <div
                className={`h-2 w-2 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-400 animate-pulse'
                    : syncStatus === 'saving'
                    ? 'bg-amber-400 animate-spin'
                    : 'bg-rose-400'
                }`}
              />
              <span>
                {syncStatus === 'synced' && `${lastSyncTime}`}
                {syncStatus === 'saving' && 'Saving to Supabase...'}
                {syncStatus === 'error' && 'Sync error (check connection)'}
              </span>
              <button
                onClick={loadState}
                title="Force refresh from Supabase"
                className="hover:text-slate-200 text-slate-500 ml-1 transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isDistributor && !questionnaireState?.isLocked && (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                Submit Questionnaire
              </button>
            )}
            {isDistributor && questionnaireState?.isLocked && questionnaireState?.editAccessStatus !== 'REQUESTED' && (
              <button
                onClick={() => setIsRequestEditModalOpen(true)}
                disabled={isEditRequesting || editRequestReason.trim().length < 50}
                className="flex items-center gap-2 bg-amber-600/90 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Lock className="h-3.5 w-3.5" />
                Request Edit Access
              </button>
            )}
            {isDistributor && questionnaireState?.editAccessStatus === 'REQUESTED' && (
              <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Edit Request Pending
              </span>
            )}

            {isAuditor && (
              <EngagementWorkspaceActionBar
                tab="questionnaire"
                viewRole="Auditor"
                activeDistributorName={selectedDistributor}
                allDistributorsCount={activeDistributors.length}
                clarificationCount={clarificationCount}
                isPushing={isPushing}
                onCustomize={handleOpenCustomizeModal}
                onPushToDistributor={handlePushToDistributor}
                onPushToAllDistributors={handlePushToAllDistributors}
                onSendClarificationsBack={handleSendClarificationsBack}
                extraActions={
                  <button
                    onClick={handleSaveAuditorNotes}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
                    title="Save review decisions and comments"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Save Audit Notes</span>
                  </button>
                }
              />
            )}
          </div>
        </div>

        {isAuditor && questionnaireState?.editAccessStatus === 'REQUESTED' && (
          <div className="mt-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                <Lock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-400">Pending Edit Access Request</h3>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  {selectedDistributor} has requested to unlock this questionnaire to make updates.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsReviewEditModalOpen(true)}
              className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-900/20 flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              Review Request
            </button>
          </div>
        )}

        {/* Push Notification Toast Banner */}
        {pushToast && (
          <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center justify-between ${
            pushToast.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' :
            pushToast.type === 'error' ? 'bg-rose-950/60 border-rose-500/40 text-rose-200' :
            'bg-indigo-950/60 border-indigo-500/40 text-indigo-200'
          }`}>
            <span className="font-medium">{pushToast.message}</span>
            <button onClick={() => setPushToast(null)} className="ml-2 text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Global Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-semibold">Overall Questionnaire Completion:</span>
              <span className="font-bold text-white text-sm">
                {overallStats.answered} / {overallStats.total} answered
              </span>
              <span className="text-indigo-400 font-bold">({overallStats.percent}%)</span>
            </div>
            {isAuditor && overallStats.flaggedTotal > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg font-medium">
                <Flag className="h-3.5 w-3.5" />
                {overallStats.flaggedTotal} Flagged for Follow-up
              </span>
            )}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${overallStats.percent}%` }}
            />
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-100 text-xs underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Left Section Navigation + Right Active Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT SIDEBAR: Section Tree */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Questionnaire Sections
              </span>
              <span className="text-[10px] text-slate-500 font-mono">10 Modules</span>
            </div>

            <div className="space-y-1">
              {activeSections.map((sec, idx) => {
                const stat = sectionStats[idx];
                const isActive = activeSectionIdx === idx;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setActiveSectionIdx(idx);
                      setSelectedQuestionId(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-white text-indigo-600'
                            : stat.isComplete
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {stat.isComplete ? <Check className="h-3 w-3 stroke-[3]" /> : sec.sectionNumber}
                      </span>
                      <span className="truncate">{sec.shortTitle}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isAuditor && stat.flagged > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            isActive
                              ? 'bg-amber-400 text-amber-950'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {stat.flagged}⚑
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isActive
                            ? 'bg-indigo-700 text-white'
                            : stat.isComplete
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-semibold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {stat.isComplete ? '✓ Complete' : `${stat.answered}/${stat.total}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Filter Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-2 text-xs">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search questions & text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 pt-1">
              <button
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
                  filterMode === 'all'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('unanswered')}
                className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
                  filterMode === 'unanswered'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Unanswered
              </button>
              {isAuditor && (
                <button
                  onClick={() => setFilterMode('flagged')}
                  className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
                    filterMode === 'flagged'
                      ? 'bg-rose-600/30 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Flagged
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT: Active Section Questions */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* Section Header Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Section {activeSection.sectionNumber} of {activeSections.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {sectionStats[activeSectionIdx]?.answered} / {activeSection.questions.length} answered
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{activeSection.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{activeSection.description}</p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                disabled={activeSectionIdx === 0}
                onClick={() => setActiveSectionIdx((prev) => Math.max(0, prev - 1))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Prev Section</span>
              </button>
              <button
                disabled={activeSectionIdx === activeSections.length - 1}
                onClick={() => setActiveSectionIdx((prev) => Math.min(activeSections.length - 1, prev + 1))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span className="hidden sm:inline">Next Section</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List of Questions in Active Section */}
          <div className="space-y-4">
            {visibleQuestions.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                <Filter className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold">No questions match your current search or filter.</p>
                <p className="text-xs text-slate-500">Try clearing the search box or switching filters.</p>
              </div>
            ) : (
              visibleQuestions.map((q, qIndex) => {
                if (q.isActive === false && !isAuditor) return null;
                const answer = localAnswers[q.id];
                const auditorNote = localAuditorNotes[q.id];
                const isAnswered = Boolean(answer?.responseValue && answer.responseValue.trim().length > 0);
                const isLocked = questionnaireState?.isLocked && isDistributor && questionnaireState?.editAccessStatus !== 'APPROVED';

                return (
                  <div
                    key={q.id}
                    className={`bg-slate-900 border rounded-2xl p-4 sm:p-6 transition-all space-y-4 shadow-md ${
                      auditorNote?.isFlaggedForFollowUp && isAuditor
                        ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                        : isAnswered
                        ? 'border-slate-800'
                        : 'border-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-2 py-1 rounded-lg shrink-0">
                          {q.questionNumber}
                        </span>
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                            {q.questionText}
                          </h3>
                          {q.guidance && (
                            <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-400 bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                              <HelpCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{q.guidance}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2 shrink-0">
                        {q.isRequired && (
                          <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-1.5 py-0.5 rounded font-semibold">
                            Mandatory
                          </span>
                        )}
                        {isAnswered ? (
                          <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Answered
                          </span>
                        ) : (
                          <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Response Controls (Distributor & Auditor View) */}
                    <div className="space-y-3 pt-2">
                      {/* Yes / No or Yes / No Details */}
                      {(q.responseType === 'yes_no' || q.responseType === 'yes_no_details') && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <button
                              disabled={isLocked}
                              onClick={() => handleAnswerChange(q.id, 'Yes')}
                              className={`flex-1 sm:flex-initial px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                answer?.responseValue === 'Yes'
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              disabled={isLocked}
                              onClick={() => handleAnswerChange(q.id, 'No')}
                              className={`flex-1 sm:flex-initial px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                answer?.responseValue === 'No'
                                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/40'
                                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              No
                            </button>
                          </div>

                          {/* Conditional Details field for Yes/No */}
                          {q.responseType === 'yes_no_details' && (
                            <div className="space-y-1">
                              <label className="text-xs text-slate-400 font-medium">
                                Supporting Details, Dates & Explanation:
                              </label>
                              <textarea
                                disabled={isLocked}
                                rows={3}
                                value={answer?.explanation || ''}
                                onChange={(e) => handleAnswerChange(q.id, answer?.responseValue || '', e.target.value)}
                                placeholder="Enter detailed operational facts, dates, executive owners, or policy references..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Long Text Format */}
                      {q.responseType === 'long_text' && (
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 font-medium">Detailed Written Statement:</label>
                          <textarea
                            disabled={isLocked}
                            rows={4}
                            value={answer?.responseValue || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Provide comprehensive, factual explanation addressing all aspects of the query..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                          />
                        </div>
                      )}

                      {/* Single Line Text */}
                      {q.responseType === 'text' && (
                        <div className="space-y-1">
                          <input
                            type="text"
                            disabled={isLocked}
                            value={answer?.responseValue || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Enter response..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                          />
                        </div>
                      )}

                      {/* Attachments Section */}
                      {q.allowAttachment && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Paperclip className="h-3.5 w-3.5 text-indigo-400" />
                              <span>Supporting Evidence & Documents:</span>
                              {q.suggestedAttachmentType && (
                                <span className="text-[11px] text-slate-500 italic">
                                  (Suggested: {q.suggestedAttachmentType})
                                </span>
                              )}
                            </div>

                            {!isLocked && (
                              <label className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors">
                                <Upload className="h-3 w-3 text-indigo-400" />
                                <span>{uploadingQuestionId === q.id ? 'Uploading...' : 'Upload Evidence'}</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  disabled={uploadingQuestionId === q.id}
                                  onChange={(e) => handleFileUpload(e, q.id)}
                                />
                              </label>
                            )}
                          </div>

                          {/* Uploaded Files list */}
                          {answer?.attachments && answer.attachments.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {answer.attachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 shadow-inner"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                                    <div className="truncate">
                                      <p className="font-semibold text-slate-200 truncate">{att.fileName}</p>
                                      <p className="text-[10px] text-slate-500 font-mono">
                                        {att.fileSizeMB} MB • {att.uploadedBy}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handlePreviewAttachment(att)}
                                      className="p-1 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                      title="Preview document"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    <a
                                      href={getAttachmentDownloadUrl(att)}
                                      download={att.fileName || 'Tie_out_Report.docx'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadAttachment(att);
                                      }}
                                      className="p-1 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center justify-center"
                                      title="Download attachment"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </a>
                                    {!isLocked && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveAttachment(q.id, att.id)}
                                        className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                        title="Remove file"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* AUDITOR WORKPAPER PANEL (STRICTLY HIDDEN FROM DISTRIBUTOR) */}
                      {isAuditor && (
                        <div className="mt-4 pt-3 border-t border-indigo-500/20 bg-indigo-950/20 rounded-xl p-3.5 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-indigo-400" />
                              <span className="text-xs font-bold text-indigo-200">
                                Auditor Review & Workpaper Notes
                              </span>
                              <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                                Internal Only
                              </span>
                            </div>

                            {/* Risk Rating Selector */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">Risk Rating:</span>
                              <select
                                value={auditorNote?.riskRating || 'Low'}
                                onChange={(e) =>
                                  handleAuditorNoteChange(q.id, 'riskRating', e.target.value as any)
                                }
                                className="bg-slate-900 border border-slate-700 text-xs font-semibold rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                              >
                                <option value="Low">Low Risk</option>
                                <option value="Medium">Medium Risk</option>
                                <option value="High">High Risk</option>
                                <option value="Critical">Critical Risk</option>
                              </select>
                            </div>
                          </div>

                          {/* Link to IRL requirement */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-3.5 w-3.5 text-cyan-400" />
                              <span className="text-slate-400">Linked IRL Requirement:</span>
                              <span className="text-cyan-300 font-mono font-semibold">
                                {q.linkedIRLRef ? `IRL Ref ${q.linkedIRLRef}` : 'No direct IRL link'}
                              </span>
                            </div>

                            {q.linkedIRLRef && onNavigateToIRL && (
                              <button
                                onClick={() => onNavigateToIRL(q.linkedIRLRef)}
                                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline"
                              >
                                <span>Jump to IRL {q.linkedIRLRef}</span>
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          {/* Internal Notes textarea */}
                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-400 font-semibold">
                              Internal Audit Evaluation & Findings:
                            </label>
                            <textarea
                              rows={2}
                              value={auditorNote?.internalNotes || ''}
                              onChange={(e) => handleAuditorNoteChange(q.id, 'internalNotes', e.target.value)}
                              placeholder="Record internal testing observations, ledger cross-checks, or corroborating test notes..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Flag for follow up toggle */}
                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                              <input
                                type="checkbox"
                                checked={Boolean(auditorNote?.isFlaggedForFollowUp)}
                                onChange={(e) =>
                                  handleAuditorNoteChange(q.id, 'isFlaggedForFollowUp', e.target.checked)
                                }
                                className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400"
                              />
                              <Flag className="h-3.5 w-3.5 text-amber-400" />
                              <span>Flag for Active Fieldwork Follow-up</span>
                            </label>

                            {auditorNote?.reviewedAt && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                Reviewed: {new Date(auditorNote.reviewedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {auditorNote?.isFlaggedForFollowUp && (
                            <input
                              type="text"
                              value={auditorNote.followUpNote || ''}
                              onChange={(e) => handleAuditorNoteChange(q.id, 'followUpNote', e.target.value)}
                              placeholder="Describe follow-up inquiry or additional documents required..."
                              className="w-full bg-slate-950 border border-amber-500/40 rounded-lg p-2 text-xs text-amber-200 placeholder:text-amber-600 focus:outline-none"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Section Navigation & Save Controls Footer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <button
              disabled={activeSectionIdx === 0}
              onClick={() => {
                setActiveSectionIdx((prev) => Math.max(0, prev - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous Section</span>
            </button>

            <div className="flex items-center gap-2">
              {isDistributor && !questionnaireState?.isLocked && (
                <button
                  onClick={handleSaveDraft}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Save Section Draft
                </button>
              )}

              {activeSectionIdx < activeSections.length - 1 ? (
                <button
                  onClick={() => {
                    handleSaveDraft();
                    setActiveSectionIdx((prev) => Math.min(activeSections.length - 1, prev + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Next Section</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                isDistributor &&
                !questionnaireState?.isLocked && (
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Review & Finalize Submission</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Finalize Questionnaire Submission</h3>
                <p className="text-xs text-slate-400">Official certification on behalf of {selectedDistributor}</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Questions Answered:</span>
                <span className="font-bold text-white">
                  {overallStats.answered} of {overallStats.total} ({overallStats.percent}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Submitting Entity:</span>
                <span className="text-emerald-300 font-semibold">{selectedDistributor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Authoritative Persistence:</span>
                <span className="text-cyan-300 font-mono">Supabase PostgreSQL</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              By submitting, you formally certify that all answers and uploaded evidence are true, accurate, and
              complete. Upon submission, editing will be locked until reviewed by the Audit team.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirm & Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distributor: Request Edit Access Modal */}
      {isRequestEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-amber-900/20 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 rounded-xl shrink-0">
                <Lock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Request Edit Access</h3>
                <p className="text-xs text-amber-200/70 mt-0.5">Unlock questionnaire for updates</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              This will send a request to the Audit team to unlock your Business Questionnaire submission. 
              Once approved, you will be able to make changes to your responses and upload additional evidence.
            </p>

            {/* Reason Textarea with 50-char validation */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-semibold block">Reason for Edit Request (Mandatory, min 50 chars):</label>
                <span className={`font-mono text-[10px] ${
                  editRequestReason.trim().length < 50 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'
                }`}>
                  {editRequestReason.trim().length} / 50 min chars
                </span>
              </div>
              <textarea
                value={editRequestReason}
                onChange={(e) => setEditRequestReason(e.target.value)}
                placeholder="State why responses or documents need updating..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
              {editRequestReason.trim().length > 0 && editRequestReason.trim().length < 50 && (
                <p className="text-[11px] text-amber-400">
                  Please provide at least {50 - editRequestReason.trim().length} more characters explaining your request.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setIsRequestEditModalOpen(false)}
                disabled={isEditRequesting}
                className="px-4 py-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestEditAccess}
                disabled={isEditRequesting || editRequestReason.trim().length < 50}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isEditRequesting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auditor: Review Edit Access Modal */}
      {isReviewEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl shrink-0">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Review Edit Request</h3>
                <p className="text-xs text-slate-400 mt-0.5">From: {selectedDistributor}</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <p className="text-sm text-slate-300 leading-relaxed">
                <span className="font-semibold text-white">{selectedDistributor}</span> has requested that you unlock their 
                Business Questionnaire submission so they can provide updated responses or documentation.
              </p>
              
              {questionnaireState?.editAccessRequestReason && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                  <div className="font-bold text-slate-400 mb-1">Justification Provided:</div>
                  <p className="text-slate-200 whitespace-pre-wrap">{questionnaireState.editAccessRequestReason}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3">
              <button
                onClick={() => setIsReviewEditModalOpen(false)}
                disabled={isEditReviewing}
                className="px-4 py-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors disabled:opacity-50 sm:mr-auto"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleReviewEditAccess('REJECT')}
                disabled={isEditReviewing}
                className="px-4 py-2 border border-rose-500/40 hover:bg-rose-600/20 text-rose-300 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                Reject Request
              </button>

              <button
                onClick={() => handleReviewEditAccess('APPROVE')}
                disabled={isEditReviewing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-emerald-900/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Lock className="h-3.5 w-3.5" />
                Approve & Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Document Preview Modal */}
      {previewModal && previewModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6"
          onClick={handleClosePreview}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                <div className="truncate">
                  <h3 className="text-sm font-bold text-slate-100 truncate">{previewModal.fileName}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {previewModal.fileSizeMB ? `${previewModal.fileSizeMB} MB • ` : ''}
                    {previewModal.attachment?.uploadedBy || 'Evidence Attachment'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {(previewModal.blobUrl || previewModal.htmlContent) && !previewModal.isUnsupported && (
                  <a
                    href={previewModal.blobUrl || `/api/storage/preview?fileId=${encodeURIComponent(previewModal.fileId)}&fileName=${encodeURIComponent(previewModal.fileName)}&distributor=${encodeURIComponent(selectedDistributor || '')}&format=html`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                    title="Open in new tab"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center min-h-[320px] bg-slate-950/40">
              {previewModal.isLoading && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <RefreshCw className="h-7 w-7 text-indigo-400 animate-spin" />
                  <p className="text-xs text-slate-400 font-mono">Loading preview from storage...</p>
                </div>
              )}

              {!previewModal.isLoading && previewModal.error && (
                <div className="max-w-md p-5 bg-rose-950/30 border border-rose-800/60 rounded-xl text-center space-y-3">
                  <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-rose-200">Unable to Preview Document</h4>
                    <p className="text-xs text-rose-300/90 leading-relaxed">{previewModal.error}</p>
                  </div>
                  {previewModal.attachment && (
                    <a
                      href={getAttachmentDownloadUrl(previewModal.attachment)}
                      download={previewModal.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleDownloadAttachment(previewModal.attachment)}
                      className="mt-2 inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Try Direct Download</span>
                    </a>
                  )}
                </div>
              )}

              {!previewModal.isLoading && !previewModal.error && previewModal.isUnsupported && (
                <div className="max-w-md p-6 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-4">
                  <FileText className="h-10 w-10 text-amber-400 mx-auto" />
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-slate-100">Preview Not Available</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Preview is not available for this file type. Please use Download.
                    </p>
                  </div>
                  {previewModal.attachment && (
                    <a
                      href={getAttachmentDownloadUrl(previewModal.attachment)}
                      download={previewModal.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleDownloadAttachment(previewModal.attachment)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-950/50 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download File</span>
                    </a>
                  )}
                </div>
              )}

              {!previewModal.isLoading && !previewModal.error && !previewModal.isUnsupported && (
                <>
                  {previewModal.htmlContent ? (
                    <div className="w-full h-[65vh] p-6 bg-slate-950 rounded-xl border border-slate-800 overflow-auto text-slate-200 text-xs leading-relaxed document-preview-container">
                      <div dangerouslySetInnerHTML={{ __html: previewModal.htmlContent }} />
                    </div>
                  ) : (previewModal.mimeType === 'application/pdf' || previewModal.fileName.toLowerCase().endsWith('.pdf')) ? (
                    <iframe
                      src={previewModal.blobUrl}
                      className="w-full h-[65vh] rounded-xl border border-slate-800 bg-slate-950"
                      title={previewModal.fileName}
                    />
                  ) : (previewModal.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(previewModal.fileName)) ? (
                    <div className="flex items-center justify-center w-full h-[65vh]">
                      <img
                        src={previewModal.blobUrl}
                        alt={previewModal.fileName}
                        className="max-h-[60vh] max-w-full rounded-xl object-contain border border-slate-800 shadow-lg"
                      />
                    </div>
                  ) : previewModal.textContent ? (
                    <pre className="w-full h-[65vh] p-4 bg-slate-950 rounded-xl border border-slate-800 overflow-auto text-xs text-slate-300 font-mono whitespace-pre-wrap">
                      {previewModal.textContent}
                    </pre>
                  ) : (
                    <iframe
                      src={previewModal.blobUrl}
                      className="w-full h-[65vh] rounded-xl border border-slate-800 bg-slate-950"
                      title={previewModal.fileName}
                    />
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
              <a
                href={getAttachmentDownloadUrl(previewModal.attachment || { id: previewModal.fileId, fileName: previewModal.fileName })}
                download={previewModal.fileName}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleDownloadAttachment(previewModal.attachment || { id: previewModal.fileId, fileName: previewModal.fileName })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download File</span>
              </a>

              <button
                type="button"
                onClick={handleClosePreview}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
