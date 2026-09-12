import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Building2, 
  Clock, 
  Search, 
  FileText, 
  Filter,
  Download,
  AlertCircle,
  RefreshCw,
  X,
  Lock,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Link2,
  AtSign,
  ArrowDown,
  ChevronLeft,
  Info,
  MoreVertical,
  Sparkles,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  Maximize2,
  Minimize2,
  UserPlus,
  UserMinus,
  Check,
  HelpCircle,
  Layers,
  FileQuestion,
  Calculator,
  ShieldAlert
} from 'lucide-react';
import { ThreadedMessage, UserSession, ConversationSummary, ConversationParticipant } from '../types';
import { downloadFileFromApi } from '../lib/downloadHelper';
import { INITIAL_IIR_REQUESTS } from '../data/iirData';
import { BUSINESS_QUESTIONNAIRE_SECTIONS } from '../data/questionnaireData';

interface CommunicationViewProps {
  currentUser: UserSession | null;
  selectedClient?: string;
  selectedDistributor?: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// Available Audit Requirements for "IRL Requirement" context
const AUDIT_REQUIREMENTS_LIST = INITIAL_IIR_REQUESTS.map(req => ({
  refNumber: req.refNumber,
  title: req.title,
  category: req.category
}));

// Available Questionnaire Questions
const QUESTIONNAIRE_QUESTIONS_LIST = BUSINESS_QUESTIONNAIRE_SECTIONS.flatMap(sec => 
  sec.questions.map(q => ({
    id: q.questionNumber,
    section: sec.shortTitle,
    text: q.questionText
  }))
);

// Sample Items List for Sampling Context
const SAMPLING_ITEMS_LIST = [
  { id: 'Sample 01', label: 'Sample 01 — Q2 Sales Ledger Population ($1.42M)' },
  { id: 'Sample 02', label: 'Sample 02 — Credit Note #CN-9042 MDF Rebate ($84,200)' },
  { id: 'Sample 03', label: 'Sample 03 — Tier 2 Volume Incentive Discount ($112,500)' },
  { id: 'Sample 04', label: 'Sample 04 — Q1 Freight Invoice Reconciliations ($45,100)' },
];

// Helper to format date headers
const formatDateHeader = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

// Helper to pick file icon
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />;
  }
  if (['pdf'].includes(ext)) {
    return <FileText className="h-4 w-4 text-rose-400 shrink-0" />;
  }
  if (['doc', 'docx'].includes(ext)) {
    return <FileCheck className="h-4 w-4 text-blue-400 shrink-0" />;
  }
  return <FileCode className="h-4 w-4 text-indigo-400 shrink-0" />;
};

export const CommunicationView: React.FC<CommunicationViewProps> = ({
  currentUser,
  selectedDistributor,
  showToast
}) => {
  // State variables
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<ThreadedMessage[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [loadingParticipants, setLoadingParticipants] = useState<boolean>(false);
  const [newMessageText, setNewMessageText] = useState('');
  
  // Filtering and Search
  const [distributorSearchQuery, setDistributorSearchQuery] = useState('');
  const [distributorFilterTab, setDistributorFilterTab] = useState<'ALL' | 'UNREAD' | 'INTERNAL'>('ALL');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [selectedRefFilter, setSelectedRefFilter] = useState<string>('ALL');

  // Interactive Drawers & Popovers
  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showContextPicker, setShowContextPicker] = useState(false);

  // New Participant Form State
  const [newPartName, setNewPartName] = useState('');
  const [newPartEmail, setNewPartEmail] = useState('');
  const [newPartRole, setNewPartRole] = useState('Auditor');
  const [newPartOrg, setNewPartOrg] = useState('Apex Audit Practice (AA)');
  const [isAddingPart, setIsAddingPart] = useState(false);

  // Context Selection State
  const [contextType, setContextType] = useState<'GENERAL' | 'IRL' | 'QUESTIONNAIRE' | 'SAMPLING'>('GENERAL');
  const [selectedContextId, setSelectedContextId] = useState<string>('');
  const [selectedContextLabel, setSelectedContextLabel] = useState<string>('');

  // Scroll & New Messages Pill State
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [unreadIncomingCount, setUnreadIncomingCount] = useState(0);

  // File Attachments
  const [attachedFiles, setAttachedFiles] = useState<{ fileName: string; fileSizeMB: number; googleDriveFileId?: string }[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // Mobile navigation (LIST vs CHAT)
  const [mobileView, setMobileView] = useState<'LIST' | 'CHAT'>('LIST');

  // Full Screen Mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Error and Access Denied State
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDistributor = currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor');
  const selectedAuditId = 'eng-101';

  const userHeaders = {
    'x-user-role': currentUser?.role || 'Auditor',
    'x-user-organization': currentUser?.organization || 'Apex Audit Practice (AA)',
    'x-user-email': currentUser?.email || 'user@company.com',
    'x-user-name': currentUser?.name || 'Authorized User'
  };

  // Scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setUnreadIncomingCount(0);
    setIsUserScrolledUp(false);
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 100;
    setIsUserScrolledUp(isUp);
    if (!isUp) {
      setUnreadIncomingCount(0);
    }
  };

  // 1. Fetch conversations list
  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/discussions/conversations?auditId=${selectedAuditId}`, {
        headers: userHeaders
      });
      if (!res.ok) return;
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return;

      const data = await res.json();

      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);

        if (data.conversations.length > 0) {
          const defaultConv = data.conversations.find((c: ConversationSummary) => 
            selectedDistributor ? c.distributorName.toLowerCase().includes(selectedDistributor.toLowerCase()) : true
          ) || data.conversations[0];

          setActiveConvId(prev => prev || defaultConv.conversationId);
        }
      }
    } catch (err: any) {
      if (!silent) {
        console.warn('Conversations fetch notice:', err?.message || err);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 2. Fetch messages for active conversation
  const fetchMessagesForConversation = async (convId: string, silent = false) => {
    if (!convId) return;
    try {
      if (!silent) setLoadingMessages(true);
      setIsAccessDenied(false);

      const res = await fetch(`/api/discussions/messages?conversationId=${encodeURIComponent(convId)}&auditId=${selectedAuditId}`, {
        headers: userHeaders
      });
      
      if (!res.ok) {
        if (res.status === 403) {
          setIsAccessDenied(true);
          const errJson = await res.json().catch(() => ({ error: 'Access Denied' }));
          if (showToast && !silent) showToast(errJson.error || 'Access Denied: Removed from conversation.', 'error');
        }
        setMessages([]);
        return;
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return;

      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(prev => {
          if (silent) {
            const newCount = data.messages.length - prev.length;
            if (newCount > 0) {
              if (isUserScrolledUp) {
                setUnreadIncomingCount(c => c + newCount);
              } else {
                setTimeout(() => scrollToBottom('smooth'), 100);
              }
            }
          }
          return data.messages;
        });

        if (!silent) {
          setTimeout(() => scrollToBottom('auto'), 100);
        }

        markConversationAsRead(convId);
      }
    } catch (err: any) {
      if (!silent) {
        console.warn('Discussion messages fetch notice:', err?.message || err);
      }
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // 3. Fetch participants for active conversation
  const fetchParticipants = async (convId: string) => {
    if (!convId) return;
    try {
      setLoadingParticipants(true);
      const res = await fetch(`/api/discussions/participants?conversationId=${encodeURIComponent(convId)}`, {
        headers: userHeaders
      });
      if (!res.ok) return;
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return;

      const data = await res.json();
      if (data.success && Array.isArray(data.participants)) {
        setParticipants(data.participants);
      }
    } catch (err: any) {
      console.warn('Participants fetch notice:', err?.message || err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  // 4. Add Participant Handler
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim() || !newPartEmail.trim() || !activeConvId) return;

    try {
      setIsAddingPart(true);
      const res = await fetch('/api/discussions/participants/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...userHeaders
        },
        body: JSON.stringify({
          conversationId: activeConvId,
          userName: newPartName.trim(),
          userEmail: newPartEmail.trim(),
          userRole: newPartRole,
          userOrganization: newPartOrg
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (showToast) showToast(data.error || 'Failed to add participant', 'error');
        return;
      }

      if (showToast) showToast(`Added ${newPartName} to conversation.`, 'success');
      setShowAddParticipantModal(false);
      setNewPartName('');
      setNewPartEmail('');
      fetchParticipants(activeConvId);
    } catch (err: any) {
      if (showToast) showToast(`Failed to add participant: ${err.message}`, 'error');
    } finally {
      setIsAddingPart(false);
    }
  };

  // 5. Remove Participant Handler
  const handleRemoveParticipant = async (userEmail: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} (${userEmail}) from this discussion?\n\nNote: Removing a user prevents them from sending or viewing future messages, but all historical audit messages posted by them will remain permanently preserved in the audit log.`)) {
      return;
    }

    try {
      const res = await fetch('/api/discussions/participants/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...userHeaders
        },
        body: JSON.stringify({
          conversationId: activeConvId,
          userEmail
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (showToast) showToast(data.error || 'Failed to remove participant', 'error');
        return;
      }

      if (showToast) showToast(`Removed ${userName}. Historical audit logs preserved.`, 'info');
      fetchParticipants(activeConvId);
    } catch (err: any) {
      if (showToast) showToast(`Failed to remove participant: ${err.message}`, 'error');
    }
  };

  // Mark conversation as read
  const markConversationAsRead = async (convId: string) => {
    try {
      await fetch('/api/discussions/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...userHeaders
        },
        body: JSON.stringify({ conversationId: convId })
      });

      setConversations(prev => prev.map(c => 
        c.conversationId === convId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [currentUser, selectedDistributor]);

  // Load messages & participants when active conversation changes
  useEffect(() => {
    if (activeConvId) {
      fetchMessagesForConversation(activeConvId);
      fetchParticipants(activeConvId);
    }
  }, [activeConvId]);

  // Real-time automatic polling loop (syncs every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
      if (activeConvId && !isAccessDenied) {
        fetchMessagesForConversation(activeConvId, true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeConvId, currentUser, isUserScrolledUp, isAccessDenied]);

  // Active conversation object
  const activeConversation = conversations.find(c => c.conversationId === activeConvId) || conversations[0];

  // Handle file upload
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setIsUploadingAttachment(true);
      if (showToast) showToast(`Uploading "${file.name}" to Google Drive...`, 'info');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('auditId', selectedAuditId);
      formData.append('clientName', 'Apex Electronics Corp');
      formData.append('distributorName', activeConversation?.distributorName || currentUser?.organization || 'Midwest Trading Co.');
      formData.append('uploadedBy', currentUser?.name || 'Authorized User');
      formData.append('isReference', 'false');

      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errJson.error || 'Google Drive file upload failed');
      }

      const uploadData = await uploadRes.json();
      const driveFileId = uploadData.googleDriveFileId || uploadData.id;

      setAttachedFiles(prev => [
        ...prev,
        {
          fileName: file.name,
          fileSizeMB: Number((file.size / (1024 * 1024)).toFixed(2)),
          googleDriveFileId: driveFileId
        }
      ]);

      if (showToast) showToast(`File "${file.name}" attached successfully.`, 'success');
    } catch (err: any) {
      console.error('Attachment upload error:', err);
      if (showToast) showToast(`Attachment upload failed: ${err.message}`, 'error');
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim() && attachedFiles.length === 0) return;

    setSendError(null);
    setIsSending(true);

    const payload = {
      conversationId: activeConvId,
      auditId: selectedAuditId,
      distributorId: activeConversation?.distributorId,
      contextType,
      contextId: selectedContextId || undefined,
      contextLabel: selectedContextLabel || undefined,
      requestRef: selectedContextId || undefined,
      requestTitle: selectedContextLabel || undefined,
      content: newMessageText,
      attachments: attachedFiles
    };

    try {
      const res = await fetch('/api/discussions/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...userHeaders
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Message delivery failed' }));
        if (res.status === 403) {
          setIsAccessDenied(true);
        }
        setSendError(errData.error || 'Message delivery failed. Click to retry.');
        if (showToast) showToast(`Message error: ${errData.error}`, 'error');
        return;
      }

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        setNewMessageText('');
        setAttachedFiles([]);
        setContextType('GENERAL');
        setSelectedContextId('');
        setSelectedContextLabel('');
        setTimeout(() => scrollToBottom('smooth'), 100);
        fetchConversations(true);
      }
    } catch (err: any) {
      console.error('Failed to post discussion message:', err);
      setSendError('Network error while posting message. Click to retry.');
      if (showToast) showToast('Failed to post discussion message.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !distributorSearchQuery || 
      conv.distributorName.toLowerCase().includes(distributorSearchQuery.toLowerCase()) ||
      (conv.distributorCode && conv.distributorCode.toLowerCase().includes(distributorSearchQuery.toLowerCase())) ||
      (conv.distributorRegion && conv.distributorRegion.toLowerCase().includes(distributorSearchQuery.toLowerCase()));

    if (distributorFilterTab === 'UNREAD') {
      return matchesSearch && conv.unreadCount > 0;
    }
    if (distributorFilterTab === 'INTERNAL') {
      return matchesSearch && conv.distributorId === 'internal-auditors';
    }

    return matchesSearch;
  });

  // Filter messages
  const filteredMessages = messages.filter(m => {
    const matchesRef = selectedRefFilter === 'ALL' || m.requestRef === selectedRefFilter || m.contextId === selectedRefFilter;
    const matchesSearch = !chatSearchQuery || 
      m.content.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
      m.senderName.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
      m.senderOrganization.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
      (m.contextLabel && m.contextLabel.toLowerCase().includes(chatSearchQuery.toLowerCase()));

    return matchesRef && matchesSearch;
  });

  const activeParticipants = participants.filter(p => p.isActive);
  const inactiveParticipants = participants.filter(p => !p.isActive);

  // Context Badge Renderer
  const renderContextBadge = (msg: ThreadedMessage) => {
    if (!msg.contextType || msg.contextType === 'GENERAL') return null;

    if (msg.contextType === 'IRL') {
      return (
        <div className="mb-2.5 p-2 bg-indigo-950/80 border border-indigo-500/40 rounded-xl flex items-center gap-2 text-xs text-indigo-200">
          <Layers className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="font-bold">IRL Requirement:</span>
          <span className="truncate">{msg.contextLabel || `Ref #${msg.contextId || msg.requestRef}`}</span>
        </div>
      );
    }

    if (msg.contextType === 'QUESTIONNAIRE') {
      return (
        <div className="mb-2.5 p-2 bg-purple-950/80 border border-purple-500/40 rounded-xl flex items-center gap-2 text-xs text-purple-200">
          <FileQuestion className="h-3.5 w-3.5 text-purple-400 shrink-0" />
          <span className="font-bold">Business Questionnaire:</span>
          <span className="truncate">{msg.contextLabel || `Question ${msg.contextId}`}</span>
        </div>
      );
    }

    if (msg.contextType === 'SAMPLING') {
      return (
        <div className="mb-2.5 p-2 bg-amber-950/80 border border-amber-500/40 rounded-xl flex items-center gap-2 text-xs text-amber-200">
          <Calculator className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="font-bold">Sampling Item:</span>
          <span className="truncate">{msg.contextLabel || msg.contextId}</span>
        </div>
      );
    }

    return null;
  };

  // Group messages chronologically
  const renderGroupedMessages = () => {
    if (filteredMessages.length === 0) return null;

    const groups: { dateLabel: string; items: ThreadedMessage[] }[] = [];
    let currentDateLabel = '';
    let currentGroup: ThreadedMessage[] = [];

    filteredMessages.forEach(msg => {
      const dateLabel = formatDateHeader(msg.createdAt || msg.timestamp);
      if (dateLabel !== currentDateLabel) {
        if (currentGroup.length > 0) {
          groups.push({ dateLabel: currentDateLabel, items: currentGroup });
          currentGroup = [];
        }
        currentDateLabel = dateLabel;
      }
      currentGroup.push(msg);
    });

    if (currentGroup.length > 0) {
      groups.push({ dateLabel: currentDateLabel, items: currentGroup });
    }

    return groups.map((group, groupIdx) => (
      <div key={groupIdx} className="space-y-4">
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-[1px] bg-slate-800" />
          <span className="text-[10px] font-bold tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full uppercase">
            {group.dateLabel}
          </span>
          <div className="flex-1 h-[1px] bg-slate-800" />
        </div>

        {group.items.map((msg, idx) => {
          const isAuditorRole = msg.senderRole.toLowerCase().includes('aa') || msg.senderRole.toLowerCase().includes('auditor');
          const isMe = msg.senderEmail === currentUser?.email || msg.senderOrganization === currentUser?.organization;

          const prevMsg = idx > 0 ? group.items[idx - 1] : null;
          const msgTime = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
          const prevMsgTime = prevMsg?.createdAt ? new Date(prevMsg.createdAt).getTime() : 0;
          const isConsecutive = prevMsg && prevMsg.senderEmail === msg.senderEmail && 
            msgTime > 0 && prevMsgTime > 0 && (msgTime - prevMsgTime) < 300000;

          return (
            <div 
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group transition-all`}
            >
              <div className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 border shadow-md transition-all ${
                isMe 
                  ? 'bg-indigo-950/40 border-indigo-500/30 text-slate-100 rounded-tr-xs' 
                  : 'bg-slate-900/90 border-slate-800/90 text-slate-100 rounded-tl-xs'
              }`}>
                
                {!isConsecutive && (
                  <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <div className={`h-6 w-6 rounded-md font-bold text-[10px] flex items-center justify-center border shrink-0 ${
                        isAuditorRole
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {msg.senderName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white">{msg.senderName}</span>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {msg.timestamp}
                    </span>
                  </div>
                )}

                {/* Context Badge */}
                {renderContextBadge(msg)}

                {/* Legacy linked requirement */}
                {!msg.contextType && msg.requestRef && (
                  <div className="mb-2.5 p-2.5 bg-slate-950/80 border border-indigo-500/30 rounded-xl flex items-center gap-2.5 text-xs text-indigo-200 shadow-inner">
                    <Link2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                        Linked Requirement Ref #{msg.requestRef}
                      </span>
                      {msg.requestTitle && (
                        <span className="font-medium text-slate-200 truncate">{msg.requestTitle}</span>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>

                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-2">
                    {msg.attachments.map((att, attIdx) => (
                      <div
                        key={attIdx}
                        className="flex items-center gap-2.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs text-slate-200 transition-all group/att"
                      >
                        {getFileIcon(att.fileName)}
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-slate-200 truncate max-w-[170px]" title={att.fileName}>
                            {att.fileName}
                          </span>
                          <span className="text-[9px] text-slate-400">{att.fileSizeMB} MB</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const targetId = att.googleDriveFileId || 'attachment-file';
                            downloadFileFromApi(targetId, att.fileName, showToast);
                          }}
                          className="ml-1 p-1 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-200 rounded-lg transition-colors cursor-pointer"
                          title="Download file from Google Drive"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {isConsecutive && (
                  <div className="text-[9px] text-slate-500 font-mono text-right mt-1">
                    {msg.timestamp}
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div className={
      isFullscreen
        ? "fixed inset-0 z-[9999] bg-slate-950 p-2 sm:p-4 flex flex-col h-screen w-screen overflow-hidden text-slate-100 animate-fade-in"
        : "w-full p-3 sm:p-6 space-y-4 text-slate-100 animate-fade-in max-w-[1600px] mx-auto"
    }>
      
      {/* Top Header */}
      <div className={`bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0 ${isFullscreen ? 'mb-1' : ''}`}>
        <div>
          <h1 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-indigo-400" />
            <span>Audit Communication & Clarification Threads</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 ${
        isFullscreen ? 'flex-1 min-h-0 h-full overflow-hidden' : 'min-h-[680px]'
      }`}>

        {/* LEFT PANEL: DISTRIBUTOR CHANNELS */}
        {!isDistributor && (
          <div className={`lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl ${
            isFullscreen ? 'h-full min-h-0 overflow-hidden' : 'h-[680px]'
          } ${
            mobileView === 'CHAT' ? 'hidden lg:flex' : 'flex'
          }`}>
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-400" />
                  <span>DISTRIBUTORS</span>
                </h2>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Audit: DATA360 Audit 2026</p>
              </div>
              <button 
                onClick={() => fetchConversations()}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Refresh channels"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input 
                type="text"
                placeholder="Search distributors..."
                value={distributorSearchQuery}
                onChange={(e) => setDistributorSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800/80 rounded-xl text-[11px]">
              <button
                onClick={() => setDistributorFilterTab('ALL')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition-all ${
                  distributorFilterTab === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDistributorFilterTab('UNREAD')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition-all ${
                  distributorFilterTab === 'UNREAD' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setDistributorFilterTab('INTERNAL')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition-all ${
                  distributorFilterTab === 'INTERNAL' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Internal
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loading ? (
                <div className="space-y-2.5 py-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-3.5 bg-slate-950/60 border border-slate-800/60 rounded-xl space-y-2 animate-pulse">
                      <div className="h-3 bg-slate-800 rounded w-2/3" />
                      <div className="h-2 bg-slate-800/80 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <Search className="h-6 w-6 text-slate-600" />
                  <span>No matching distributor conversations found.</span>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const isActive = conv.conversationId === activeConvId;
                  const isInternalRoom = conv.distributorId === 'internal-auditors';

                  return (
                    <div
                      key={conv.conversationId}
                      onClick={() => {
                        setActiveConvId(conv.conversationId);
                        setMobileView('CHAT');
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                        isActive
                          ? 'bg-indigo-950/50 border-indigo-500/60 shadow-lg shadow-indigo-950/40'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${
                            isInternalRoom ? 'bg-emerald-400' : isActive ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'
                          }`} />
                          <span className="font-bold text-xs text-white truncate max-w-[160px]">
                            {conv.distributorName}
                          </span>
                        </div>

                        {conv.unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold rounded-full flex items-center gap-1 shrink-0">
                            <span>🔴</span>
                            <span>{conv.unreadCount}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                        <span className="font-mono text-slate-300 font-semibold">
                          {conv.distributorCode || 'DIST-000'} &bull; {conv.distributorRegion || 'Global'}
                        </span>
                      </div>

                      {conv.lastMessage ? (
                        <div className="text-[11px] text-slate-300 truncate pl-2 border-l-2 border-slate-800 flex items-center justify-between gap-2">
                          <p className="truncate">
                            <span className="font-semibold text-slate-400">{conv.lastMessage.senderName.split(' ')[0]}: </span>
                            {conv.lastMessage.content}
                          </p>
                          <span className="text-[9px] text-slate-400 font-mono shrink-0">{conv.lastMessage.timestamp.split(' at ')[1] || 'Today'}</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">No messages yet</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* RIGHT PANEL: CHAT FEED & COMPOSER */}
        <div className={`${
          isDistributor ? 'lg:col-span-12' : 'lg:col-span-8'
        } ${
          mobileView === 'LIST' && !isDistributor ? 'hidden lg:flex' : 'flex'
        } bg-slate-900 border border-slate-800 rounded-2xl flex-col shadow-xl ${
          isFullscreen ? 'h-full min-h-0' : 'h-[680px]'
        } overflow-hidden relative`}>

          {/* ACTIVE CHAT HEADER */}
          <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            
            <div className="flex items-center gap-3">
              {!isDistributor && (
                <button
                  onClick={() => setMobileView('LIST')}
                  className="lg:hidden p-2 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 cursor-pointer"
                  title="Back to distributors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <ShieldCheck className="h-3 w-3 text-indigo-400" />
                    <span>{activeConversation?.distributorCode || 'DIST-001'}</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    {activeConversation?.distributorRegion || 'Region'}
                  </span>
                </div>

                <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>
                    {isDistributor 
                      ? 'Official Audit Discussion Channel' 
                      : activeConversation?.distributorName || 'Midwest Trading Co.'}
                  </span>
                </h2>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Participants Drawer Button */}
              <button
                type="button"
                onClick={() => setShowParticipantsDrawer(!showParticipantsDrawer)}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Manage participants"
              >
                <Users className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-bold">{activeParticipants.length} Participants</span>
              </button>

              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search chat..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-32"
                />
              </div>

              <button 
                onClick={() => fetchMessagesForConversation(activeConvId)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 cursor-pointer"
                title="Refresh messages"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
              </button>
            </div>

          </div>

          {/* ACCESS DENIED BANNER */}
          {isAccessDenied ? (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center gap-4 bg-slate-950/90 text-rose-200">
              <div className="h-16 w-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-base font-extrabold text-white">Access Denied to Conversation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You have been removed from this discussion channel by the Lead Auditor. You can no longer post or read new messages in this thread.
                </p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-300">
                  <span className="font-bold text-amber-400">Audit Trail Preservation:</span> All historical messages sent by you prior to removal remain permanently preserved and locked in the system audit trail.
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* CHAT MESSAGES SCROLLABLE FEED */}
              <div 
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-950/60 relative"
              >
                {loadingMessages ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-center text-slate-400 max-w-sm mx-auto">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-white text-sm">Start the Audit Discussion</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isDistributor 
                        ? 'Your Lead Auditor is available here for clarification requests, document verifications, and audit support.'
                        : 'Use this dedicated channel to request evidence clarification, communicate with the distributor team, and record audit notes.'}
                    </p>
                  </div>
                ) : (
                  renderGroupedMessages()
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Floating "↓ New Messages" Indicator */}
              {unreadIncomingCount > 0 && (
                <div className="absolute bottom-24 right-6 z-30 animate-bounce">
                  <button
                    onClick={() => scrollToBottom('smooth')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-full shadow-xl flex items-center gap-1.5 cursor-pointer border border-indigo-400"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                    <span>{unreadIncomingCount} new message(s)</span>
                  </button>
                </div>
              )}

              {/* Error Banner */}
              {sendError && (
                <div className="px-4 py-2 bg-rose-950/80 border-t border-rose-500/40 text-xs text-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>{sendError}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleSendMessage()} 
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* PENDING ATTACHMENTS & CONTEXT PREVIEW BAR */}
              {(attachedFiles.length > 0 || (contextType !== 'GENERAL' && selectedContextLabel)) && (
                <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                  
                  {contextType !== 'GENERAL' && selectedContextLabel && (
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-950/80 border border-indigo-500/50 rounded-xl text-indigo-200 font-bold">
                      <Layers className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Context: {selectedContextLabel}</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setContextType('GENERAL');
                          setSelectedContextId('');
                          setSelectedContextLabel('');
                        }}
                        className="p-0.5 hover:text-white text-indigo-300 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {attachedFiles.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-xl text-slate-200">
                      {getFileIcon(att.fileName)}
                      <span className="truncate max-w-[150px] font-medium">{att.fileName}</span>
                      <button 
                        type="button" 
                        onClick={() => removeAttachment(idx)}
                        className="p-0.5 hover:text-rose-400 text-slate-400 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* MESSAGE COMPOSER FORM */}
              <form onSubmit={handleSendMessage} className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
                
                <div className="relative">
                  <textarea
                    rows={2}
                    required={attachedFiles.length === 0}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Type a message... (Press Enter to send, Shift+Enter for new line)`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Composer Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  
                  <div className="flex items-center gap-2 relative flex-wrap">
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleAttachmentUpload} 
                      className="hidden" 
                    />
                    <button 
                      type="button" 
                      disabled={isUploadingAttachment}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Attach file from Google Drive storage"
                    >
                      <Paperclip className={`h-3.5 w-3.5 text-indigo-400 ${isUploadingAttachment ? 'animate-spin' : ''}`} />
                      <span>{isUploadingAttachment ? 'Uploading...' : 'Attach File'}</span>
                    </button>

                    {/* Context Picker Button */}
                    <button
                      type="button"
                      onClick={() => setShowContextPicker(!showContextPicker)}
                      className={`px-3 py-1.5 border rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        contextType !== 'GENERAL' 
                          ? 'bg-indigo-950 border-indigo-500 text-indigo-300 font-bold' 
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                      }`}
                      title="Select message audit context"
                    >
                      <Layers className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{contextType !== 'GENERAL' ? `Context: ${contextType}` : 'Set Audit Context'}</span>
                    </button>

                    {/* Context Selection Modal Popover */}
                    {showContextPicker && (
                      <div className="absolute left-0 bottom-10 w-80 bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl z-50 animate-fade-in text-xs space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 font-bold text-white text-[10px] uppercase tracking-wider">
                          <span>SELECT CONTEXT TYPE</span>
                          <button onClick={() => setShowContextPicker(false)} className="text-slate-400 hover:text-white cursor-pointer">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Category Selector Tabs */}
                        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl text-[10px] font-bold">
                          {(['GENERAL', 'IRL', 'QUESTIONNAIRE', 'SAMPLING'] as const).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setContextType(type);
                                if (type === 'GENERAL') {
                                  setSelectedContextId('');
                                  setSelectedContextLabel('General Audit Discussion');
                                  setShowContextPicker(false);
                                }
                              }}
                              className={`py-1 rounded-lg transition-all ${
                                contextType === type ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {type.slice(0, 4)}
                            </button>
                          ))}
                        </div>

                        {/* List depending on context type */}
                        {contextType === 'IRL' && (
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold text-indigo-400 uppercase">IRL Requirement Items:</div>
                            {AUDIT_REQUIREMENTS_LIST.map((req, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setSelectedContextId(req.refNumber);
                                  setSelectedContextLabel(`Requirement ${req.refNumber} — ${req.title}`);
                                  setShowContextPicker(false);
                                }}
                                className="p-2 hover:bg-slate-800 rounded-xl cursor-pointer text-[11px] text-slate-200"
                              >
                                <span className="font-bold text-indigo-300">Ref #{req.refNumber}: </span>
                                <span className="truncate">{req.title}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {contextType === 'QUESTIONNAIRE' && (
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold text-purple-400 uppercase">Business Questionnaire Questions:</div>
                            {QUESTIONNAIRE_QUESTIONS_LIST.map((q, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setSelectedContextId(q.id);
                                  setSelectedContextLabel(`Question ${q.id} — ${q.section}`);
                                  setShowContextPicker(false);
                                }}
                                className="p-2 hover:bg-slate-800 rounded-xl cursor-pointer text-[11px] text-slate-200"
                              >
                                <span className="font-bold text-purple-300">Q{q.id}: </span>
                                <span className="truncate">{q.text.slice(0, 45)}...</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {contextType === 'SAMPLING' && (
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold text-amber-400 uppercase">Audit Samples:</div>
                            {SAMPLING_ITEMS_LIST.map((samp, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setSelectedContextId(samp.id);
                                  setSelectedContextLabel(samp.label);
                                  setShowContextPicker(false);
                                }}
                                className="p-2 hover:bg-slate-800 rounded-xl cursor-pointer text-[11px] text-slate-200"
                              >
                                <span className="font-bold text-amber-300">{samp.id}: </span>
                                <span className="truncate">{samp.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  <button
                    type="submit"
                    disabled={isSending || (!newMessageText.trim() && attachedFiles.length === 0)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:text-slate-500"
                  >
                    <span>{isSending ? 'Sending...' : 'Send Message'}</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>

                </div>

              </form>
            </>
          )}

        </div>

      </div>

      {/* PARTICIPANTS MANAGEMENT DRAWER */}
      {showParticipantsDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">Conversation Participants</h3>
              </div>
              <button 
                onClick={() => setShowParticipantsDrawer(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Add Participant Button (Auditor/Admin Only) */}
            {!isDistributor && (
              <button
                type="button"
                onClick={() => setShowAddParticipantModal(true)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Participant to Conversation</span>
              </button>
            )}

            {/* Active Participants List */}
            <div className="space-y-2">
              <div className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                <span>Active Members ({activeParticipants.length})</span>
              </div>

              {loadingParticipants ? (
                <div className="py-6 text-center text-xs text-slate-500">Loading participants...</div>
              ) : (
                activeParticipants.map(part => (
                  <div key={part.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                        <span>{part.userName}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{part.userEmail}</div>
                      <div className="text-[9px] text-indigo-300 font-mono mt-0.5">{part.userRole} &bull; {part.userOrganization}</div>
                    </div>

                    {!isDistributor && part.userEmail !== currentUser?.email && (
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(part.userEmail, part.userName)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg cursor-pointer"
                        title="Remove participant"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Inactive / Removed Participants */}
            {inactiveParticipants.length > 0 && (
              <div className="space-y-2 mt-4 pt-4 border-t border-slate-800">
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Removed Members ({inactiveParticipants.length})
                </div>

                {inactiveParticipants.map(part => (
                  <div key={part.id} className="p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl flex items-center justify-between gap-3 opacity-60">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-400 truncate line-through">{part.userName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{part.userEmail}</div>
                      <div className="text-[9px] text-rose-400 font-mono mt-0.5">Removed on {new Date(part.removedAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Preserved Audit Log Banner */}
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-[11px] text-indigo-200 space-y-1 mt-auto">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                <span>Audit Isolation & History Guarantee</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                When a user is removed from a conversation, they lose access to view or send future messages immediately. All historical messages posted by them remain permanently locked and preserved in the audit trail.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ADD PARTICIPANT MODAL */}
      {showAddParticipantModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-indigo-400" />
                <span>Add Person to Discussion</span>
              </h3>
              <button onClick={() => setShowAddParticipantModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Marcus Chen"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. m.chen@apex-audit.com"
                  value={newPartEmail}
                  onChange={(e) => setNewPartEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role</label>
                  <select
                    value={newPartRole}
                    onChange={(e) => setNewPartRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Auditor">Auditor</option>
                    <option value="Audit Manager">Audit Manager</option>
                    <option value="AA Super Admin">AA Super Admin</option>
                    <option value="Distributor Admin">Distributor Admin</option>
                    <option value="Distributor Employee">Distributor Employee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Organization</label>
                  <input 
                    type="text"
                    required
                    value={newPartOrg}
                    onChange={(e) => setNewPartOrg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddParticipantModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingPart}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isAddingPart ? 'Adding...' : 'Add Participant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

