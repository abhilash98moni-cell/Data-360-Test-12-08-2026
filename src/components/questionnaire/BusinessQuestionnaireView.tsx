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
  customizeQuestionnaire
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

  // Unified Push State
  const activeDistributors = useMemo(() => getDistributorsForClient(selectedClient), [selectedClient]);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushToast, setPushToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showPushToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setPushToast({ message, type });
    setTimeout(() => setPushToast(null), 5000);
  };

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
    setIsEditRequesting(true);
    setSyncStatus('saving');
    try {
      const res = await requestEditAccessQuestionnaire(selectedClient, selectedDistributor, undefined, (currentUser?.email || 'user@example.com'), (currentUser?.name || 'User'));
      if (res.success && res.state) {
        setQuestionnaireState(res.state);
        setSyncStatus('synced');
        setLastSyncTime('Just now');
      } else {
        throw new Error(res.error || 'Failed to request edit access');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err.message);
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

  // File upload simulation via Google Drive API
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, questionId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQuestionId(questionId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('client', selectedClient);
      formData.append('distributor', selectedDistributor);
      formData.append('requestRef', `BQ-${questionId}`);

      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      });

      const data = await uploadRes.json();
      const existing = localAnswers[questionId] || {
        questionId,
        responseValue: '',
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.name || 'Distributor User'
      };

      const newAttachment = {
        id: `att-${Date.now()}`,
        fileName: file.name,
        fileSizeMB: Number((file.size / (1024 * 1024)).toFixed(2)),
        fileType: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        googleDriveFileId: data.fileId || `gdrive-${Date.now()}`,
        uploadedBy: currentUser?.name || 'Distributor User',
        uploadedDate: new Date().toISOString()
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
    } catch (err: any) {
      setErrorMessage(`File upload error: ${err.message}`);
    } finally {
      setUploadingQuestionId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Engagement Workspace
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium">Audit Protocol BQ-FY26</span>
              {questionnaireState?.isLocked && (
                <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                  <Lock className="h-3 w-3" /> Submitted & Locked
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-400" />
              Business Questionnaire
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Formal compliance, anti-bribery, and third-party risk assessment for{' '}
              <span className="text-emerald-300 font-semibold">{selectedDistributor}</span> under{' '}
              <span className="text-slate-200 font-semibold">{selectedClient}</span>.
            </p>
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
                {syncStatus === 'synced' && `Supabase Authoritative • ${lastSyncTime}`}
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

                                  <div className="flex items-center gap-1">
                                    <a
                                      href={`/api/storage/download/${att.googleDriveFileId || att.id}?fileName=${encodeURIComponent(att.name || 'document.pdf')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-800"
                                      title="Download attachment"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </a>
                                    {!isLocked && (
                                      <button
                                        onClick={() => handleRemoveAttachment(q.id, att.id)}
                                        className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
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
    </div>
  );
};
