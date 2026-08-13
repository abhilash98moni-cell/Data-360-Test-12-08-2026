import React, { useState, useCallback } from 'react';
import { downloadFileFromApi } from '../lib/downloadHelper';
import { 
  IIRRequestItem, 
  IIRFile, 
  IIRComment, 
  IIRAuditTrail, 
  IIRResponseStatus, 
  IIRReviewerStatus,
  ReferenceType,
  AuditorReferenceMaterial,
  ReferenceAccessLog,
  ReferenceMaterialVersion,
  SubQuestion,
  SubQuestionResponse
} from '../types';
import { getItemCompletionDetails, isItemComplete } from '../utils/irlValidation';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload, 
  File, 
  Trash2, 
  Eye, 
  Download, 
  RefreshCw, 
  MessageSquare, 
  Save, 
  Send, 
  Lock, 
  Unlock, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  History, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  HelpCircle, 
  X, 
  Sparkles, 
  AlertTriangle,
  UserCheck,
  CheckSquare,
  Paperclip,
  ShieldAlert,
  ArrowRight,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  Info,
  ExternalLink,
  Layers,
  XCircle,
  Plus,
  CornerDownRight,
  ListPlus,
  GitFork
} from 'lucide-react';
import { CLIENT_TENANTS, getDistributorsForClient } from '../data/clientsAndDistributors';

import { UserSession } from './AuthModal';
import { DistributorVerticalView } from './DistributorVerticalView';

interface InitialInformationRequestViewProps {
  initialRequests: IIRRequestItem[];
  initialAuditTrail: IIRAuditTrail[];
  auditName?: string;
  distributorName?: string;
  auditPeriod?: string;
  dueDate?: string;
  selectedClientProp?: string;
  selectedDistributorProp?: string;
  onDistributorChangeGlobal?: (distributor: string) => void;
  currentUser?: UserSession | null;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

// Real-time Storage Helpers per Client & Distributor
const getIIRStorageKey = (client: string, dist: string) => 
  `data360_iir_reqs_${(client || 'default').replace(/\s+/g, '_')}_${(dist || 'default').replace(/\s+/g, '_')}`;

const getIIRPushedStorageKey = (client: string) => 
  `data360_iir_pushed_${(client || 'default').replace(/\s+/g, '_')}`;

const loadIIRRequestsFromStorage = (client: string, dist: string, fallback: IIRRequestItem[]): IIRRequestItem[] => {
  if (typeof window === 'undefined') return fallback;
  const key = getIIRStorageKey(client, dist);
  const saved = localStorage.getItem(key) || localStorage.getItem('data360_iir_reqs_latest');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => {
          if (item.questionType === 'yes_no_conditional' || item.id === 'iir-6.7') {
            const sub1a = item.subQuestionResponses?.['sub-6.7-1a']?.textResponse;
            // Only clean up legacy pre-populated sample response if present
            if (sub1a === 'Germany, France, Japan, and Singapore') {
              return { ...item, textResponse: '', status: 'Pending', subQuestionResponses: {} };
            }
          }
          return item;
        });
      }
    } catch (err) {
      console.error('Failed to parse saved requests:', err);
    }
  }

  // Fallback search across localStorage for any key starting with data360_iir_reqs_ with user responses
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('data360_iir_reqs_')) {
        const val = localStorage.getItem(k);
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hasResponses = parsed.some(it => !!it.textResponse || (it.uploadedFiles && it.uploadedFiles.length > 0) || (it.subQuestionResponses && Object.keys(it.subQuestionResponses).length > 0));
            if (hasResponses) {
              return parsed;
            }
          }
        }
      }
    }
  } catch (err) {}

  return fallback;
};

const saveIIRRequestsToStorage = (client: string, dist: string, items: IIRRequestItem[]) => {
  if (typeof window === 'undefined') return;
  const key = getIIRStorageKey(client, dist);
  localStorage.setItem(key, JSON.stringify(items));
  localStorage.setItem('data360_iir_reqs_latest', JSON.stringify(items));
  
  // Dispatch custom window event for same-tab reactivity
  window.dispatchEvent(new CustomEvent('data360_iir_sync_event', {
    detail: { client, distributor: dist, requests: items, timestamp: Date.now() }
  }));

  // Dispatch BroadcastChannel for cross-tab reactivity
  try {
    const channel = new BroadcastChannel('data360_iir_sync_channel');
    channel.postMessage({ client, distributor: dist, timestamp: Date.now() });
    channel.close();
  } catch (err) {}
};

const loadIIRPushedDistributorsFromStorage = (client: string, fallback: string[]): string[] => {
  if (typeof window === 'undefined') return fallback;
  const key = getIIRPushedStorageKey(client);
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {}
  }
  return fallback;
};

const saveIIRPushedDistributorsToStorage = (client: string, pushedList: string[]) => {
  if (typeof window === 'undefined') return;
  const key = getIIRPushedStorageKey(client);
  localStorage.setItem(key, JSON.stringify(pushedList));
  window.dispatchEvent(new CustomEvent('data360_iir_pushed_sync_event', {
    detail: { client, pushedList, timestamp: Date.now() }
  }));
};

export const InitialInformationRequestView: React.FC<InitialInformationRequestViewProps> = ({
  initialRequests,
  initialAuditTrail,
  auditName = 'FY26 Distributor Channel & Compliance Audit',
  distributorName: propDistributorName = 'Midwest Trading Co.',
  auditPeriod = 'FY 2025 - Q1 to Q4 (Apr 1, 2025 – Mar 31, 2026)',
  dueDate = 'Aug 25, 2026',
  selectedClientProp = 'Apex Electronics Corp',
  selectedDistributorProp = 'Midwest Trading Co.',
  onDistributorChangeGlobal,
  currentUser,
  isFullScreen = false,
  onToggleFullScreen
}) => {
  // Fullscreen state handler
  const [internalFullScreen, setInternalFullScreen] = useState(false);
  const isFullScreenMode = onToggleFullScreen !== undefined ? isFullScreen : internalFullScreen;
  const toggleFullScreen = onToggleFullScreen || (() => setInternalFullScreen(prev => !prev));

  // Listen for Escape key to exit fullscreen
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreenMode) {
        toggleFullScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreenMode, toggleFullScreen]);

  // Get active list of distributors based on selected client
  const activeDistributors = getDistributorsForClient(selectedClientProp);

  // Master Distributor Selection
  const [selectedDistributorName, setSelectedDistributorName] = useState<string>(
    selectedDistributorProp !== 'All Distributors' ? selectedDistributorProp : (activeDistributors[0]?.name || 'Midwest Trading Co.')
  );

  // Sync state if prop changes
  React.useEffect(() => {
    if (selectedDistributorProp && selectedDistributorProp !== 'All Distributors') {
      setSelectedDistributorName(selectedDistributorProp);
    } else if (activeDistributors.length > 0) {
      setSelectedDistributorName(activeDistributors[0].name);
    }
  }, [selectedDistributorProp, selectedClientProp]);

  const [pushedDistributorNames, setPushedDistributorNames] = useState<string[]>(() =>
    loadIIRPushedDistributorsFromStorage(selectedClientProp, [
      'Midwest Trading Co.', 'Global Health Supplies', 'FoodServ Direct', 'AutoParts Global'
    ])
  );

  const currentDistributor = activeDistributors.find(d => d.name === selectedDistributorName) || {
    id: 'dist-def',
    name: selectedDistributorName || propDistributorName,
    code: 'DIST-8092',
    region: 'Primary Region',
    status: 'Active Audit' as const
  };

  const activeDistributorName = currentDistributor.name;
  const isQuestionnairePushed = pushedDistributorNames.includes(selectedDistributorName);

  // State Management - Loaded dynamically per distributor
  const [requests, setRequests] = useState<IIRRequestItem[]>(() =>
    loadIIRRequestsFromStorage(
      selectedClientProp,
      selectedDistributorProp !== 'All Distributors' ? selectedDistributorProp : (activeDistributors[0]?.name || 'Midwest Trading Co.'),
      initialRequests
    )
  );
  const [auditTrail, setAuditTrail] = useState<IIRAuditTrail[]>(initialAuditTrail);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => new Date().toLocaleTimeString());
  
  // View Role Mode: Auditor Reviewer Mode for Auditors/Admins vs Distributor Portal for Distributors
  const [viewRole, setViewRole] = useState<'Distributor' | 'Auditor'>(() => {
    if (currentUser?.role === 'Distributor') return 'Distributor';
    return 'Auditor';
  });

  // Sync role and distributor name when currentUser changes
  React.useEffect(() => {
    if (currentUser?.role === 'Distributor') {
      setViewRole('Distributor');
      if (currentUser.organization) {
        setSelectedDistributorName(currentUser.organization);
      }
    } else {
      setViewRole('Auditor');
    }
  }, [currentUser]);

  // REAL-TIME SYNC LISTENER ENGINE: Automatically updates requests state when an Auditor or Distributor updates/pushes questions
  React.useEffect(() => {
    const targetDist = selectedDistributorName || (activeDistributors[0]?.name || 'Midwest Trading Co.');
    const loadedReqs = loadIIRRequestsFromStorage(selectedClientProp, targetDist, initialRequests);
    setRequests(loadedReqs);

    const pushed = loadIIRPushedDistributorsFromStorage(selectedClientProp, pushedDistributorNames);
    setPushedDistributorNames(pushed);
    setLastSyncedTime(new Date().toLocaleTimeString());

    // Fetch authoritative state from Supabase PostgreSQL API
    const fetchServerState = async () => {
      try {
        const res = await fetch(`/api/iir/sync?client=${encodeURIComponent(selectedClientProp)}&distributor=${encodeURIComponent(targetDist)}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.found && Array.isArray(data.requests) && data.requests.length > 0) {
            setRequests(data.requests);
            setIsLocked(Boolean(data.isLocked));
            if (data.submissionDate) setSubmissionDate(data.submissionDate);
            saveIIRRequestsToStorage(selectedClientProp, targetDist, data.requests);
          }
        }
      } catch (err) {
        console.warn('Sync from Supabase backend warning:', err);
      }
    };

    fetchServerState();
    fetchEditRequests();

    const handleCustomSync = (e: any) => {
      if (e.detail?.client === selectedClientProp) {
        if (e.detail?.distributor === targetDist && e.detail?.requests) {
          setRequests(e.detail.requests);
          if (e.detail.isLocked !== undefined) setIsLocked(Boolean(e.detail.isLocked));
          if (e.detail.submissionDate) setSubmissionDate(e.detail.submissionDate);
        } else {
          const reloaded = loadIIRRequestsFromStorage(selectedClientProp, targetDist, initialRequests);
          setRequests(reloaded);
        }
        if (e.detail?.pushedList) {
          setPushedDistributorNames(e.detail.pushedList);
        }
        setLastSyncedTime(new Date().toLocaleTimeString());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      const currentKey = getIIRStorageKey(selectedClientProp, targetDist);
      const pushedKey = getIIRPushedStorageKey(selectedClientProp);
      if (e.key === currentKey && e.newValue) {
        try {
          setRequests(JSON.parse(e.newValue));
          setLastSyncedTime(new Date().toLocaleTimeString());
        } catch (err) {}
      }
      if (e.key === pushedKey && e.newValue) {
        try {
          setPushedDistributorNames(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };

    window.addEventListener('data360_iir_sync_event', handleCustomSync);
    window.addEventListener('data360_iir_pushed_sync_event', handleCustomSync);
    window.addEventListener('storage', handleStorageChange);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('data360_iir_sync_channel');
      channel.onmessage = (msg) => {
        if (msg.data?.client === selectedClientProp) {
          const reloaded = loadIIRRequestsFromStorage(selectedClientProp, targetDist, initialRequests);
          setRequests(reloaded);
          setLastSyncedTime(new Date().toLocaleTimeString());
        }
      };
    } catch (err) {}

    return () => {
      window.removeEventListener('data360_iir_sync_event', handleCustomSync);
      window.removeEventListener('data360_iir_pushed_sync_event', handleCustomSync);
      window.removeEventListener('storage', handleStorageChange);
      if (channel) channel.close();
    };
  }, [selectedClientProp, selectedDistributorName]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Form Submission Lock State
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [submissionDate, setSubmissionDate] = useState<string | null>(null);
  const [isSubmittingApi, setIsSubmittingApi] = useState<boolean>(false);

  // Accordion Expand/Collapse State (Category 1 to 6)
  const [expandedCategories, setExpandedCategories] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  // Active Modals / Drawers
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<IIRFile | null>(null);
  const [selectedItemForComments, setSelectedItemForComments] = useState<IIRRequestItem | null>(null);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState<boolean>(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isRequestEditModalOpen, setIsRequestEditModalOpen] = useState<boolean>(false);

  // Stage 3 Edit Request Workflow States
  const [editRequestScope, setEditRequestScope] = useState<'Entire IRL' | 'Specific Requirements'>('Entire IRL');
  const [selectedAffectedRequirementIds, setSelectedAffectedRequirementIds] = useState<string[]>([]);
  const [isSubmittingEditRequest, setIsSubmittingEditRequest] = useState<boolean>(false);
  const [editRequestsList, setEditRequestsList] = useState<any[]>([]);

  // Auditor Review Modal State
  const [isAuditorReviewModalOpen, setIsAuditorReviewModalOpen] = useState<boolean>(false);
  const [selectedEditRequestForReview, setSelectedEditRequestForReview] = useState<any | null>(null);
  const [auditorReviewComment, setAuditorReviewComment] = useState<string>('');
  const [isProcessingAuditorAction, setIsProcessingAuditorAction] = useState<boolean>(false);

  // Fetch Edit Requests List
  const fetchEditRequests = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (selectedClientProp) query.append('client', selectedClientProp);
      if (selectedDistributorName) query.append('distributor', selectedDistributorName);

      const res = await fetch(`/api/iir/edit-requests?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.requests)) {
          setEditRequestsList(data.requests);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch edit requests:', err);
    }
  }, [selectedClientProp, selectedDistributorName]);
  
  // Reference Material Modal States & Logs
  const [selectedItemForReference, setSelectedItemForReference] = useState<IIRRequestItem | null>(null);
  const [referencePreviewActive, setReferencePreviewActive] = useState<boolean>(true);
  const [referenceModalTab, setReferenceModalTab] = useState<'preview' | 'history' | 'logs'>('preview');

  // Questionnaire Customization Modal Reference Material State
  const [qFormSampleEnabled, setQFormSampleEnabled] = useState<boolean>(false);
  const [qFormRefType, setQFormRefType] = useState<ReferenceType>('Sample Data');
  const [qFormRefFileName, setQFormRefFileName] = useState<string>('');
  const [qFormRefFileSize, setQFormRefFileSize] = useState<number>(1.5);
  const [qFormRefFileType, setQFormRefFileType] = useState<string>('Excel');
  const [qFormRefDesc, setQFormRefDesc] = useState<string>('');
  const [qFormRefDisplay, setQFormRefDisplay] = useState<boolean>(true);

  // Reference Material Access Logs
  const [referenceLogs, setReferenceLogs] = useState<ReferenceAccessLog[]>([
    {
      id: 'reflog-1',
      referenceId: 'ref-1.1',
      requirementRef: '1.1',
      user: 'Sarah Jenkins (Audit Lead)',
      userRole: 'Auditor',
      timestamp: '2026-07-20 14:00:00',
      action: 'Uploaded',
      ipAddress: '10.0.4.18',
      details: 'Uploaded initial guidance document for Org Chart'
    },
    {
      id: 'reflog-2',
      referenceId: 'ref-1.1',
      requirementRef: '1.1',
      user: 'John Miller (Distributor Admin)',
      userRole: 'Distributor',
      timestamp: '2026-07-28 09:12:30',
      action: 'Viewed',
      ipAddress: '192.168.1.104',
      details: 'Viewed reference material modal'
    },
    {
      id: 'reflog-3',
      referenceId: 'ref-1.1',
      requirementRef: '1.1',
      user: 'John Miller (Distributor Admin)',
      userRole: 'Distributor',
      timestamp: '2026-07-28 09:13:00',
      action: 'Downloaded',
      ipAddress: '192.168.1.104',
      details: 'Downloaded Org_Chart_Sample_Structure_Guidance.pdf'
    }
  ]);

  // Log Reference Access/Modification Action
  const logReferenceAction = (
    action: ReferenceAccessLog['action'], 
    item: IIRRequestItem, 
    detailsStr?: string
  ) => {
    if (!item.referenceMaterial) return;
    const newLog: ReferenceAccessLog = {
      id: `reflog-${Date.now()}`,
      referenceId: item.referenceMaterial.id,
      requirementRef: item.refNumber,
      user: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : (viewRole === 'Distributor' ? 'John Miller (Distributor Admin)' : 'Sarah Jenkins (Audit Lead)'),
      userRole: currentUser?.role || viewRole,
      timestamp: new Date().toISOString().substring(0, 19).replace('T', ' '),
      action,
      ipAddress: viewRole === 'Distributor' ? '192.168.1.104' : '10.0.4.18',
      auditId: 'AUD-FY26-001',
      distributorName: activeDistributorName,
      details: detailsStr || `${action} reference material for requirement ${item.refNumber}`
    };
    setReferenceLogs(prev => [newLog, ...prev]);
  };

  // Open Reference Material Modal
  const handleOpenReferenceModal = (item: IIRRequestItem) => {
    setSelectedItemForReference(item);
    setReferencePreviewActive(true);
    setReferenceModalTab('preview');
    logReferenceAction('Viewed', item, `User viewed auditor reference material for requirement ${item.refNumber}`);
  };

  // Download Reference Material
  const handleDownloadReferenceMaterial = (item: IIRRequestItem) => {
    if (!item.referenceMaterial) return;
    logReferenceAction('Downloaded', item, `User downloaded ${item.referenceMaterial.fileName}`);
    showToast(`Downloading auditor reference material ${item.referenceMaterial.fileName}...`, 'success');
  };

  // Questionnaire Customization Modal States
  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<IIRRequestItem | null>(null);
  const [qFormRef, setQFormRef] = useState<string>('');
  const [qFormCategory, setQFormCategory] = useState<string>('Distributor General Information');
  const [qFormTitle, setQFormTitle] = useState<string>('');
  const [qFormDescription, setQFormDescription] = useState<string>('');
  const [qFormMandatory, setQFormMandatory] = useState<boolean>(true);
  const [qFormIsYesNoOnly, setQFormIsYesNoOnly] = useState<boolean>(false);

  // Target Distributor Scope selection state: 'selected' | 'all' | specific dist name
  const [qFormTargetScope, setQFormTargetScope] = useState<string>('selected');

  // Advanced Questionnaire Builder States
  const [qFormQuestionType, setQFormQuestionType] = useState<'standard' | 'yes_no_conditional' | 'yes_no_only'>('standard');
  const [qFormAllowDocUpload, setQFormAllowDocUpload] = useState<boolean>(true);
  const [qFormAllowTextResponse, setQFormAllowTextResponse] = useState<boolean>(true);
  const [qFormYesSubQuestions, setQFormYesSubQuestions] = useState<SubQuestion[]>([]);
  const [qFormNoSubQuestions, setQFormNoSubQuestions] = useState<SubQuestion[]>([]);
  const [qFormActiveSubBranch, setQFormActiveSubBranch] = useState<'yes' | 'no'>('yes');

  // Form Inputs in Modals
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [editRequestReason, setEditRequestReason] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Open Edit Questionnaire Modal
  const handleOpenQuestionnaireModal = (itemToEdit?: IIRRequestItem) => {
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setQFormRef(itemToEdit.refNumber);
      setQFormCategory(itemToEdit.category);
      setQFormTitle(itemToEdit.title);
      setQFormDescription(itemToEdit.description);
      setQFormMandatory(itemToEdit.isMandatory);

      const type = itemToEdit.questionType || (itemToEdit.isYesNoOnly || itemToEdit.responseType === 'Yes/No Only' ? 'yes_no_only' : 'standard');
      setQFormQuestionType(type);
      setQFormAllowDocUpload(itemToEdit.allowDocumentUpload !== false);
      setQFormAllowTextResponse(itemToEdit.allowTextResponse !== false);
      setQFormIsYesNoOnly(type === 'yes_no_only');
      setQFormYesSubQuestions(itemToEdit.conditionalRules?.yesSubQuestions ? JSON.parse(JSON.stringify(itemToEdit.conditionalRules.yesSubQuestions)) : []);
      setQFormNoSubQuestions(itemToEdit.conditionalRules?.noSubQuestions ? JSON.parse(JSON.stringify(itemToEdit.conditionalRules.noSubQuestions)) : []);
      setQFormActiveSubBranch('yes');

      if (itemToEdit.sampleMaterialEnabled && itemToEdit.referenceMaterial) {
        setQFormSampleEnabled(true);
        setQFormRefType(itemToEdit.referenceMaterial.referenceType || 'Sample Data');
        setQFormRefFileName(itemToEdit.referenceMaterial.fileName);
        setQFormRefFileSize(itemToEdit.referenceMaterial.fileSizeMB);
        setQFormRefFileType(itemToEdit.referenceMaterial.fileType);
        setQFormRefDesc(itemToEdit.referenceMaterial.description);
        setQFormRefDisplay(itemToEdit.referenceMaterial.displayToDistributor);
      } else {
        setQFormSampleEnabled(false);
        setQFormRefType('Sample Data');
        setQFormRefFileName('');
        setQFormRefFileSize(1.5);
        setQFormRefFileType('Excel');
        setQFormRefDesc('');
        setQFormRefDisplay(true);
      }
    } else {
      setEditingItem(null);
      const nextRefNum = `1.${requests.length + 1}`;
      setQFormRef(nextRefNum);
      setQFormCategory('Distributor General Information');
      setQFormTitle('');
      setQFormDescription('');
      setQFormMandatory(true);
      setQFormQuestionType('standard');
      setQFormAllowDocUpload(true);
      setQFormAllowTextResponse(true);
      setQFormIsYesNoOnly(false);
      setQFormYesSubQuestions([]);
      setQFormNoSubQuestions([]);
      setQFormActiveSubBranch('yes');

      setQFormSampleEnabled(false);
      setQFormRefType('Sample Data');
      setQFormRefFileName('');
      setQFormRefFileSize(1.5);
      setQFormRefFileType('Excel');
      setQFormRefDesc('');
      setQFormRefDisplay(true);
    }
    setIsQuestionnaireModalOpen(true);
  };

  // Sub-question builder helpers
  const handleAddSubQuestion = (branch: 'yes' | 'no') => {
    const list = branch === 'yes' ? qFormYesSubQuestions : qFormNoSubQuestions;
    const count = list.length + 1;
    const refCode = branch === 'yes' ? `1${String.fromCharCode(64 + count)}` : `2${String.fromCharCode(64 + count)}`;
    const newSub: SubQuestion = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      refCode,
      title: branch === 'yes' ? `Sub-question ${count} (for YES answer)` : `Sub-question ${count} (for NO answer)`,
      description: 'Specific requirement or prompt for distributor...',
      responseFormat: 'text',
      options: ['Option 1', 'Option 2', 'Option 3'],
      isMandatory: true
    };

    if (branch === 'yes') {
      setQFormYesSubQuestions(prev => [...prev, newSub]);
    } else {
      setQFormNoSubQuestions(prev => [...prev, newSub]);
    }
  };

  const handleUpdateSubQuestion = (branch: 'yes' | 'no', index: number, fields: Partial<SubQuestion>) => {
    if (branch === 'yes') {
      setQFormYesSubQuestions(prev => prev.map((q, i) => i === index ? { ...q, ...fields } : q));
    } else {
      setQFormNoSubQuestions(prev => prev.map((q, i) => i === index ? { ...q, ...fields } : q));
    }
  };

  const handleDeleteSubQuestion = (branch: 'yes' | 'no', index: number) => {
    if (branch === 'yes') {
      setQFormYesSubQuestions(prev => prev.filter((_, i) => i !== index));
    } else {
      setQFormNoSubQuestions(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Wrapper helper to update requests state AND persist/broadcast sync events
  const setRequestsAndSave = (updater: IIRRequestItem[] | ((prev: IIRRequestItem[]) => IIRRequestItem[])) => {
    setRequests(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveIIRRequestsToStorage(selectedClientProp, selectedDistributorName, next);
      return next;
    });
  };

  // Sub-question Response Handlers for Distributor
  const handleSubQuestionTextChange = (itemId: string, subQuestionId: string, val: string) => {
    if (isLocked && viewRole === 'Distributor') return;
    setRequestsAndSave(prev => prev.map(item => {
      if (item.id === itemId) {
        const existingResp = item.subQuestionResponses?.[subQuestionId] || { subQuestionId };
        const updatedResponses = {
          ...(item.subQuestionResponses || {}),
          [subQuestionId]: {
            ...existingResp,
            textResponse: val
          }
        };
        const updatedItem = {
          ...item,
          status: 'In Progress' as IIRResponseStatus,
          subQuestionResponses: updatedResponses,
          lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ')
        };
        updatedItem.status = isItemComplete(updatedItem) ? 'Completed' : 'In Progress';
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubQuestionOptionChange = (itemId: string, subQuestionId: string, option: string) => {
    if (isLocked && viewRole === 'Distributor') return;
    setRequestsAndSave(prev => prev.map(item => {
      if (item.id === itemId) {
        const existingResp = item.subQuestionResponses?.[subQuestionId] || { subQuestionId };
        const updatedResponses = {
          ...(item.subQuestionResponses || {}),
          [subQuestionId]: {
            ...existingResp,
            selectedOption: option
          }
        };
        const updatedItem = {
          ...item,
          status: 'In Progress' as IIRResponseStatus,
          subQuestionResponses: updatedResponses,
          lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ')
        };
        updatedItem.status = isItemComplete(updatedItem) ? 'Completed' : 'In Progress';
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubQuestionFileUpload = async (itemId: string, subQuestionId: string, fileList: FileList | null) => {
    if (isLocked && viewRole === 'Distributor') return;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const fileExt = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const fileSizeMB = Math.round((file.size / (1024 * 1024)) * 10) / 10 || 1.2;

    showToast(`Uploading "${file.name}" to Google Drive folder...`, 'info');

    let driveFileId = `file-sub-${Date.now()}`;
    let webViewLink = '';
    let folderPath = '';

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientName', selectedClientProp || 'Apex Group');
      formData.append('auditName', auditName || 'FY26 Distributor Channel Audit');
      formData.append('distributorName', selectedDistributorName || 'Distributor');
      formData.append('requirementId', `${itemId}-${subQuestionId}`);
      formData.append('uploadedBy', currentUser?.name || (viewRole === 'Distributor' ? 'Distributor Admin' : 'Auditor'));
      formData.append('isReferenceMaterial', 'false');

      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.file) {
        driveFileId = data.file.googleDriveFileId || driveFileId;
        webViewLink = data.file.webViewLink || '';
        folderPath = data.file.folderPath || '';
      }
    } catch (uploadErr) {
      console.warn('Backend storage upload warning:', uploadErr);
    }

    const newFile: IIRFile = {
      id: driveFileId,
      evidenceId: `EVD-SUB-${Math.floor(100 + Math.random() * 900)}`,
      fileName: file.name,
      fileSizeMB,
      fileType: fileExt,
      uploadedBy: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'John Miller (Distributor Admin)',
      uploadDate: new Date().toISOString().substring(0, 19).replace('T', ' '),
      version: 1,
      hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      status: 'Uploaded',
      webViewLink,
      folderPath
    };

    setRequestsAndSave(prev => prev.map(item => {
      if (item.id === itemId) {
        const existingResp = item.subQuestionResponses?.[subQuestionId] || { subQuestionId };
        const existingFiles = existingResp.uploadedFiles || [];
        const updatedResponses = {
          ...(item.subQuestionResponses || {}),
          [subQuestionId]: {
            ...existingResp,
            uploadedFiles: [...existingFiles, newFile]
          }
        };
        const updatedItem = {
          ...item,
          status: 'In Progress' as IIRResponseStatus,
          subQuestionResponses: updatedResponses,
          lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ')
        };
        updatedItem.status = isItemComplete(updatedItem) ? 'Completed' : 'In Progress';
        return updatedItem;
      }
      return item;
    }));
    showToast(`Uploaded "${file.name}" to Google Drive folder: ${folderPath || 'Data360_Test'}`, 'success');
  };

  const handleSubQuestionFileDelete = (itemId: string, subQuestionId: string, fileId: string) => {
    if (isLocked && viewRole === 'Distributor') return;
    setRequestsAndSave(prev => prev.map(item => {
      if (item.id === itemId) {
        const existingResp = item.subQuestionResponses?.[subQuestionId];
        if (!existingResp) return item;
        const updatedFiles = (existingResp.uploadedFiles || []).filter(f => f.id !== fileId);
        const updatedResponses = {
          ...(item.subQuestionResponses || {}),
          [subQuestionId]: {
            ...existingResp,
            uploadedFiles: updatedFiles
          }
        };
        const updatedItem = {
          ...item,
          subQuestionResponses: updatedResponses,
          lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ')
        };
        updatedItem.status = isItemComplete(updatedItem) ? 'Completed' : 'In Progress';
        return updatedItem;
      }
      return item;
    }));
    showToast('File removed from sub-question requirement.', 'info');
  };

  // Save / Add Questionnaire Item
  const handleSaveQuestionnaireItem = () => {
    if (!qFormTitle.trim() || !qFormDescription.trim()) {
      showToast('Please provide a title and description for the request item.', 'error');
      return;
    }

    const categoryMap: Record<string, number> = {
      'Distributor General Information': 1,
      'Financial Information': 2,
      'Customer Information': 3,
      'Accounts Payable': 4,
      'Healthcare Professional Interactions': 5,
      'Other Information': 6
    };

    const catNum = categoryMap[qFormCategory] || 1;

    let refMat: AuditorReferenceMaterial | undefined = undefined;
    if (qFormSampleEnabled) {
      const currentRef = editingItem?.referenceMaterial;
      const fileNameToUse = qFormRefFileName.trim() || `${qFormTitle.trim().replace(/\s+/g, '_')}_Sample.${qFormRefFileType === 'PDF' ? 'pdf' : 'xlsx'}`;
      const isUpdated = currentRef && (currentRef.fileName !== fileNameToUse || currentRef.description !== qFormRefDesc || currentRef.referenceType !== qFormRefType);
      const newVerNum = isUpdated ? currentRef.fileVersion + 1 : (currentRef?.fileVersion || 1);
      
      const prevHistory = currentRef?.versionHistory || [];
      const updatedHistory: ReferenceMaterialVersion[] = (isUpdated && currentRef) ? [
        {
          version: currentRef.fileVersion,
          fileName: currentRef.fileName,
          fileSizeMB: currentRef.fileSizeMB,
          fileType: currentRef.fileType,
          uploadDate: currentRef.uploadDate,
          uploadedBy: currentRef.uploadedBy,
          description: currentRef.description
        },
        ...prevHistory
      ] : prevHistory;

      refMat = {
        id: currentRef?.id || `ref-${Date.now()}`,
        tenant: selectedClientProp,
        client: selectedClientProp,
        auditId: 'AUD-FY26-001',
        requirementId: editingItem?.id || `req-${Date.now()}`,
        requirementVersion: 1,
        referenceType: qFormRefType,
        fileName: fileNameToUse,
        fileSizeMB: qFormRefFileSize || 1.5,
        fileType: qFormRefFileType,
        description: qFormRefDesc || 'Use this sample as a reference for the required format and fields.',
        uploadedBy: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Sarah Jenkins (Audit Lead)',
        uploadDate: new Date().toISOString().substring(0, 19).replace('T', ' '),
        fileVersion: newVerNum,
        status: 'Active',
        displayToDistributor: qFormRefDisplay,
        versionHistory: updatedHistory
      };
    }

    const isYesNoOnly = qFormQuestionType === 'yes_no_only';
    const isYesNoConditional = qFormQuestionType === 'yes_no_conditional';
    
    let respType = 'File + text';
    if (isYesNoOnly) respType = 'Yes/No Only';
    else if (isYesNoConditional) respType = 'Yes/No Conditional';
    else if (qFormAllowDocUpload && qFormAllowTextResponse) respType = 'File + text';
    else if (qFormAllowDocUpload) respType = 'File only';
    else respType = 'Text only';

    const targetDistName = qFormTargetScope === 'selected' ? selectedDistributorName : qFormTargetScope;

    if (qFormTargetScope === 'all') {
      // Apply to all distributors under this client
      const newReqId = editingItem?.id || `req-${Date.now()}`;
      activeDistributors.forEach(d => {
        const existingReqs = loadIIRRequestsFromStorage(selectedClientProp, d.name, initialRequests);
        let updatedList: IIRRequestItem[];
        if (editingItem) {
          updatedList = existingReqs.map(item => {
            if (item.id === editingItem.id) {
              return {
                ...item,
                refNumber: qFormRef,
                category: qFormCategory,
                categoryNumber: catNum,
                title: qFormTitle,
                description: qFormDescription,
                isMandatory: qFormMandatory,
                questionType: qFormQuestionType,
                allowDocumentUpload: qFormQuestionType === 'standard' ? qFormAllowDocUpload : false,
                allowTextResponse: qFormQuestionType === 'standard' ? qFormAllowTextResponse : false,
                isYesNoOnly,
                responseType: respType,
                conditionalRules: isYesNoConditional ? {
                  yesSubQuestions: qFormYesSubQuestions,
                  noSubQuestions: qFormNoSubQuestions
                } : undefined,
                sampleMaterialEnabled: qFormSampleEnabled,
                referenceMaterial: refMat,
                lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ')
              };
            }
            return item;
          });
        } else {
          const newItem: IIRRequestItem = {
            id: newReqId,
            refNumber: qFormRef || `${catNum}.${existingReqs.length + 1}`,
            category: qFormCategory,
            categoryNumber: catNum,
            title: qFormTitle,
            description: qFormDescription,
            isMandatory: qFormMandatory,
            questionType: qFormQuestionType,
            allowDocumentUpload: qFormQuestionType === 'standard' ? qFormAllowDocUpload : false,
            allowTextResponse: qFormQuestionType === 'standard' ? qFormAllowTextResponse : false,
            isYesNoOnly,
            responseType: respType,
            conditionalRules: isYesNoConditional ? {
              yesSubQuestions: qFormYesSubQuestions,
              noSubQuestions: qFormNoSubQuestions
            } : undefined,
            allowedFileTypes: ['PDF', 'XLSX', 'DOCX'],
            maxSizeMB: 25,
            status: 'Pending',
            reviewerStatus: 'Pending Review',
            textResponse: '',
            noUploadExplanation: '',
            uploadedFiles: [],
            comments: [],
            sampleMaterialEnabled: qFormSampleEnabled,
            referenceMaterial: refMat,
            lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ')
          };
          updatedList = [...existingReqs, newItem];
        }
        saveIIRRequestsToStorage(selectedClientProp, d.name, updatedList);
      });

      // Automatically mark all distributors as pushed when pushing to all
      const allDistNames = activeDistributors.map(d => d.name);
      const updatedPushed = Array.from(new Set([...pushedDistributorNames, ...allDistNames]));
      setPushedDistributorNames(updatedPushed);
      saveIIRPushedDistributorsToStorage(selectedClientProp, updatedPushed);

      // Reload current distributor state
      const reloadedCurrent = loadIIRRequestsFromStorage(selectedClientProp, selectedDistributorName, initialRequests);
      setRequests(reloadedCurrent);
      addAuditLog('Response Edited', `Auditor saved requirement ${qFormRef} to all ${activeDistributors.length} distributor accounts.`);
      showToast(`Requirement ${qFormRef} synced across ALL ${activeDistributors.length} distributor accounts in real time!`, 'success');

    } else {
      // Target specific distributor
      const currentTargetReqs = loadIIRRequestsFromStorage(selectedClientProp, targetDistName, initialRequests);
      let updatedList: IIRRequestItem[];

      if (editingItem) {
        updatedList = currentTargetReqs.map(item => {
          if (item.id === editingItem.id) {
            const updatedItem: IIRRequestItem = {
              ...item,
              refNumber: qFormRef,
              category: qFormCategory,
              categoryNumber: catNum,
              title: qFormTitle,
              description: qFormDescription,
              isMandatory: qFormMandatory,
              questionType: qFormQuestionType,
              allowDocumentUpload: qFormQuestionType === 'standard' ? qFormAllowDocUpload : false,
              allowTextResponse: qFormQuestionType === 'standard' ? qFormAllowTextResponse : false,
              isYesNoOnly,
              responseType: respType,
              conditionalRules: isYesNoConditional ? {
                yesSubQuestions: qFormYesSubQuestions,
                noSubQuestions: qFormNoSubQuestions
              } : undefined,
              sampleMaterialEnabled: qFormSampleEnabled,
              referenceMaterial: refMat,
              lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ')
            };
            if (qFormSampleEnabled && refMat) {
              logReferenceAction('Uploaded', updatedItem, `Auditor configured reference material (${refMat.fileName}) for requirement ${qFormRef}`);
            }
            return updatedItem;
          }
          return item;
        });
        addAuditLog('Response Edited', `Auditor modified request item ${qFormRef} for distributor ${targetDistName}: ${qFormTitle}`);
        showToast(`Request item ${qFormRef} updated and synced to ${targetDistName}!`, 'success');
      } else {
        const newReqId = `req-${Date.now()}`;
        if (refMat) {
          refMat.requirementId = newReqId;
        }
        const newItem: IIRRequestItem = {
          id: newReqId,
          refNumber: qFormRef || `${catNum}.${currentTargetReqs.length + 1}`,
          category: qFormCategory,
          categoryNumber: catNum,
          title: qFormTitle,
          description: qFormDescription,
          isMandatory: qFormMandatory,
          questionType: qFormQuestionType,
          allowDocumentUpload: qFormQuestionType === 'standard' ? qFormAllowDocUpload : false,
          allowTextResponse: qFormQuestionType === 'standard' ? qFormAllowTextResponse : false,
          isYesNoOnly,
          responseType: respType,
          conditionalRules: isYesNoConditional ? {
            yesSubQuestions: qFormYesSubQuestions,
            noSubQuestions: qFormNoSubQuestions
          } : undefined,
          allowedFileTypes: ['PDF', 'XLSX', 'DOCX'],
          maxSizeMB: 25,
          status: 'Pending',
          reviewerStatus: 'Pending Review',
          textResponse: '',
          noUploadExplanation: '',
          uploadedFiles: [],
          comments: [],
          sampleMaterialEnabled: qFormSampleEnabled,
          referenceMaterial: refMat,
          lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ')
        };
        updatedList = [...currentTargetReqs, newItem];
        if (qFormSampleEnabled && refMat) {
          logReferenceAction('Uploaded', newItem, `Auditor attached reference material (${refMat.fileName}) to new requirement ${newItem.refNumber}`);
        }
        addAuditLog('Response Edited', `Auditor added new request item ${newItem.refNumber} for distributor ${targetDistName}: ${newItem.title}`);
        showToast(`New requirement ${newItem.refNumber} added and synced in real-time to ${targetDistName}!`, 'success');
      }

      saveIIRRequestsToStorage(selectedClientProp, targetDistName, updatedList);

      // Auto-mark target distributor as pushed so it appears in portal
      if (!pushedDistributorNames.includes(targetDistName)) {
        const nextPushed = [...pushedDistributorNames, targetDistName];
        setPushedDistributorNames(nextPushed);
        saveIIRPushedDistributorsToStorage(selectedClientProp, nextPushed);
      }

      if (targetDistName !== selectedDistributorName) {
        setSelectedDistributorName(targetDistName);
      }
      setRequests(updatedList);
    }

    // Clear active search/filters and expand category so new/edited item is visible immediately
    setSearchQuery('');
    setStatusFilter('All');
    setCategoryFilter('All');
    if (!expandedCategories.includes(catNum)) {
      setExpandedCategories(prev => [...prev, catNum]);
    }

    setLastSyncedTime(new Date().toLocaleTimeString());
    setIsQuestionnaireModalOpen(false);
  };

  // Delete Questionnaire Item
  const handleDeleteQuestionnaireItem = (itemId: string) => {
    const itemToDelete = requests.find(r => r.id === itemId);
    const updated = requests.filter(r => r.id !== itemId);
    setRequests(updated);
    saveIIRRequestsToStorage(selectedClientProp, selectedDistributorName, updated);
    if (itemToDelete) {
      addAuditLog('Response Edited', `Auditor removed request item ${itemToDelete.refNumber}`);
      showToast(`Item ${itemToDelete.refNumber} deleted and synced.`, 'info');
    }
  };

  // Push Questionnaire to Selected Distributor
  const handlePushQuestionnaireToDistributor = () => {
    let updatedPushed = [...pushedDistributorNames];
    if (!updatedPushed.includes(selectedDistributorName)) {
      updatedPushed.push(selectedDistributorName);
      setPushedDistributorNames(updatedPushed);
      saveIIRPushedDistributorsToStorage(selectedClientProp, updatedPushed);
    }

    // Save current requests for this distributor
    saveIIRRequestsToStorage(selectedClientProp, selectedDistributorName, requests);
    setIsLocked(false);

    addAuditLog('Submitted', `Auditor pushed customized questionnaire (${requests.length} items) to distributor ${activeDistributorName}`);
    showToast(`Questionnaire pushed and synced in real-time to ${activeDistributorName}! (${requests.length} active items)`, 'success');
  };

  // Push Questionnaire to ALL Distributors under Client
  const handlePushQuestionnaireToAllDistributors = () => {
    const allDistNames = activeDistributors.map(d => d.name);
    let updatedPushed = Array.from(new Set([...pushedDistributorNames, ...allDistNames]));
    setPushedDistributorNames(updatedPushed);
    saveIIRPushedDistributorsToStorage(selectedClientProp, updatedPushed);

    allDistNames.forEach(dName => {
      saveIIRRequestsToStorage(selectedClientProp, dName, requests);
    });
    setIsLocked(false);

    addAuditLog('Submitted', `Auditor pushed customized questionnaire (${requests.length} items) to ALL ${allDistNames.length} distributors under ${selectedClientProp}`);
    showToast(`Questionnaire pushed and synced in real-time to ALL ${allDistNames.length} distributors! (${requests.length} active items per account)`, 'success');
  };

  // Push Returned / Clarification Items Back to Distributor
  const handleSendClarificationsBackToDistributor = () => {
    const returnedCount = requests.filter(r => r.reviewerStatus === 'Clarification Required' || r.reviewerStatus === 'Rejected').length;
    if (returnedCount === 0) {
      showToast('No items are currently marked for Clarification or Rejection.', 'info');
      return;
    }

    // Unlock form so distributor can re-edit or re-upload for returned items
    setIsLocked(false);
    
    addAuditLog('Review Status Updated', `Auditor returned ${returnedCount} item(s) back to distributor ${activeDistributorName} requiring clarification or re-upload.`);
    showToast(`${returnedCount} item(s) sent back to ${activeDistributorName} with reviewer notes. Distributor portal unlocked for re-submission.`, 'success');
  };

  // Show Toast helper
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Add Log Entry to Audit Trail
  const addAuditLog = (action: IIRAuditTrail['action'], details: string) => {
    const newLog: IIRAuditTrail = {
      id: `trl-${Date.now()}`,
      action,
      user: viewRole === 'Distributor' ? 'John Miller (Distributor Admin)' : 'Sarah Jenkins (Audit Lead)',
      role: viewRole,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ipAddress: viewRole === 'Distributor' ? '192.168.1.104' : '10.0.4.18',
      details
    };
    setAuditTrail(prev => [newLog, ...prev]);
  };

  // Categories Hierarchy Definition
  const categoryNames = [
    { num: 1, name: 'Distributor General Information' },
    { num: 2, name: 'Financial Information' },
    { num: 3, name: 'Customer Information' },
    { num: 4, name: 'Accounts Payable' },
    { num: 5, name: 'Healthcare Professional Interactions' },
    { num: 6, name: 'Other Information' }
  ];

  // Calculations & Validation Metrics
  const totalItemsCount = requests.length;
  
  const completedItemsCount = requests.filter(isItemComplete).length;
  const overallProgressPercent = Math.round((completedItemsCount / (totalItemsCount || 1)) * 100);

  // Validation Checks: filter mandatory items that are not complete according to canonical rules
  const invalidMandatoryItems = requests.filter(item => Boolean(item.isMandatory ?? item.is_mandatory) && !isItemComplete(item));

  const missingMandatoryCount = invalidMandatoryItems.length;
  const submittedItemsCount = requests.filter(item => item.status === 'Submitted' || item.status === 'Completed' || item.status === 'Accepted').length;
  const clarificationRequiredCount = requests.filter(item => item.reviewerStatus === 'Clarification Required').length;
  const rejectedItemsCount = requests.filter(item => item.reviewerStatus === 'Rejected').length;

  // Toggle Category Accordion
  const toggleCategory = (num: number) => {
    setExpandedCategories(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };  // Handler: Update Text Response
  const handleTextResponseChange = (itemId: string, text: string) => {
    if (isLocked && viewRole === 'Distributor') return;
    setRequestsAndSave(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, textResponse: text, lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ') };
        updated.status = isItemComplete(updated) ? 'Completed' : 'Partially Completed';
        return updated;
      }
      return item;
    }));
  };

  // Handler: Update No Upload Explanation
  const handleExplanationChange = (itemId: string, explanation: string) => {
    if (isLocked && viewRole === 'Distributor') return;
    setRequestsAndSave(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, noUploadExplanation: explanation, lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ') };
        updated.status = isItemComplete(updated) ? 'Completed' : 'Partially Completed';
        return updated;
      }
      return item;
    }));
  };

  // Handler: File Upload to Google Drive Storage
  const handleFileUpload = async (itemId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (isLocked && viewRole === 'Distributor') return;

    const targetItem = requests.find(r => r.id === itemId);
    if (targetItem && (targetItem.isYesNoOnly || targetItem.responseType === 'Yes/No Only')) {
      showToast('Document uploads are disabled for Yes/No question requirements.', 'error');
      return;
    }

    const file = files[0];
    const fileExt = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const fileSizeMB = Math.round((file.size / (1024 * 1024)) * 10) / 10 || 1.2;

    showToast(`Uploading "${file.name}" to Google Drive folder...`, 'info');

    let driveFileId = `file-${Date.now()}`;
    let webViewLink = '';
    let folderPath = '';

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientName', selectedClientProp || 'Apex Group');
      formData.append('auditName', auditName || 'FY26 Distributor Channel Audit');
      formData.append('distributorName', selectedDistributorName || 'Distributor');
      formData.append('requirementId', targetItem?.refNumber || itemId);
      formData.append('uploadedBy', currentUser?.name || (viewRole === 'Distributor' ? 'Distributor Admin' : 'Auditor'));
      formData.append('isReferenceMaterial', 'false');

      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.file) {
        driveFileId = data.file.googleDriveFileId || driveFileId;
        webViewLink = data.file.webViewLink || '';
        folderPath = data.file.folderPath || '';
      }
    } catch (uploadErr) {
      console.warn('Backend storage upload warning:', uploadErr);
    }

    const newFile: IIRFile = {
      id: driveFileId,
      evidenceId: `EVD-${Math.floor(100 + Math.random() * 900)}-UP`,
      fileName: file.name,
      fileSizeMB: fileSizeMB,
      fileType: fileExt,
      uploadedBy: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : (viewRole === 'Distributor' ? 'John Miller (Distributor Admin)' : 'Sarah Jenkins (Auditor)'),
      uploadDate: new Date().toISOString().substring(0, 19).replace('T', ' '),
      version: 1,
      hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      status: 'Uploaded',
      webViewLink,
      folderPath
    };

    setRequestsAndSave(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedFiles = [...item.uploadedFiles, newFile];
        const updated = { 
          ...item, 
          uploadedFiles: updatedFiles, 
          lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ') 
        };
        updated.status = isItemComplete(updated) ? 'Completed' : 'Partially Completed';
        return updated;
      }
      return item;
    }));

    addAuditLog('File Uploaded', `Uploaded ${file.name} (${fileSizeMB} MB) to Google Drive folder: ${folderPath || 'Data360_Test'} for Item ${requests.find(r => r.id === itemId)?.refNumber}`);
    showToast(`File "${file.name}" uploaded to Google Drive folder successfully.`, 'success');
  };

  // Handler: Delete File
  const handleDeleteFile = (itemId: string, fileId: string) => {
    if (isLocked && viewRole === 'Distributor') return;

    let deletedFileName = '';
    setRequestsAndSave(prev => prev.map(item => {
      if (item.id === itemId) {
        const fileToDelete = item.uploadedFiles.find(f => f.id !== fileId);
        if (fileToDelete) deletedFileName = fileToDelete.fileName;
        const remainingFiles = item.uploadedFiles.filter(f => f.id !== fileId);
        const updated = { 
          ...item, 
          uploadedFiles: remainingFiles, 
          lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ') 
        };
        updated.status = isItemComplete(updated) ? 'Completed' : 'Pending';
        return updated;
      }
      return item;
    }));

    addAuditLog('File Deleted', `Deleted file ${deletedFileName} from Item ${requests.find(r => r.id === itemId)?.refNumber}`);
    showToast(`File "${deletedFileName}" removed from request list.`, 'info');
  };

  // Handler: Download Uploaded File
  const handleDownloadUploadedFile = (file: IIRFile) => {
    const targetFileId = file.googleDriveFileId || file.id || file.evidenceId;
    downloadFileFromApi(targetFileId, file.fileName, showToast).then(success => {
      if (success) {
        addAuditLog('File Downloaded', `Downloaded uploaded file: ${file.fileName} (${file.fileSizeMB} MB)`);
      }
    });
  };

  // Handler: Auditor Reviewer Status Change
  const handleReviewerStatusChange = (itemId: string, newReviewerStatus: IIRReviewerStatus, comment?: string) => {
    setRequestsAndSave(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          reviewerStatus: newReviewerStatus,
          status: newReviewerStatus === 'Accepted' ? 'Accepted' : newReviewerStatus === 'Rejected' ? 'Rejected' : 'Clarification Required',
          reviewerComment: comment || item.reviewerComment,
          lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ')
        };
      }
      return item;
    }));

    addAuditLog('Review Status Updated', `Auditor set Item ${requests.find(r => r.id === itemId)?.refNumber} status to "${newReviewerStatus}"`);
    showToast(`Reviewer status updated to "${newReviewerStatus}"`, 'success');
  };

  // Handler: Save Draft
  const handleSaveDraft = () => {
    saveIIRRequestsToStorage(selectedClientProp, selectedDistributorName, requests);
    addAuditLog('Draft Saved', `Saved draft version with ${completedItemsCount} of ${totalItemsCount} requests completed`);
    showToast(`Draft saved successfully at ${new Date().toLocaleTimeString()}. Real-time sync updated.`, 'success');
  };

  // Handler: Final Submission
  const handleFinalSubmit = async () => {
    // Safety check: verify all mandatory items are complete before calling backend API
    const missingItems = requests.filter(item => Boolean(item.isMandatory ?? item.is_mandatory) && !isItemComplete(item));
    if (missingItems.length > 0) {
      showToast(`Submission rejected: ${missingItems.length} mandatory requirement(s) are incomplete.`, 'error');
      return;
    }

    setIsSubmittingApi(true);
    const now = new Date().toISOString().substring(0, 19).replace('T', ' ');
    const updatedRequests: IIRRequestItem[] = requests.map(item => ({
      ...item,
      status: item.reviewerStatus === 'Accepted' ? 'Accepted' : 'Submitted'
    }));

    try {
      const res = await fetch('/api/iir/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: selectedClientProp || 'Apex Electronics Corp',
          distributor: selectedDistributorName || 'Midwest Trading Co.',
          auditId: 'eng-101',
          requests: updatedRequests,
          isLocked: true,
          submissionDate: now,
          submittedBy: currentUser?.name || currentUser?.email || selectedDistributorName
        })
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok || data.success === false) {
        const errorMsg = data.error || `Server error (${res.status}). Submission failed.`;
        showToast(`Submission failed: ${errorMsg}. Your form has NOT been locked. Please try again.`, 'error');
        setIsSubmittingApi(false);
        return;
      }

      // API and Supabase database persistence succeeded!
      setRequestsAndSave(() => updatedRequests);
      setIsLocked(true);
      setSubmissionDate(data.submissionDate || now);
      setIsSubmitModalOpen(false);

      addAuditLog('Submitted', `Final submission completed and stored in Supabase database. Lock engaged. ${completedItemsCount} items submitted.`);
      showToast('Initial Information Request successfully submitted and persisted to Supabase database! Real-time sync engaged.', 'success');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('data360_iir_sync_event', {
          detail: {
            client: selectedClientProp,
            distributor: selectedDistributorName,
            requests: updatedRequests,
            isLocked: true,
            submissionDate: now
          }
        }));
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message || 'Unable to communicate with Supabase server'}. Submission NOT saved.`, 'error');
    } finally {
      setIsSubmittingApi(false);
    }
  };

  // Handler: Request Edit (Distributor API call)
  const handleRequestEdit = async () => {
    const trimmed = editRequestReason.trim();
    if (trimmed.length < 50) {
      showToast(`Request reason must be at least 50 characters long (${trimmed.length}/50).`, 'error');
      return;
    }

    setIsSubmittingEditRequest(true);
    try {
      const res = await fetch('/api/iir/request-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: selectedClientProp || 'Apex Electronics Corp',
          distributor: selectedDistributorName || 'Midwest Trading Co.',
          auditId: 'eng-101',
          scope: editRequestScope,
          affectedRequirements: editRequestScope === 'Specific Requirements' ? selectedAffectedRequirementIds : [],
          reason: trimmed,
          requestedBy: currentUser?.name || currentUser?.email || selectedDistributorName,
          userRole: viewRole
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to submit edit access request.', 'error');
        setIsSubmittingEditRequest(false);
        return;
      }

      showToast('Edit access request submitted to APEX Auditor team for review.', 'success');
      addAuditLog('Edit Requested', `Requested edit access. Scope: ${editRequestScope}. Reason: "${trimmed}"`);
      setEditRequestReason('');
      setSelectedAffectedRequirementIds([]);
      setEditRequestScope('Entire IRL');
      setIsRequestEditModalOpen(false);

      fetchEditRequests();
    } catch (err: any) {
      showToast(`Network error: ${err.message || 'Failed to submit request'}`, 'error');
    } finally {
      setIsSubmittingEditRequest(false);
    }
  };

  // Handler: Direct Unlock (Auditor Action)
  const handleApproveUnlock = async () => {
    const pending = editRequestsList.find(r => r.status === 'PENDING');
    if (pending) {
      setSelectedEditRequestForReview(pending);
      setIsAuditorReviewModalOpen(true);
    } else {
      setIsLocked(false);
      addAuditLog('Edit Approved', 'Auditor unlocked IIR form for Distributor updates');
      showToast('Form unlocked. Distributor can now make changes.', 'success');
    }
  };

  // Handler: Approve Edit Request (Auditor Action API call)
  const handleApproveEditRequest = async (reqId: string) => {
    setIsProcessingAuditorAction(true);
    try {
      const res = await fetch('/api/iir/request-edit/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reqId,
          comment: auditorReviewComment.trim() || 'Edit access approved by APEX Lead Auditor.',
          reviewedBy: currentUser?.name || currentUser?.email || 'Sarah Jenkins (Auditor)',
          userRole: viewRole,
          client: selectedClientProp,
          distributor: selectedDistributorName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to approve edit request.', 'error');
        setIsProcessingAuditorAction(false);
        return;
      }

      setIsLocked(false);
      showToast('Edit access approved! Submission unlocked for Distributor updates.', 'success');
      addAuditLog('Edit Approved', `Auditor approved edit access request ${reqId}. Form unlocked.`);
      setAuditorReviewComment('');
      setSelectedEditRequestForReview(null);
      setIsAuditorReviewModalOpen(false);

      fetchEditRequests();
    } catch (err: any) {
      showToast(`Error approving request: ${err.message}`, 'error');
    } finally {
      setIsProcessingAuditorAction(false);
    }
  };

  // Handler: Reject Edit Request (Auditor Action API call)
  const handleRejectEditRequest = async (reqId: string) => {
    if (!auditorReviewComment.trim()) {
      showToast('A rejection comment/reason is required.', 'error');
      return;
    }

    setIsProcessingAuditorAction(true);
    try {
      const res = await fetch('/api/iir/request-edit/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reqId,
          comment: auditorReviewComment.trim(),
          reviewedBy: currentUser?.name || currentUser?.email || 'Sarah Jenkins (Auditor)',
          userRole: viewRole,
          client: selectedClientProp,
          distributor: selectedDistributorName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to reject edit request.', 'error');
        setIsProcessingAuditorAction(false);
        return;
      }

      showToast('Edit access request rejected. Form remains locked.', 'info');
      addAuditLog('Edit Approved', `Auditor rejected edit request ${reqId}. Reason: "${auditorReviewComment.trim()}"`);
      setAuditorReviewComment('');
      setSelectedEditRequestForReview(null);
      setIsAuditorReviewModalOpen(false);

      fetchEditRequests();
    } catch (err: any) {
      showToast(`Error rejecting request: ${err.message}`, 'error');
    } finally {
      setIsProcessingAuditorAction(false);
    }
  };

  // Handler: Post Threaded Comment
  const handleAddComment = () => {
    if (!newCommentText.trim() || !selectedItemForComments) return;

    const newCmt: IIRComment = {
      id: `cmt-${Date.now()}`,
      author: viewRole === 'Distributor' ? 'John Miller' : 'Sarah Jenkins',
      role: viewRole === 'Distributor' ? 'Distributor' : 'Auditor',
      timestamp: new Date().toISOString().substring(0, 19).replace('T', ' '),
      message: newCommentText.trim()
    };

    setRequests(prev => prev.map(item => {
      if (item.id === selectedItemForComments.id) {
        return {
          ...item,
          comments: [...item.comments, newCmt]
        };
      }
      return item;
    }));

    setSelectedItemForComments(prev => prev ? { ...prev, comments: [...prev.comments, newCmt] } : null);
    setNewCommentText('');
    showToast('Comment posted to thread.', 'success');
  };

  // Filter Requests based on Search & Select Dropdowns
  const filteredRequests = requests.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.refNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Pending' && (!isItemComplete(item) || item.status === 'Pending' || item.status === 'Partially Completed')) ||
      (statusFilter === 'Completed' && (isItemComplete(item) || item.status === 'Completed' || item.status === 'Submitted' || item.status === 'Accepted')) ||
      (statusFilter === 'Submitted' && item.status === 'Submitted') ||
      (statusFilter === 'Missing Docs' && (item.isMandatory && !isItemComplete(item))) ||
      (statusFilter === 'Clarification' && (item.reviewerStatus === 'Clarification Required' || item.status === 'Clarification Required')) ||
      (statusFilter === 'Accepted' && (item.reviewerStatus === 'Accepted' || item.status === 'Accepted'));

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 transition-all animate-bounce-short text-xs font-semibold ${
          toastMessage.type === 'error' ? 'bg-red-950 border-red-500 text-red-200' :
          toastMessage.type === 'info' ? 'bg-blue-950 border-blue-500 text-blue-200' :
          'bg-emerald-950 border-emerald-500 text-emerald-200'
        }`}>
          {toastMessage.type === 'error' ? <AlertTriangle className="h-4 w-4 text-red-400" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* SECTION 1: Top Enterprise Header & Role Access Isolated Switch */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Master Selector Bar (Auditor Dashboard Controls - Strictly Hidden from Distributor) */}
        {viewRole === 'Auditor' && !currentUser?.role?.includes('Distributor') && (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span>Select Distributor under {selectedClientProp}:</span>
              </div>
              <select
                value={selectedDistributorName}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDistributorName(val);
                  if (onDistributorChangeGlobal) {
                    onDistributorChangeGlobal(val);
                  }
                }}
                className="bg-slate-900 border border-slate-700 text-white font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                {activeDistributors.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.region} - {d.code})
                  </option>
                ))}
              </select>
              
              {isQuestionnairePushed ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Questionnaire Pushed & Active
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Draft / Pending Push
                </span>
              )}
            </div>
          </div>
        )}

        {/* Header Main Branding & Title */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg ring-1 ring-white/20 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {activeDistributorName}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {viewRole === 'Distributor' ? 'Document & Information Submission Portal' : 'Audit Request Manager'}
                </span>
                {isLocked ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Locked & Submitted
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Unlock className="h-3 w-3" /> Editing Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span className="text-slate-200 font-semibold">{auditName}</span>
                <span>&bull; Period: <strong className="text-slate-300">{auditPeriod}</strong></span>
                <span>&bull; Submission Due: <strong className="text-amber-300">{dueDate}</strong></span>
              </p>
            </div>
          </div>

          {/* Auditor Quick Actions (Edit Questionnaire & Push) */}
          {viewRole === 'Auditor' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleOpenQuestionnaireModal()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>+ Customize / Add Request Item</span>
              </button>

              <button
                onClick={handlePushQuestionnaireToDistributor}
                className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                title={`Push current questionnaire items to ${activeDistributorName} account`}
              >
                <Send className="h-3.5 w-3.5" />
                <span>Push to {activeDistributorName}</span>
              </button>

              <button
                onClick={handlePushQuestionnaireToAllDistributors}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                title={`Push current questionnaire items to ALL ${activeDistributors.length} distributor accounts`}
              >
                <Send className="h-3.5 w-3.5 text-emerald-200" />
                <span>Push to ALL ({activeDistributors.length}) Distributors</span>
              </button>

              {clarificationRequiredCount > 0 && (
                <button
                  onClick={handleSendClarificationsBackToDistributor}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Send {clarificationRequiredCount} Clarification(s) Back</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Distributor Friendly Non-Intimidating Banner */}
        {viewRole === 'Distributor' && (
          <div className="space-y-3">
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 text-xs text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="font-bold text-white text-sm">Welcome, {activeDistributorName}</p>
                  <p className="text-indigo-300">
                    Please upload the requested operational, financial, and compliance documentation for the review period. You can save your draft at any time and return later before final submission.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 shrink-0 text-indigo-300">
                Client ID: {currentDistributor.code}
              </span>
            </div>

            {/* Notice if Auditor returned items for clarification */}
            {clarificationRequiredCount > 0 && (
              <div className="bg-amber-950/50 border border-amber-500/40 rounded-xl p-3.5 text-xs text-amber-200 flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-100 text-sm">Action Required: {clarificationRequiredCount} Request(s) Returned for Clarification</p>
                    <p className="text-amber-300">
                      The reviewer requested additional information or an updated document. Please check the reviewer comments highlighted in amber below.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Left Progress Bar */}
          <div className="space-y-1.5 min-w-[260px] flex-1">
            <div className="flex justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                <span>IRL Completion Progress ({completedItemsCount} / {totalItemsCount} Requests)</span>
              </span>
              <span className="font-mono text-indigo-400 font-bold">{overallProgressPercent}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-800 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${overallProgressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAuditTrailOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <History className="h-3.5 w-3.5 text-amber-400" />
              <span>Audit Trail ({auditTrail.length})</span>
            </button>

            {viewRole === 'Distributor' && (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={isLocked}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-indigo-300 rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Save Draft</span>
                </button>

                {isLocked ? (
                  <button
                    onClick={() => setIsRequestEditModalOpen(true)}
                    className="px-4 py-2 bg-amber-600/90 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    <span>Request Edit Access</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit Request List</span>
                  </button>
                )}
              </>
            )}

            {viewRole === 'Auditor' && isLocked && (
              <button
                onClick={handleApproveUnlock}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Unlock className="h-3.5 w-3.5" />
                <span>Approve Unlock Request</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 1.5: Stage 3 Request Edit Access Workflow Banners */}
      {viewRole === 'Auditor' && editRequestsList.filter(r => r.status === 'PENDING').length > 0 && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Pending Edit Access Requests</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                {editRequestsList.filter(r => r.status === 'PENDING').length} Pending
              </span>
            </div>
            <button
              onClick={fetchEditRequests}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Requests</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {editRequestsList.filter(r => r.status === 'PENDING').map((req) => (
              <div key={req.id} className="bg-slate-950 border border-amber-500/30 rounded-xl p-3.5 space-y-2 text-xs relative">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400 text-[11px]">{req.id}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
                    {req.status}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-white">{req.distributor} ({req.client})</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    <strong>Scope:</strong> {req.scope} &bull; <strong>Requested:</strong> {new Date(req.requestedAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800 italic text-[11px] line-clamp-2">
                  "{req.requestReason}"
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedEditRequestForReview(req);
                      setAuditorReviewComment('');
                      setIsAuditorReviewModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Review & Respond</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewRole === 'Distributor' && editRequestsList.some(r => r.distributor === selectedDistributorName) && (
        <div className="space-y-2">
          {editRequestsList
            .filter(r => r.distributor === selectedDistributorName)
            .slice(0, 3)
            .map((req) => (
              <div
                key={req.id}
                className={`rounded-xl p-3.5 text-xs flex items-start justify-between gap-3 border shadow-md ${
                  req.status === 'PENDING' ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' :
                  req.status === 'APPROVED' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' :
                  'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Unlock className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm">
                        Edit Access Request ({req.id}): {req.status}
                      </p>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                        {req.scope}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 mt-1 italic">Reason: "{req.requestReason}"</p>
                    {req.reviewerComment && (
                      <p className="text-[11px] font-semibold mt-1.5 p-2 rounded-lg bg-black/40 border border-white/10 text-slate-100">
                        <strong>Auditor Comment:</strong> {req.reviewerComment}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] opacity-75 font-mono shrink-0">
                  {new Date(req.requestedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* KPI Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        
        <button 
          onClick={() => setStatusFilter('All')}
          className={`bg-slate-900 border rounded-xl p-3.5 space-y-1 text-left transition-all cursor-pointer hover:border-slate-700 ${statusFilter === 'All' ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-slate-800/80' : 'border-slate-800'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Requests</span>
          <div className="text-xl font-bold text-white font-mono">{totalItemsCount}</div>
          <p className="text-[10px] text-slate-400">Across 6 Audit Categories</p>
        </button>

        <button 
          onClick={() => setStatusFilter('Completed')}
          className={`bg-slate-900 border rounded-xl p-3.5 space-y-1 text-left transition-all cursor-pointer hover:border-slate-700 ${statusFilter === 'Completed' ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-slate-800/80' : 'border-slate-800'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed / Ready</span>
          <div className="text-xl font-bold text-emerald-400 font-mono">{completedItemsCount}</div>
          <p className="text-[10px] text-emerald-400/80 font-semibold">{overallProgressPercent}% Complete</p>
        </button>

        <button 
          onClick={() => setStatusFilter('Missing Docs')}
          className={`bg-slate-900 border rounded-xl p-3.5 space-y-1 text-left transition-all cursor-pointer hover:border-slate-700 ${statusFilter === 'Missing Docs' ? 'border-red-500 ring-1 ring-red-500/50 bg-red-950/20' : 'border-slate-800'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Missing Mandatories</span>
          <div className={`text-xl font-bold font-mono ${missingMandatoryCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {missingMandatoryCount}
          </div>
          <p className="text-[10px] text-slate-400">Requires File or &gt;=50 char explanation</p>
        </button>

        <button 
          onClick={() => setStatusFilter('Accepted')}
          className={`bg-slate-900 border rounded-xl p-3.5 space-y-1 text-left transition-all cursor-pointer hover:border-slate-700 ${statusFilter === 'Accepted' ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-slate-800/80' : 'border-slate-800'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accepted by Auditor</span>
          <div className="text-xl font-bold text-indigo-400 font-mono">
            {requests.filter(r => r.reviewerStatus === 'Accepted').length}
          </div>
          <p className="text-[10px] text-indigo-300">Auditor verified</p>
        </button>

        <button 
          onClick={() => setStatusFilter('Clarification')}
          className={`bg-slate-900 border rounded-xl p-3.5 space-y-1 col-span-2 sm:col-span-1 text-left transition-all cursor-pointer hover:border-slate-700 ${statusFilter === 'Clarification' ? 'border-amber-500 ring-1 ring-amber-500/50 bg-slate-800/80' : 'border-slate-800'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clarifications Needed</span>
          <div className={`text-xl font-bold font-mono ${clarificationRequiredCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {clarificationRequiredCount}
          </div>
          <p className="text-[10px] text-amber-300">Action required by Distributor</p>
        </button>

      </div>

      {/* SECTION 2: Search, Filters & Category Expand Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ref #, category, description..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5 text-indigo-400" />
            <span>Filter Status:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending / Incomplete</option>
            <option value="Completed">Completed / Ready</option>
            <option value="Missing Docs">Missing Mandatory Docs</option>
            <option value="Clarification">Clarification Required</option>
            <option value="Accepted">Accepted by Auditor</option>
          </select>

          {/* Full Screen Mode Icon Button placed right near Filter Status */}
          <button
            id="irl-fullscreen-toggle"
            onClick={toggleFullScreen}
            title={isFullScreenMode ? "Exit Fullscreen Mode (Show Left Navigation Pane) [Esc]" : "Enter Fullscreen Mode (Hide Left Navigation Pane)"}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isFullScreenMode
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isFullScreenMode ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-indigo-200" />
                <span className="text-[11px]">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-[11px]">Fullscreen</span>
              </>
            )}
          </button>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All 6 Categories</option>
            {categoryNames.map(c => (
              <option key={c.num} value={c.name}>{c.num}. {c.name}</option>
            ))}
          </select>

          {/* Expand/Collapse All Button */}
          <button
            onClick={() => {
              if (expandedCategories.length === 6) setExpandedCategories([]);
              else setExpandedCategories([1, 2, 3, 4, 5, 6]);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all border border-slate-700 ml-auto md:ml-0"
          >
            {expandedCategories.length === 6 ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

      </div>

      {/* SECTION 3: Main Request Interface */}
      {viewRole === 'Distributor' ? (
        <DistributorVerticalView
          requests={requests}
          filteredRequests={filteredRequests}
          categoryNames={categoryNames}
          isItemComplete={isItemComplete}
          isLocked={isLocked}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          handleTextResponseChange={handleTextResponseChange}
          handleExplanationChange={handleExplanationChange}
          handleFileUpload={handleFileUpload}
          handleDeleteFile={handleDeleteFile}
          setSelectedFileForPreview={setSelectedFileForPreview}
          setSelectedItemForComments={setSelectedItemForComments}
          onOpenReferenceModal={handleOpenReferenceModal}
          showToast={showToast}
          handleSubQuestionTextChange={handleSubQuestionTextChange}
          handleSubQuestionOptionChange={handleSubQuestionOptionChange}
          handleSubQuestionFileUpload={handleSubQuestionFileUpload}
          handleSubQuestionFileDelete={handleSubQuestionFileDelete}
        />
      ) : (
        /* Auditor Interface: Main Expandable Information Request Grid organized by Category */
        <div className="space-y-4">
          {categoryNames.map(cat => {
            const catRequests = filteredRequests.filter(r => r.categoryNumber === cat.num);
            if (catRequests.length === 0 && (searchQuery || statusFilter !== 'All' || categoryFilter !== 'All')) {
              return null; // Skip empty categories during search filtering
            }

            const isExpanded = expandedCategories.includes(cat.num);
            const totalCatItems = requests.filter(r => r.categoryNumber === cat.num).length;
            const completedCatItems = requests.filter(r => r.categoryNumber === cat.num && isItemComplete(r)).length;
            const catPercent = Math.round((completedCatItems / (totalCatItems || 1)) * 100);

            return (
              <div 
                key={cat.num}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
              >
                {/* Category Header Bar */}
              <div 
                onClick={() => toggleCategory(cat.num)}
                className="p-4 bg-slate-900 hover:bg-slate-850 flex items-center justify-between gap-4 cursor-pointer select-none border-b border-slate-800/80"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-sm shrink-0">
                    {cat.num}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{cat.name}</h3>
                    <p className="text-xs text-slate-400">
                      {totalCatItems} Requested Items &bull; {completedCatItems} Completed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Category Progress */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-24 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${catPercent}%` }}></div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-300">{catPercent}%</span>
                  </div>

                  <button className="p-1 rounded-lg text-slate-400 hover:text-white">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Category Items List */}
              {isExpanded && (
                <div className="divide-y divide-slate-800/80">
                  {catRequests.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No matching request items found in this category for current filter.
                    </div>
                  ) : (
                    catRequests.map(item => {
                      const itemComplete = isItemComplete(item);
                      const hasUploadedFiles = item.uploadedFiles.length > 0 || Object.values(item.subQuestionResponses || {}).some((r: any) => r.uploadedFiles && r.uploadedFiles.length > 0);
                      const requiresMainDocument = item.isMandatory && 
                        item.allowDocumentUpload !== false && 
                        !item.isYesNoOnly && 
                        item.responseType !== 'Yes/No Only' && 
                        item.questionType !== 'yes_no_only' && 
                        item.questionType !== 'yes_no_conditional' && 
                        item.responseType !== 'Yes/No Conditional';

                      const isMandatoryNoDoc = requiresMainDocument && !hasUploadedFiles;
                      const hasValidExplanation = item.noUploadExplanation.trim().length >= 50;
                      const isValidationError = isMandatoryNoDoc && !hasValidExplanation;

                      return (
                        <div key={item.id} id={`item-card-${item.id}`} className="p-4 sm:p-5 hover:bg-slate-950/40 transition-all space-y-4 rounded-2xl transition-all duration-300">
                          
                          {/* Item Top Row: Ref Number, Title, Mandatory Badge, Response Status */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <span className="font-mono text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/30">
                                Ref {item.refNumber}
                              </span>
                              
                              <h4 className="text-sm font-bold text-white tracking-tight">{item.title}</h4>

                              {item.isMandatory ? (
                                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                  Mandatory
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                  Optional
                                </span>
                              )}

                              {(item.isYesNoOnly || item.responseType === 'Yes/No Only') && (
                                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                                  Yes / No Question
                                </span>
                              )}
                            </div>

                            {/* Status & Review Badges */}
                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              
                              {/* Response Status */}
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                item.status === 'Completed' || item.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                item.status === 'Submitted' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                                item.status === 'Partially Completed' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}>
                                Status: {item.status}
                              </span>

                              {/* Reviewer Status */}
                              {item.reviewerStatus !== 'Pending Review' && (
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                  item.reviewerStatus === 'Accepted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                  item.reviewerStatus === 'Clarification Required' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                  'bg-red-500/20 text-red-300 border-red-500/30'
                                }`}>
                                  Auditor: {item.reviewerStatus}
                                </span>
                              )}

                              {/* Auditor Reference Material Button */}
                              {item.sampleMaterialEnabled && item.referenceMaterial && (
                                <button
                                  onClick={() => handleOpenReferenceModal(item)}
                                  className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 rounded-lg text-xs font-semibold transition-all border border-indigo-500/40 flex items-center gap-1.5 cursor-pointer shadow-xs hover:border-indigo-400"
                                  title="View auditor-provided reference material"
                                >
                                  <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                  <span>ⓘ View Sample</span>
                                  <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.2 rounded font-mono">
                                    {item.referenceMaterial.referenceType}
                                  </span>
                                </button>
                              )}

                              {/* Auditor Edit Question Button */}
                              {viewRole === 'Auditor' && (
                                <button
                                  onClick={() => handleOpenQuestionnaireModal(item)}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                                  title="Edit or customize this question requirement"
                                >
                                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                                  <span>Edit Question</span>
                                </button>
                              )}

                              {/* Comments Modal Drawer Button */}
                              <button
                                onClick={() => setSelectedItemForComments(item)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                              >
                                <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                                <span>Comments</span>
                                {item.comments.length > 0 && (
                                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                    {item.comments.length}
                                  </span>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Item Description */}
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                            {item.description}
                          </p>

                          {/* Input Fields Grid: Text Response / Yes-No / Conditional Sub-Questions & Document Upload Zone */}
                          {item.questionType === 'yes_no_conditional' ? (
                            <div className="space-y-4">
                              {/* Main Yes/No selection controls */}
                              <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-200">Main Requirement Decision:</span>
                                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1">
                                    <GitFork className="h-3 w-3 text-indigo-400" />
                                    Conditional Question
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    disabled={isLocked && viewRole === 'Distributor'}
                                    onClick={() => {
                                      const nextVal = item.textResponse === 'Yes' ? '' : 'Yes';
                                      handleTextResponseChange(item.id, nextVal);
                                      if (nextVal === 'Yes') {
                                        showToast(`Answered 'YES' for ${item.refNumber}. Please complete triggered sub-questions.`, 'success');
                                      } else {
                                        showToast(`Selection cleared for ${item.refNumber}. Sub-questions hidden (data preserved).`, 'info');
                                      }
                                    }}
                                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                                      item.textResponse === 'Yes'
                                        ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400'
                                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                                    }`}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>YES</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isLocked && viewRole === 'Distributor'}
                                    onClick={() => {
                                      const nextVal = item.textResponse === 'No' ? '' : 'No';
                                      handleTextResponseChange(item.id, nextVal);
                                      if (nextVal === 'No') {
                                        showToast(`Answered 'NO' for ${item.refNumber}. Please complete triggered sub-questions.`, 'info');
                                      } else {
                                        showToast(`Selection cleared for ${item.refNumber}. Sub-questions hidden (data preserved).`, 'info');
                                      }
                                    }}
                                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                                      item.textResponse === 'No'
                                        ? 'bg-rose-600 text-white shadow-lg ring-2 ring-rose-400'
                                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                                    }`}
                                  >
                                    <XCircle className="h-4 w-4" />
                                    <span>NO</span>
                                  </button>
                                </div>

                                {!item.textResponse && (
                                  <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/20 rounded-lg text-center text-xs text-indigo-300 flex items-center justify-center gap-2">
                                    <Info className="h-4 w-4 text-indigo-400 shrink-0" />
                                    <span>Please select <strong>YES</strong> or <strong>NO</strong> above to reveal specific conditional sub-questions required.</span>
                                  </div>
                                )}
                              </div>

                              {/* Render Active Branch Sub-questions when YES or NO is selected */}
                              {(item.textResponse === 'Yes' || item.textResponse === 'No') && (
                                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4 animate-fade-in">
                                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                                    <div className="flex items-center gap-2 text-xs font-bold">
                                      <CornerDownRight className="h-4 w-4 text-indigo-400 shrink-0" />
                                      <span className={item.textResponse === 'Yes' ? 'text-emerald-400' : 'text-rose-400'}>
                                        {item.textResponse === 'Yes' ? 'YES Branch Triggered Sub-Questions:' : 'NO Branch Triggered Sub-Questions:'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {(item.textResponse === 'Yes' ? item.conditionalRules?.yesSubQuestions?.length : item.conditionalRules?.noSubQuestions?.length) || 0} Sub-questions
                                    </span>
                                  </div>

                                  {((item.textResponse === 'Yes' ? item.conditionalRules?.yesSubQuestions : item.conditionalRules?.noSubQuestions) || []).length === 0 ? (
                                    <p className="text-xs text-slate-400 italic text-center py-2">
                                      No sub-questions configured for this condition branch.
                                    </p>
                                  ) : (
                                    <div className="space-y-3.5">
                                      {((item.textResponse === 'Yes' ? item.conditionalRules?.yesSubQuestions : item.conditionalRules?.noSubQuestions) || []).map((subQ) => {
                                        const subResp = item.subQuestionResponses?.[subQ.id] || { subQuestionId: subQ.id };
                                        const subFiles = subResp.uploadedFiles || [];

                                        return (
                                          <div key={subQ.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                              <div>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs font-extrabold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded font-mono border border-indigo-500/30">
                                                    {subQ.refCode}
                                                  </span>
                                                  <h5 className="text-xs font-bold text-slate-100">{subQ.title}</h5>
                                                  {subQ.isMandatory && (
                                                    <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                                      Required
                                                    </span>
                                                  )}
                                                </div>
                                                {subQ.description && (
                                                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{subQ.description}</p>
                                                )}
                                              </div>
                                            </div>

                                            {/* Render based on subQ.responseFormat */}
                                            {(subQ.responseFormat === 'text' || subQ.responseFormat === 'number') && (
                                              <input
                                                type={subQ.responseFormat === 'number' ? 'number' : 'text'}
                                                disabled={isLocked && viewRole === 'Distributor'}
                                                value={subResp.textResponse || ''}
                                                onChange={(e) => handleSubQuestionTextChange(item.id, subQ.id, e.target.value)}
                                                placeholder={subQ.responseFormat === 'number' ? 'Enter numeric value...' : 'Enter response or details...'}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                                              />
                                            )}

                                            {subQ.responseFormat === 'dropdown' && (
                                              <select
                                                disabled={isLocked && viewRole === 'Distributor'}
                                                value={subResp.selectedOption || ''}
                                                onChange={(e) => handleSubQuestionOptionChange(item.id, subQ.id, e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                                              >
                                                <option value="">-- Select Option --</option>
                                                {(subQ.options || []).map((opt, i) => (
                                                  <option key={i} value={opt}>{opt}</option>
                                                ))}
                                              </select>
                                            )}

                                            {subQ.responseFormat === 'yes_no' && (
                                              <div className="grid grid-cols-2 gap-2">
                                                <button
                                                  type="button"
                                                  disabled={isLocked && viewRole === 'Distributor'}
                                                  onClick={() => handleSubQuestionTextChange(item.id, subQ.id, 'Yes')}
                                                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    subResp.textResponse === 'Yes'
                                                      ? 'bg-emerald-600 text-white'
                                                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                                                  }`}
                                                >
                                                  Yes
                                                </button>
                                                <button
                                                  type="button"
                                                  disabled={isLocked && viewRole === 'Distributor'}
                                                  onClick={() => handleSubQuestionTextChange(item.id, subQ.id, 'No')}
                                                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    subResp.textResponse === 'No'
                                                      ? 'bg-rose-600 text-white'
                                                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                                                  }`}
                                                >
                                                  No
                                                </button>
                                              </div>
                                            )}

                                            {(subQ.responseFormat === 'file' || subQ.responseFormat === 'text_and_file') && (
                                              <div className="space-y-2">
                                                {subQ.responseFormat === 'text_and_file' && (
                                                  <textarea
                                                    disabled={isLocked && viewRole === 'Distributor'}
                                                    value={subResp.textResponse || ''}
                                                    onChange={(e) => handleSubQuestionTextChange(item.id, subQ.id, e.target.value)}
                                                    placeholder="Type explanation or narrative context..."
                                                    rows={2}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                                                  />
                                                )}

                                                {(!isLocked || viewRole === 'Auditor') && (
                                                  <label className="border border-dashed border-slate-800 hover:border-indigo-500 bg-slate-950 rounded-lg p-2 text-center block cursor-pointer transition-all">
                                                    <input
                                                      type="file"
                                                      className="hidden"
                                                      onChange={(e) => handleSubQuestionFileUpload(item.id, subQ.id, e.target.files)}
                                                    />
                                                    <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 font-semibold">
                                                      <Upload className="h-3.5 w-3.5" />
                                                      <span>Upload Sub-question Document</span>
                                                    </div>
                                                  </label>
                                                )}

                                                {subFiles.length > 0 && (
                                                  <div className="space-y-1">
                                                    {subFiles.map(file => (
                                                      <div key={file.id} className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-200">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                          <File className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                                          <span className="font-medium truncate">{file.fileName}</span>
                                                          <span className="text-[10px] text-slate-500">({file.fileSizeMB} MB)</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                          <button
                                                            type="button"
                                                            onClick={() => setSelectedFileForPreview(file)}
                                                            title="View File"
                                                            className="p-1 hover:bg-slate-800 rounded text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                                          >
                                                            <Eye className="h-3.5 w-3.5" />
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={() => handleDownloadUploadedFile(file)}
                                                            title="Download File"
                                                            className="p-1 hover:bg-slate-800 rounded text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                                                          >
                                                            <Download className="h-3.5 w-3.5" />
                                                          </button>
                                                          {(!isLocked || viewRole === 'Auditor') && (
                                                            <button
                                                              type="button"
                                                              onClick={() => handleSubQuestionFileDelete(item.id, subQ.id, file.id)}
                                                              title="Remove File"
                                                              className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
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
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              
                              {/* Response Box / Yes-No Selection */}
                              {item.isYesNoOnly || item.responseType === 'Yes/No Only' ? (
                                <div className="space-y-2 p-3 bg-slate-950/90 border border-slate-800 rounded-xl col-span-2">
                                  <div className="text-[11px] font-semibold text-slate-200 flex items-center justify-between">
                                    <span>Distributor Selection:</span>
                                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                                      Yes / No Only
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                                    <button
                                      type="button"
                                      disabled={isLocked && viewRole === 'Distributor'}
                                      onClick={() => {
                                        handleTextResponseChange(item.id, 'Yes');
                                        showToast(`Answered 'Yes' for ${item.refNumber}`, 'success');
                                      }}
                                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                        item.textResponse === 'Yes'
                                          ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                                          : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                                      }`}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      <span>Yes</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isLocked && viewRole === 'Distributor'}
                                      onClick={() => {
                                        handleTextResponseChange(item.id, 'No');
                                        showToast(`Answered 'No' for ${item.refNumber}`, 'info');
                                      }}
                                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                        item.textResponse === 'No'
                                          ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400'
                                          : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                                      }`}
                                    >
                                      <XCircle className="h-4 w-4" />
                                      <span>No</span>
                                    </button>
                                  </div>
                                  {item.textResponse && (
                                    <div className="text-[11px] text-slate-400 pt-1 text-center font-medium border-t border-slate-800/80">
                                      Selection: <strong className={item.textResponse === 'Yes' ? 'text-emerald-400' : 'text-rose-400'}>{item.textResponse}</strong>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {item.allowTextResponse !== false ? (
                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                                        <span>Distributor Text Response:</span>
                                        <span className="text-[10px] text-slate-500">Auto-saved to draft</span>
                                      </label>
                                      <textarea
                                        value={item.textResponse}
                                        onChange={(e) => handleTextResponseChange(item.id, e.target.value)}
                                        disabled={isLocked && viewRole === 'Distributor'}
                                        placeholder="Type narrative response or context here..."
                                        rows={3}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                      />
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center flex flex-col justify-center text-slate-400 text-xs">
                                      <p className="italic">Text response box disabled by auditor.</p>
                                    </div>
                                  )}

                                  {/* Document Upload Zone */}
                                  {item.allowDocumentUpload !== false ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
                                        <span>Upload Supporting Documents:</span>
                                        <span className="text-[10px] text-slate-400">
                                          Allowed: {item.allowedFileTypes.join(', ')} &bull; Max {item.maxSizeMB}MB
                                        </span>
                                      </div>

                                      {/* Drag & Drop Upload Trigger */}
                                      {(!isLocked || viewRole === 'Auditor') && (
                                        <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500 bg-slate-950/80 rounded-xl p-3 text-center block cursor-pointer transition-all hover:bg-slate-950">
                                          <input 
                                            type="file" 
                                            className="hidden" 
                                            onChange={(e) => handleFileUpload(item.id, e.target.files)}
                                          />
                                          <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 font-semibold">
                                            <Upload className="h-4 w-4" />
                                            <span>Click or Drag & Drop File to Upload</span>
                                          </div>
                                        </label>
                                      )}

                                      {/* Uploaded File Pills List */}
                                      {item.uploadedFiles.length > 0 && (
                                        <div className="space-y-1.5 pt-1">
                                          {item.uploadedFiles.map(file => (
                                            <div 
                                              key={file.id} 
                                              className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-2 text-xs text-slate-200"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <File className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                                <span className="font-medium truncate text-slate-100">{file.fileName}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">({file.fileSizeMB} MB)</span>
                                                <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">v{file.version}</span>
                                              </div>

                                              <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                  type="button"
                                                  onClick={() => setSelectedFileForPreview(file)}
                                                  title="View File"
                                                  className="p-1 hover:bg-slate-800 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                                >
                                                  <Eye className="h-3.5 w-3.5" />
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={() => handleDownloadUploadedFile(file)}
                                                  title="Download File"
                                                  className="p-1 hover:bg-slate-800 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                                                >
                                                  <Download className="h-3.5 w-3.5" />
                                                </button>

                                                {(!isLocked || viewRole === 'Auditor') && (
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteFile(item.id, file.id)}
                                                    title="Remove File"
                                                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
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
                                  ) : (
                                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center flex flex-col justify-center text-slate-400 text-xs">
                                      <p className="italic">Document upload zone disabled by auditor.</p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {/* MANDATORY VALIDATION RULE: Missing Document Explanation Requirement (>50 Chars) */}
                          {isMandatoryNoDoc && (
                            <div className={`p-3 rounded-xl border space-y-2 transition-all ${
                              isValidationError 
                                ? 'bg-red-950/40 border-red-500/50 text-red-200' 
                                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                            }`}>
                              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                                <span className="flex items-center gap-1.5">
                                  <AlertCircle className="h-4 w-4 text-red-400" />
                                  <span>Mandatory Document Missing — Mandatory Detailed Explanation Required</span>
                                </span>
                                <span className={`font-mono text-[11px] ${
                                  hasValidExplanation ? 'text-emerald-400' : 'text-red-400 font-extrabold'
                                }`}>
                                  {item.noUploadExplanation.trim().length} / 50 characters min
                                </span>
                              </div>

                              <textarea
                                value={item.noUploadExplanation}
                                onChange={(e) => handleExplanationChange(item.id, e.target.value)}
                                disabled={isLocked && viewRole === 'Distributor'}
                                placeholder="Explain why mandatory document cannot be provided (minimum 50 characters required)..."
                                rows={2}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500"
                              />

                              {isValidationError && (
                                <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                                  <span>&bull; Submission blocked until explanation is at least 50 characters long or document is uploaded.</span>
                                </p>
                              )}
                            </div>
                          )}

                          {/* AUDITOR REVIEW CONTROLS (Visible in Auditor Mode) */}
                          {viewRole === 'Auditor' && (
                            <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30 space-y-2 mt-2">
                              <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
                                <span className="flex items-center gap-1.5">
                                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                                  <span>Auditor Reviewer Evaluation:</span>
                                </span>
                                <span className="text-[10px] text-slate-400">Update status for Distributor</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => handleReviewerStatusChange(item.id, 'Accepted')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                    item.reviewerStatus === 'Accepted'
                                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                                      : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-800'
                                  }`}
                                >
                                  Accept Request
                                </button>

                                <button
                                  onClick={() => handleReviewerStatusChange(item.id, 'Clarification Required')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                    item.reviewerStatus === 'Clarification Required'
                                      ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                                      : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-800'
                                  }`}
                                >
                                  Require Clarification
                                </button>

                                <button
                                  onClick={() => handleReviewerStatusChange(item.id, 'Rejected')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                    item.reviewerStatus === 'Rejected'
                                      ? 'bg-red-600 text-white border-red-500 shadow-md'
                                      : 'bg-slate-900 hover:bg-slate-800 text-red-400 border-slate-800'
                                  }`}
                                >
                                  Reject Evidence
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          );
        })}
        </div>
      )}

      {/* MODAL 1: File Preview & Hash Metadata Modal */}
      {selectedFileForPreview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedFileForPreview(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <File className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{selectedFileForPreview.fileName}</h3>
                <p className="text-xs text-slate-400">Evidence ID: {selectedFileForPreview.evidenceId}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 uppercase block">SHA-256 Cryptographic Hash Fingerprint</span>
                <span className="text-[11px] text-emerald-400 break-all">{selectedFileForPreview.hash}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">File Size</span>
                  <span className="font-bold text-white">{selectedFileForPreview.fileSizeMB} MB</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Document Format</span>
                  <span className="font-bold text-white">{selectedFileForPreview.fileType}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Uploaded By</span>
                  <span className="font-bold text-white">{selectedFileForPreview.uploadedBy}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Upload Timestamp</span>
                  <span className="font-bold text-white">{selectedFileForPreview.uploadDate}</span>
                </div>
              </div>

              {/* Document Live Preview Box */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-indigo-400" />
                    Interactive File Content Preview
                  </span>
                  <a
                    href={selectedFileForPreview.webViewLink || `/api/storage/preview/${encodeURIComponent(selectedFileForPreview.id || selectedFileForPreview.evidenceId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="rounded-lg overflow-hidden border border-slate-800/80 bg-slate-900">
                  <iframe
                    src={selectedFileForPreview.webViewLink || `/api/storage/preview/${encodeURIComponent(selectedFileForPreview.id || selectedFileForPreview.evidenceId)}`}
                    className="w-full h-56 rounded border-0 bg-slate-950 text-slate-200"
                    title={`Preview of ${selectedFileForPreview.fileName}`}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDownloadUploadedFile(selectedFileForPreview)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download File ({selectedFileForPreview.fileSizeMB} MB)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFileForPreview(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Threaded Comment Drawer */}
      {selectedItemForComments && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-6 flex flex-col justify-between space-y-4 shadow-2xl relative">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    Ref {selectedItemForComments.refNumber}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">{selectedItemForComments.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedItemForComments(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Threaded Messages List */}
              <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {selectedItemForComments.comments.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-8">
                    No comments yet. Start a discussion thread with the auditor.
                  </div>
                ) : (
                  selectedItemForComments.comments.map(cmt => (
                    <div 
                      key={cmt.id}
                      className={`p-3 rounded-xl space-y-1 text-xs border ${
                        cmt.role === 'Distributor' 
                          ? 'bg-slate-950 border-slate-800' 
                          : 'bg-indigo-950/40 border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{cmt.author} ({cmt.role})</span>
                        <span className="text-[10px] text-slate-500">{cmt.timestamp}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{cmt.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comment Composer */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Type reply or clarification query..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddComment}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Post Comment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            
            {missingMandatoryCount > 0 ? (
              /* SUBMISSION BLOCKED VIEW */
              <>
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Submission Blocked</h3>
                    <p className="text-xs text-red-400 font-semibold">
                      {missingMandatoryCount} mandatory requirement(s) are incomplete
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <p className="leading-relaxed">
                    The final system requires all questions marked as <strong>Mandatory</strong> to be completed before <strong>{activeDistributorName}</strong> can submit the IRL.
                  </p>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Requested Items:</span>
                      <span className="font-bold text-white">{totalItemsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Completed & Validated:</span>
                      <span className="font-bold text-emerald-400">{completedItemsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Incomplete Mandatory Items:</span>
                      <span className="font-bold text-red-400">{missingMandatoryCount}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-200 font-bold block text-xs">Incomplete Mandatory Requirements List:</label>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {invalidMandatoryItems.map(item => {
                        const detail = getItemCompletionDetails(item);
                        return (
                          <div key={item.id} className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl space-y-1.5 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[10px] font-extrabold text-red-300 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 shrink-0">
                                  Ref {item.refNumber}
                                </span>
                                <span className="font-bold text-white truncate">{item.title}</span>
                              </div>
                              <span className="text-[9px] font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded shrink-0">
                                INCOMPLETE
                              </span>
                            </div>
                            <p className="text-[11px] text-red-200/90 leading-snug">{detail.reason}</p>
                            <div className="flex items-center justify-between pt-1 border-t border-red-500/20 text-[10px]">
                              <span className="text-slate-400">Cat: {item.category}</span>
                              <button
                                onClick={() => {
                                  setIsSubmitModalOpen(false);
                                  if (!expandedCategories.includes(item.categoryNumber)) {
                                    setExpandedCategories(prev => [...prev, item.categoryNumber]);
                                  }
                                  setStatusFilter('All');
                                  setSearchQuery('');
                                  setTimeout(() => {
                                    const el = document.getElementById(`item-card-${item.id}`);
                                    if (el) {
                                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      el.classList.add('ring-2', 'ring-rose-500', 'ring-offset-2', 'ring-offset-slate-900');
                                      setTimeout(() => {
                                        el.classList.remove('ring-2', 'ring-rose-500', 'ring-offset-2', 'ring-offset-slate-900');
                                      }, 3000);
                                    }
                                  }, 200);
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <span>Jump to Item</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <p className="text-[11px] text-amber-400 italic">
                    Please complete all mandatory items above to enable submission.
                  </p>
                  <button
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                  >
                    Close & Complete Items
                  </button>
                </div>
              </>
            ) : (
              /* READY TO SUBMIT VIEW */
              <>
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    <Send className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Confirm Final IRL Submission</h3>
                    <p className="text-xs text-slate-400">Data360 Initial Information Request List</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <p>
                    You are about to submit the completed Initial Information Request list for <strong>{activeDistributorName}</strong> to the Audit Practice Team.
                  </p>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span>Total Requested Items:</span>
                      <span className="font-bold text-white">{totalItemsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed & Validated:</span>
                      <span className="font-bold text-emerald-400">{completedItemsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Missing Mandatory Validations:</span>
                      <span className="font-bold text-emerald-400">0 (All Mandatory Items Complete)</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200 text-[11px] space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Submission Lock Notice</span>
                    </div>
                    <p>
                      Upon final submission, editing will be locked. To modify responses after submission, you must click "Request Edit Access" with a formal justification for Auditor approval.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setIsSubmitModalOpen(false)}
                    disabled={isSubmittingApi}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={isSubmittingApi}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmittingApi ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Persisting to Supabase...</span>
                      </>
                    ) : (
                      <span>Confirm & Submit Lock</span>
                    )}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* MODAL 4: Request Edit Modal (Distributor) */}
      {isRequestEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                  <Unlock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Request Edit Access</h3>
                  <p className="text-xs text-slate-400">Submit justification to APEX Auditor team for review</p>
                </div>
              </div>
              <button
                onClick={() => setIsRequestEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-semibold block">Edit Request Scope:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditRequestScope('Entire IRL');
                    setSelectedAffectedRequirementIds([]);
                  }}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    editRequestScope === 'Entire IRL'
                      ? 'bg-indigo-950/60 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5 text-indigo-400" /> Entire IRL Form
                  </span>
                  <span className="text-[10px] opacity-80">Request unlock for all requirement items</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditRequestScope('Specific Requirements')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    editRequestScope === 'Specific Requirements'
                      ? 'bg-indigo-950/60 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5 text-xs">
                    <CheckSquare className="h-3.5 w-3.5 text-indigo-400" /> Specific Requirements
                  </span>
                  <span className="text-[10px] opacity-80">Select individual requirement sections</span>
                </button>
              </div>
            </div>

            {/* Affected Requirements Checklist if Specific */}
            {editRequestScope === 'Specific Requirements' && (
              <div className="space-y-2 text-xs">
                <label className="text-slate-300 font-semibold block">Select Affected Requirement Items:</label>
                <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  {requests.map((item) => {
                    const isChecked = selectedAffectedRequirementIds.includes(item.referenceNumber);
                    return (
                      <label key={item.id} className="flex items-start gap-2 p-1.5 hover:bg-slate-900 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAffectedRequirementIds(prev => [...prev, item.referenceNumber]);
                            } else {
                              setSelectedAffectedRequirementIds(prev => prev.filter(ref => ref !== item.referenceNumber));
                            }
                          }}
                          className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                        />
                        <span className="text-slate-300 text-[11px]">
                          <strong className="text-white font-mono">{item.referenceNumber}</strong> - {item.requirementName}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

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
                placeholder="State why responses or documents need updating (e.g., Updated Q2 Sales Register available, corrected inventory log uploaded, additional supporting documentation ready)..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              {editRequestReason.trim().length > 0 && editRequestReason.trim().length < 50 && (
                <p className="text-[11px] text-amber-400">
                  Please provide at least {50 - editRequestReason.trim().length} more characters explaining your request.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsRequestEditModalOpen(false)}
                disabled={isSubmittingEditRequest}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestEdit}
                disabled={editRequestReason.trim().length < 50 || isSubmittingEditRequest}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmittingEditRequest ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit Edit Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Auditor Review Edit Request Modal */}
      {isAuditorReviewModalOpen && selectedEditRequestForReview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Eye className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Review Edit Access Request</h3>
                  <p className="text-xs text-slate-400">Request ID: {selectedEditRequestForReview.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditorReviewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Audit & Distributor Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Distributor</span>
                <span className="text-white font-bold">{selectedEditRequestForReview.distributor}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Client / Audit</span>
                <span className="text-white font-bold">{selectedEditRequestForReview.client}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Scope</span>
                <span className="text-indigo-400 font-bold">{selectedEditRequestForReview.scope}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Requested Date</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {new Date(selectedEditRequestForReview.requestedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Affected Requirements List if Specific Scope */}
            {selectedEditRequestForReview.scope === 'Specific Requirements' && Array.isArray(selectedEditRequestForReview.affectedRequirements) && (
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-bold">Affected Requirement Items:</span>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 rounded-lg border border-slate-800">
                  {selectedEditRequestForReview.affectedRequirements.map((refNum: string) => (
                    <span key={refNum} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-mono font-bold text-[10px]">
                      {refNum}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Request Reason */}
            <div className="space-y-1 text-xs">
              <span className="text-slate-400 font-bold">Distributor's Justification:</span>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 leading-relaxed italic text-xs">
                "{selectedEditRequestForReview.requestReason}"
              </div>
            </div>

            {/* Reviewer Comment Textarea */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-semibold block">Auditor Decision Comment / Instructions:</label>
              <textarea
                value={auditorReviewComment}
                onChange={(e) => setAuditorReviewComment(e.target.value)}
                placeholder="Enter feedback or instructions for Distributor (e.g. Approved for update of item 2.1 sales register. Please re-submit once completed)..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action Buttons: Approve (Unlock) vs Reject (Keep Locked) */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAuditorReviewModalOpen(false)}
                disabled={isProcessingAuditorAction}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRejectEditRequest(selectedEditRequestForReview.id)}
                  disabled={isProcessingAuditorAction || !auditorReviewComment.trim()}
                  className="px-4 py-2 bg-rose-600/90 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject Request</span>
                </button>

                <button
                  onClick={() => handleApproveEditRequest(selectedEditRequestForReview.id)}
                  disabled={isProcessingAuditorAction}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  {isProcessingAuditorAction ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Approve & Unlock IRL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Questionnaire Item Customization / Scrollable Questionnaire Builder Modal */}
      {isQuestionnaireModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* FIXED HEADER */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 bg-slate-900/95 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? `Edit Requirement ${editingItem.refNumber}` : 'Questionnaire Requirement Builder'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure request format, conditional branching rules & reference material</p>
                </div>
              </div>
              <button 
                onClick={() => setIsQuestionnaireModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
              
              {/* Category and Ref Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Ref Number:</label>
                  <input
                    type="text"
                    value={qFormRef}
                    onChange={(e) => setQFormRef(e.target.value)}
                    placeholder="e.g. 1.4"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Audit Category:</label>
                  <select
                    value={qFormCategory}
                    onChange={(e) => setQFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Distributor General Information">1. General Information</option>
                    <option value="Financial Information">2. Financial Information</option>
                    <option value="Customer Information">3. Customer Information</option>
                    <option value="Accounts Payable">4. Accounts Payable</option>
                    <option value="Healthcare Professional Interactions">5. Healthcare Professional Interactions</option>
                    <option value="Other Information">6. Other Information</option>
                  </select>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Request Title:</label>
                <input
                  type="text"
                  value={qFormTitle}
                  onChange={(e) => setQFormTitle(e.target.value)}
                  placeholder="e.g., Audited Balance Sheet & Tax Clearance Certificate"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Requirement Description / Guidance for Distributor:</label>
                <textarea
                  value={qFormDescription}
                  onChange={(e) => setQFormDescription(e.target.value)}
                  placeholder="Detail exact documents or narrative expected from distributor..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 3-WAY QUESTION TYPE SELECTOR */}
              <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3">
                <label className="text-slate-200 font-bold block text-xs flex items-center justify-between">
                  <span>Select Question Format & Behavior:</span>
                  <span className="text-[10px] text-indigo-400 font-mono">3 Types Available</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Standard Question */}
                  <button
                    type="button"
                    onClick={() => setQFormQuestionType('standard')}
                    className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer flex flex-col justify-between ${
                      qFormQuestionType === 'standard'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-1.5 mb-1">
                        <FileText className="h-4 w-4 text-indigo-400" />
                        <span>Standard Question</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Configurable document upload zone and/or text answer box.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Yes/No Conditional Question */}
                  <button
                    type="button"
                    onClick={() => setQFormQuestionType('yes_no_conditional')}
                    className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer flex flex-col justify-between ${
                      qFormQuestionType === 'yes_no_conditional'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-100 shadow-md ring-1 ring-purple-500/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-purple-200 flex items-center gap-1.5 mb-1">
                        <GitFork className="h-4 w-4 text-purple-400" />
                        <span>Yes/No Conditional</span>
                      </div>
                      <p className="text-[10px] text-purple-300/80 leading-normal">
                        Triggers sub-questions (1A, 1B, 1C) only after distributor answers Yes or No.
                      </p>
                    </div>
                  </button>

                  {/* Option 3: Yes/No Question Only */}
                  <button
                    type="button"
                    onClick={() => setQFormQuestionType('yes_no_only')}
                    className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer flex flex-col justify-between ${
                      qFormQuestionType === 'yes_no_only'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-amber-200 flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-amber-400" />
                        <span>Yes/No Only</span>
                      </div>
                      <p className="text-[10px] text-amber-300/80 leading-normal">
                        Pure Yes/No choice. Document uploads and extra fields stay locked.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Sub-configuration panel based on selected Question Type */}
                {qFormQuestionType === 'standard' && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-300 block">Standard Response Options Visibility:</span>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={qFormAllowDocUpload}
                          onChange={(e) => setQFormAllowDocUpload(e.target.checked)}
                          className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="text-slate-200 font-medium text-xs">Allow Document Upload</span>
                      </label>

                      <label className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={qFormAllowTextResponse}
                          onChange={(e) => setQFormAllowTextResponse(e.target.checked)}
                          className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="text-slate-200 font-medium text-xs">Allow Text Answer Box</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* YES/NO CONDITIONAL SUB-QUESTION BUILDER */}
                {qFormQuestionType === 'yes_no_conditional' && (
                  <div className="pt-3 border-t border-slate-800 space-y-4">
                    <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                        <GitFork className="h-4 w-4 text-purple-400 shrink-0" />
                        <span>Conditional Branch Sub-Question Builder</span>
                      </div>
                      <p className="text-[11px] text-purple-200/80 leading-relaxed">
                        Define specific follow-up sub-questions that appear dynamically when the distributor answers <strong>YES</strong> or <strong>NO</strong>.
                      </p>
                    </div>

                    {/* Branch Switcher Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <button
                        type="button"
                        onClick={() => setQFormActiveSubBranch('yes')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          qFormActiveSubBranch === 'yes'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>YES Branch Sub-Questions ({qFormYesSubQuestions.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setQFormActiveSubBranch('no')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          qFormActiveSubBranch === 'no'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        <XCircle className="h-4 w-4" />
                        <span>NO Branch Sub-Questions ({qFormNoSubQuestions.length})</span>
                      </button>
                    </div>

                    {/* Sub-questions List for Active Branch */}
                    <div className="space-y-3">
                      {((qFormActiveSubBranch === 'yes' ? qFormYesSubQuestions : qFormNoSubQuestions) || []).length === 0 ? (
                        <div className="p-6 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-2 bg-slate-900/50">
                          <ListPlus className="h-8 w-8 text-slate-600 mx-auto" />
                          <p className="text-slate-400 font-medium">
                            No follow-up sub-questions added for the <strong className={qFormActiveSubBranch === 'yes' ? 'text-emerald-400' : 'text-rose-400'}>{qFormActiveSubBranch.toUpperCase()}</strong> branch yet.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleAddSubQuestion(qFormActiveSubBranch)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md inline-flex items-center gap-1.5 cursor-pointer mt-1"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Sub-Question</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(qFormActiveSubBranch === 'yes' ? qFormYesSubQuestions : qFormNoSubQuestions).map((subQ, idx) => (
                            <div key={subQ.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 relative group">
                              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                <div className="flex items-center gap-2">
                                  <CornerDownRight className="h-4 w-4 text-indigo-400" />
                                  <span className="font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded text-[11px]">
                                    {subQ.refCode}
                                  </span>
                                  <span className="font-bold text-slate-200 text-xs">Sub-Question #{idx + 1}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={subQ.isMandatory}
                                      onChange={(e) => handleUpdateSubQuestion(qFormActiveSubBranch, idx, { isMandatory: e.target.checked })}
                                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                    />
                                    <span>Mandatory</span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubQuestion(qFormActiveSubBranch, idx)}
                                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                                    title="Delete sub-question"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div>
                                  <label className="text-slate-400 font-semibold block text-[10px] mb-1">Sub-Ref Code:</label>
                                  <input
                                    type="text"
                                    value={subQ.refCode}
                                    onChange={(e) => handleUpdateSubQuestion(qFormActiveSubBranch, idx, { refCode: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono text-xs"
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="text-slate-400 font-semibold block text-[10px] mb-1">Sub-Question Title:</label>
                                  <input
                                    type="text"
                                    value={subQ.title}
                                    onChange={(e) => handleUpdateSubQuestion(qFormActiveSubBranch, idx, { title: e.target.value })}
                                    placeholder="e.g., 1A Countries list"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 text-xs"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="text-slate-400 font-semibold block text-[10px] mb-1">Response Type Expected:</label>
                                  <select
                                    value={subQ.responseFormat}
                                    onChange={(e) => handleUpdateSubQuestion(qFormActiveSubBranch, idx, { responseFormat: e.target.value as any })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 text-xs"
                                  >
                                    <option value="text">Text Response</option>
                                    <option value="file">Document Upload Only</option>
                                    <option value="text_and_file">Text Answer + Document Upload</option>
                                    <option value="dropdown">Dropdown Options</option>
                                    <option value="yes_no">Yes / No Choice</option>
                                    <option value="number">Numeric Value</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-slate-400 font-semibold block text-[10px] mb-1">Prompt / Instructions:</label>
                                  <input
                                    type="text"
                                    value={subQ.description || ''}
                                    onChange={(e) => handleUpdateSubQuestion(qFormActiveSubBranch, idx, { description: e.target.value })}
                                    placeholder="Guidance for distributor..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleAddSubQuestion(qFormActiveSubBranch)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-bold text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Another Sub-Question to {qFormActiveSubBranch.toUpperCase()} Branch</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mandatory Requirement Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="qMandatoryCheck"
                  checked={qFormMandatory}
                  onChange={(e) => setQFormMandatory(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="qMandatoryCheck" className="text-slate-300 font-semibold cursor-pointer">
                  {qFormQuestionType === 'yes_no_only' 
                    ? 'Mandatory Requirement (Distributor must select Yes or No)' 
                    : qFormQuestionType === 'yes_no_conditional'
                    ? 'Mandatory Requirement (Distributor must answer main Yes/No and complete triggered sub-questions)'
                    : 'Mandatory Requirement (Distributor must provide response or >50 char explanation)'}
                </label>
              </div>

              {/* Auditor Provided Sample / Reference Material Section */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="qSampleEnableCheck"
                      checked={qFormSampleEnabled}
                      onChange={(e) => setQFormSampleEnabled(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="qSampleEnableCheck" className="text-white font-bold cursor-pointer text-xs flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      <span>Enable Sample / Reference Material</span>
                    </label>
                  </div>
                  {qFormSampleEnabled && (
                    <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30 font-medium">
                      Per-Requirement Configuration
                    </span>
                  )}
                </div>

                {qFormSampleEnabled && (
                  <div className="p-3.5 bg-slate-950/90 rounded-xl border border-indigo-500/30 space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">Reference Type:</label>
                        <select
                          value={qFormRefType}
                          onChange={(e) => setQFormRefType(e.target.value as ReferenceType)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                        >
                          <option value="Sample Data">1. Sample Data</option>
                          <option value="Blank Template">2. Blank Template</option>
                          <option value="Instruction / Guidance Document">3. Instruction / Guidance Document</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">File Format / Type:</label>
                        <select
                          value={qFormRefFileType}
                          onChange={(e) => setQFormRefFileType(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                        >
                          <option value="Excel">Excel Spreadsheet (.xlsx)</option>
                          <option value="PDF">PDF Document (.pdf)</option>
                          <option value="Word">Word Document (.docx)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Reference File Name:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={qFormRefFileName}
                          onChange={(e) => setQFormRefFileName(e.target.value)}
                          placeholder={qFormRefType === 'Sample Data' ? 'e.g. Sales_Report_Sample.xlsx' : qFormRefType === 'Blank Template' ? 'e.g. Trial_Balance_Template.xlsx' : 'e.g. Guidance_Document.pdf'}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const defaultName = qFormTitle ? `${qFormTitle.replace(/\s+/g, '_')}_${qFormRefType.replace(/\s+/g, '_')}.${qFormRefFileType === 'PDF' ? 'pdf' : 'xlsx'}` : 'Auditor_Sample_Reference.xlsx';
                            setQFormRefFileName(defaultName);
                            showToast('Generated reference file name.', 'info');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                        >
                          Auto-Name
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Reference Description / Instructions:</label>
                      <textarea
                        value={qFormRefDesc}
                        onChange={(e) => setQFormRefDesc(e.target.value)}
                        placeholder="e.g. Use this sample as a reference for the required format and fields."
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="qRefDisplayCheck"
                          checked={qFormRefDisplay}
                          onChange={(e) => setQFormRefDisplay(e.target.checked)}
                          className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <label htmlFor="qRefDisplayCheck" className="text-slate-300 text-[11px] cursor-pointer">
                          Display reference material to distributor
                        </label>
                      </div>

                      {editingItem?.referenceMaterial && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Current Version: v{editingItem.referenceMaterial.fileVersion}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Target Distributor Scope Selector (Real-Time Sync) */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="p-3.5 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-2">
                  <label className="text-white font-bold block text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                      <span>Target Distributor Account Scope:</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 font-semibold">
                      Real-Time Sync Active
                    </span>
                  </label>
                  <select
                    value={qFormTargetScope}
                    onChange={(e) => setQFormTargetScope(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-bold text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="selected">Current Selected Distributor: {selectedDistributorName}</option>
                    <option value="all">All Distributors under {selectedClientProp} ({activeDistributors.length} Accounts)</option>
                    {activeDistributors.map(d => (
                      <option key={d.id} value={d.name}>Specific Account: {d.name} ({d.code})</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {qFormTargetScope === 'all' 
                      ? `Saving will automatically push and sync this question in real time across ALL ${activeDistributors.length} distributor accounts under ${selectedClientProp}.` 
                      : `Saving will push and sync this question directly to the ${qFormTargetScope === 'selected' ? selectedDistributorName : qFormTargetScope} account in real time.`}
                  </p>
                </div>
              </div>
            </div>

            {/* FIXED FOOTER */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md shrink-0">
              {editingItem ? (
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteQuestionnaireItem(editingItem.id);
                    setIsQuestionnaireModalOpen(false);
                  }}
                  className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Item</span>
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuestionnaireModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestionnaireItem}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Save Requirement</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 5: Audit Trail Log Drawer */}
      {isAuditTrailOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-lg h-full p-6 flex flex-col justify-between space-y-4 shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">System Audit Trail Log</h3>
                </div>
                <button 
                  onClick={() => setIsAuditTrailOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                {auditTrail.map(log => (
                  <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-400">{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-200">{log.details}</p>
                    <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                      <span>User: {log.user}</span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsAuditTrailOpen(false)}
              className="w-full py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold"
            >
              Close Trail
            </button>
          </div>
        </div>
      )}

      {/* MODAL 7: Auditor Provided Sample / Reference Material Viewer & Interactive Preview */}
      {selectedItemForReference && selectedItemForReference.referenceMaterial && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header Banner */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 tracking-wide uppercase">
                      AUDITOR REFERENCE MATERIAL
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Req {selectedItemForReference.refNumber}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                    {selectedItemForReference.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedItemForReference(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-Navigation Tabs Bar */}
            <div className="px-5 pt-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setReferenceModalTab('preview')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    referenceModalTab === 'preview'
                      ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview & Reference File</span>
                </button>

                <button
                  onClick={() => setReferenceModalTab('history')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    referenceModalTab === 'history'
                      ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Version History ({selectedItemForReference.referenceMaterial.versionHistory?.length ? selectedItemForReference.referenceMaterial.versionHistory.length + 1 : 1})</span>
                </button>

                <button
                  onClick={() => setReferenceModalTab('logs')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    referenceModalTab === 'logs'
                      ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Access & Audit Log</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 pb-2">
                <span className="text-[10px] text-indigo-300/80 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                  Separate from Distributor Evidence
                </span>
              </div>
            </div>

            {/* Modal Scrollable Content Area */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* TAB 1: Preview & Reference File */}
              {referenceModalTab === 'preview' && (
                <div className="space-y-4">
                  {/* Distributor Notice Banner */}
                  <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 flex items-start gap-3">
                    <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-indigo-100">
                        Auditor-Provided Guidance & Reference Material
                      </p>
                      <p className="text-indigo-300/90 leading-relaxed text-[11px]">
                        This file is provided by the Anti-Corruption Audit Team as a <strong>{selectedItemForReference.referenceMaterial.referenceType}</strong>. Use it to understand the required column structure, fields, and level of detail for requirement {selectedItemForReference.refNumber}. <em>This material is separate from your uploaded evidence files and will not affect completion metrics.</em>
                      </p>
                    </div>
                  </div>

                  {/* Reference File Metadata Card */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                          {selectedItemForReference.referenceMaterial.fileType === 'Excel' ? (
                            <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
                          ) : (
                            <FileText className="h-6 w-6 text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-white">
                              {selectedItemForReference.referenceMaterial.fileName}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                              {selectedItemForReference.referenceMaterial.referenceType}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                              v{selectedItemForReference.referenceMaterial.fileVersion}.0
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {selectedItemForReference.referenceMaterial.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => handleDownloadReferenceMaterial(selectedItemForReference)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download Sample ({selectedItemForReference.referenceMaterial.fileSizeMB} MB)</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-500 block">Uploaded By:</span>
                        <span className="text-slate-200 font-medium">{selectedItemForReference.referenceMaterial.uploadedBy}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Upload Date:</span>
                        <span className="text-slate-200 font-mono">{selectedItemForReference.referenceMaterial.uploadDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">File Type:</span>
                        <span className="text-slate-200 font-medium">{selectedItemForReference.referenceMaterial.fileType} (.{selectedItemForReference.referenceMaterial.fileType === 'PDF' ? 'pdf' : 'xlsx'})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Auditor Status:</span>
                        <span className="text-emerald-400 font-semibold">Active Reference</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Document / Spreadsheet Live Preview Component */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-bold text-slate-200">Interactive Reference File Preview</span>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                          {selectedItemForReference.referenceMaterial.fileName}
                        </span>
                      </div>
                      <button
                        onClick={() => setReferencePreviewActive(!referencePreviewActive)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                      >
                        {referencePreviewActive ? 'Collapse Preview' : 'Expand Preview'}
                      </button>
                    </div>

                    {referencePreviewActive && (
                      <div className="p-4 space-y-3">
                        {selectedItemForReference.referenceMaterial.fileType === 'Excel' || selectedItemForReference.referenceMaterial.fileName.endsWith('.xlsx') ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                                Spreadsheet Sheet 1: {selectedItemForReference.referenceMaterial.referenceType}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">Read-Only Sample View</span>
                            </div>

                            {/* Sample Spreadsheet Table Rendering */}
                            <div className="overflow-x-auto border border-slate-800 rounded-lg">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-900 text-indigo-300 font-mono border-b border-slate-800">
                                    <th className="p-2 border-r border-slate-800 text-[10px] text-slate-500">#</th>
                                    {selectedItemForReference.refNumber === '1.4' ? (
                                      <>
                                        <th className="p-2 border-r border-slate-800">Fiscal Period</th>
                                        <th className="p-2 border-r border-slate-800">Gross Revenue ($)</th>
                                        <th className="p-2 border-r border-slate-800">Net Revenue ($)</th>
                                        <th className="p-2 border-r border-slate-800 font-sans">Required Tax Clearance Ref</th>
                                        <th className="p-2">Auditor Notes</th>
                                      </>
                                    ) : (
                                      <>
                                        <th className="p-2 border-r border-slate-800">Entity / Department</th>
                                        <th className="p-2 border-r border-slate-800">Officer / Lead Name</th>
                                        <th className="p-2 border-r border-slate-800">Compliance Role</th>
                                        <th className="p-2 border-r border-slate-800">Reporting Line</th>
                                        <th className="p-2">Verification Document</th>
                                      </>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/80 font-mono text-[11px] text-slate-300">
                                  {selectedItemForReference.refNumber === '1.4' ? (
                                    <>
                                      <tr className="hover:bg-slate-900/50">
                                        <td className="p-2 border-r border-slate-800 text-slate-500">1</td>
                                        <td className="p-2 border-r border-slate-800 font-bold text-white">FY2024 - Q1</td>
                                        <td className="p-2 border-r border-slate-800 text-emerald-400">$1,450,000.00</td>
                                        <td className="p-2 border-r border-slate-800">$1,280,000.00</td>
                                        <td className="p-2 border-r border-slate-800 font-sans text-indigo-300">TAX-2024-8841-A</td>
                                        <td className="p-2 font-sans text-slate-400">Standard audited quarterly statement</td>
                                      </tr>
                                      <tr className="hover:bg-slate-900/50">
                                        <td className="p-2 border-r border-slate-800 text-slate-500">2</td>
                                        <td className="p-2 border-r border-slate-800 font-bold text-white">FY2024 - Q2</td>
                                        <td className="p-2 border-r border-slate-800 text-emerald-400">$1,620,000.00</td>
                                        <td className="p-2 border-r border-slate-800">$1,410,000.00</td>
                                        <td className="p-2 border-r border-slate-800 font-sans text-indigo-300">TAX-2024-9102-B</td>
                                        <td className="p-2 font-sans text-slate-400">Includes mid-year tax clearance</td>
                                      </tr>
                                      <tr className="hover:bg-slate-900/50">
                                        <td className="p-2 border-r border-slate-800 text-slate-500">3</td>
                                        <td className="p-2 border-r border-slate-800 font-bold text-white">FY2024 - Q3</td>
                                        <td className="p-2 border-r border-slate-800 text-emerald-400">$1,780,000.00</td>
                                        <td className="p-2 border-r border-slate-800">$1,550,000.00</td>
                                        <td className="p-2 border-r border-slate-800 font-sans text-indigo-300">TAX-2024-9450-C</td>
                                        <td className="p-2 font-sans text-slate-400">Audited by External Certified CPA</td>
                                      </tr>
                                      <tr className="bg-indigo-950/40 font-bold border-t-2 border-indigo-500/40 text-indigo-200">
                                        <td className="p-2 border-r border-slate-800">SUM</td>
                                        <td className="p-2 border-r border-slate-800">FY2024 Total</td>
                                        <td className="p-2 border-r border-slate-800 text-emerald-300">$4,850,000.00</td>
                                        <td className="p-2 border-r border-slate-800">$4,240,000.00</td>
                                        <td className="p-2 border-r border-slate-800 font-sans text-xs">Annual Clearance Attached</td>
                                        <td className="p-2 font-sans text-xs text-indigo-300">Expected sample format</td>
                                      </tr>
                                    </>
                                  ) : (
                                    <>
                                      <tr className="hover:bg-slate-900/50">
                                        <td className="p-2 border-r border-slate-800 text-slate-500">1</td>
                                        <td className="p-2 border-r border-slate-800 font-bold text-white">Executive Management</td>
                                        <td className="p-2 border-r border-slate-800">Robert Vance</td>
                                        <td className="p-2 border-r border-slate-800 text-indigo-300">Managing Director</td>
                                        <td className="p-2 border-r border-slate-800">Board of Directors</td>
                                        <td className="p-2 font-sans text-slate-400">Board Appointment Resolution</td>
                                      </tr>
                                      <tr className="hover:bg-slate-900/50">
                                        <td className="p-2 border-r border-slate-800 text-slate-500">2</td>
                                        <td className="p-2 border-r border-slate-800 font-bold text-white">Ethics & Compliance</td>
                                        <td className="p-2 border-r border-slate-800">Elena Rostova</td>
                                        <td className="p-2 border-r border-slate-800 text-emerald-400">Compliance Officer</td>
                                        <td className="p-2 border-r border-slate-800">Audit Committee</td>
                                        <td className="p-2 font-sans text-slate-400">Independent Compliance Charter</td>
                                      </tr>
                                      <tr className="hover:bg-slate-900/50">
                                        <td className="p-2 border-r border-slate-800 text-slate-500">3</td>
                                        <td className="p-2 border-r border-slate-800 font-bold text-white">Finance & Accounting</td>
                                        <td className="p-2 border-r border-slate-800">David Thorne</td>
                                        <td className="p-2 border-r border-slate-800 text-indigo-300">Head of Finance</td>
                                        <td className="p-2 border-r border-slate-800">Managing Director</td>
                                        <td className="p-2 font-sans text-slate-400">Delegation of Authority (DoA)</td>
                                      </tr>
                                    </>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          /* Sample PDF / Document Guidance Preview */
                          <div className="p-5 bg-slate-900 rounded-lg border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-400" />
                                <span className="font-bold text-white text-sm">
                                  Anti-Corruption Audit Guidance Note #{selectedItemForReference.refNumber}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/20">
                                Official AA Audit Reference
                              </span>
                            </div>

                            <div className="space-y-2">
                              <h5 className="font-bold text-indigo-300 text-xs">1. Purpose & Scope</h5>
                              <p className="text-slate-300">
                                This guidance note outlines the mandatory standards for distributor submissions regarding requirement {selectedItemForReference.refNumber}. All evidence provided must be officially signed or stamped by authorized distributor representatives.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <h5 className="font-bold text-indigo-300 text-xs">2. Expected Format & Minimum Fields</h5>
                              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                                <li>Complete entity legal name matching the registered commercial license.</li>
                                <li>Clear breakdown of operational reporting lines and compliance oversight roles.</li>
                                <li>Explicit mention of anti-corruption / FCPA compliance responsibilities.</li>
                                <li>Valid stamp or digital signature with timestamp.</li>
                              </ul>
                            </div>

                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 font-mono">
                              <strong>Note:</strong> If you cannot provide documents matching this exact format, please provide a written explanation in the requirement response field outlining alternative governance documentation available.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Version History */}
              {referenceModalTab === 'history' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <h4 className="font-bold text-white mb-1">Reference Material Version History</h4>
                    <p className="text-slate-400 text-[11px]">
                      Auditors update reference templates as audit standards evolve. Below is the complete version history for requirement {selectedItemForReference.refNumber}.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {/* Current Active Version */}
                    <div className="p-3.5 bg-indigo-950/40 rounded-xl border border-indigo-500/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-white font-mono">
                            v{selectedItemForReference.referenceMaterial.fileVersion}.0 (Current Active)
                          </span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                            Active Reference
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {selectedItemForReference.referenceMaterial.uploadDate}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium">
                        {selectedItemForReference.referenceMaterial.fileName} ({selectedItemForReference.referenceMaterial.fileSizeMB} MB)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {selectedItemForReference.referenceMaterial.description}
                      </p>
                      <div className="text-[10px] text-indigo-300 pt-1 border-t border-indigo-500/20 flex justify-between">
                        <span>Uploaded by: {selectedItemForReference.referenceMaterial.uploadedBy}</span>
                        <span>Type: {selectedItemForReference.referenceMaterial.referenceType}</span>
                      </div>
                    </div>

                    {/* Historical Versions if any */}
                    {selectedItemForReference.referenceMaterial.versionHistory && selectedItemForReference.referenceMaterial.versionHistory.length > 0 ? (
                      selectedItemForReference.referenceMaterial.versionHistory.map((hist, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 opacity-80">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300 font-mono">
                              v{hist.version}.0 (Historical)
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {hist.uploadDate}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-mono">
                            {hist.fileName} ({hist.fileSizeMB} MB)
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {hist.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800/80">
                        No prior historical versions exist. This is the initial version (v1.0).
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Access & Audit Log */}
              {referenceModalTab === 'logs' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white mb-0.5">Reference Material Access & Activity Log</h4>
                      <p className="text-slate-400 text-[11px]">
                        Tracks all uploads, previews, and downloads for auditor-provided reference materials.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">
                      Requirement {selectedItemForReference.refNumber}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {referenceLogs.filter(l => l.requirementRef === selectedItemForReference.refNumber || l.referenceId === selectedItemForReference.referenceMaterial?.id).length > 0 ? (
                      referenceLogs
                        .filter(l => l.requirementRef === selectedItemForReference.refNumber || l.referenceId === selectedItemForReference.referenceMaterial?.id)
                        .map(log => (
                          <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  log.action === 'Uploaded' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                                  log.action === 'Downloaded' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                  'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                  {log.action}
                                </span>
                                <span className="font-semibold text-slate-200">{log.user}</span>
                                <span className="text-[10px] text-slate-500 font-mono">({log.userRole})</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                            </div>
                            <p className="text-slate-300 text-[11px] pl-1">{log.details}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900 font-mono">
                              <span>IP Address: {log.ipAddress}</span>
                              <span>Tenant: {selectedClientProp}</span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                        No recorded access logs for this reference material yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Auditor Reference Material • Anti-Corruption Audit FY26</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadReferenceMaterial(selectedItemForReference)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download File</span>
                </button>
                <button
                  onClick={() => setSelectedItemForReference(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
