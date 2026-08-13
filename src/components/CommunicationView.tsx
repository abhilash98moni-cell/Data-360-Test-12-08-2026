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
  FileCheck
} from 'lucide-react';
import { ThreadedMessage, UserSession, ConversationSummary } from '../types';
import { downloadFileFromApi } from '../lib/downloadHelper';
import { INITIAL_IIR_REQUESTS } from '../data/iirData';

interface CommunicationViewProps {
  currentUser: UserSession | null;
  selectedClient?: string;
  selectedDistributor?: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// Available Audit Requirements for "Link Requirement" feature
const AUDIT_REQUIREMENTS_LIST = INITIAL_IIR_REQUESTS.map(req => ({
  refNumber: req.refNumber,
  title: req.title,
  category: req.category
}));

// Helper to format date headers (Today, Yesterday, Date string)
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

// Helper to pick file icon based on file name extension
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
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [newMessageText, setNewMessageText] = useState('');
  
  // Filtering and Search
  const [distributorSearchQuery, setDistributorSearchQuery] = useState('');
  const [distributorFilterTab, setDistributorFilterTab] = useState<'ALL' | 'UNREAD' | 'INTERNAL'>('ALL');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [selectedRefFilter, setSelectedRefFilter] = useState<string>('ALL');

  // Interactive Popovers
  const [showParticipantsPopover, setShowParticipantsPopover] = useState(false);
  const [showRequirementPicker, setShowRequirementPicker] = useState(false);
  const [linkedRequirement, setLinkedRequirement] = useState<{ refNumber: string; title: string } | null>(null);

  // Scroll & New Messages Pill State
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [unreadIncomingCount, setUnreadIncomingCount] = useState(0);

  // File Attachments
  const [attachedFiles, setAttachedFiles] = useState<{ fileName: string; fileSizeMB: number; googleDriveFileId?: string }[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // Mobile navigation (LIST vs CHAT)
  const [mobileView, setMobileView] = useState<'LIST' | 'CHAT'>('LIST');

  // Error and Sending State
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

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

  // Scroll to bottom of chat feed
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setUnreadIncomingCount(0);
    setIsUserScrolledUp(false);
  };

  // Track scroll position to know if user is reading older history
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
      const data = await res.json();

      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);

        // If active conversation is not set, set default matching selection
        if (data.conversations.length > 0) {
          const defaultConv = data.conversations.find((c: ConversationSummary) => 
            selectedDistributor ? c.distributorName.toLowerCase().includes(selectedDistributor.toLowerCase()) : true
          ) || data.conversations[0];

          setActiveConvId(prev => prev || defaultConv.conversationId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 2. Fetch messages for active conversation
  const fetchMessagesForConversation = async (convId: string, silent = false) => {
    if (!convId) return;
    try {
      if (!silent) setLoadingMessages(true);
      const res = await fetch(`/api/discussions/messages?conversationId=${encodeURIComponent(convId)}&auditId=${selectedAuditId}`, {
        headers: userHeaders
      });
      
      if (!res.ok) {
        if (res.status === 403 && !silent) {
          if (showToast) showToast('Access Denied: You cannot view messages for another distributor conversation.', 'error');
        }
        setMessages([]);
        return;
      }

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
    } catch (err) {
      console.error('Failed to fetch discussion messages:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // 3. Mark conversation as read
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

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConvId) {
      fetchMessagesForConversation(activeConvId);
      setShowParticipantsPopover(false);
    }
  }, [activeConvId]);

  // Real-time automatic polling loop (syncs every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
      if (activeConvId) {
        fetchMessagesForConversation(activeConvId, true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeConvId, currentUser, isUserScrolledUp]);

  // Active conversation object
  const activeConversation = conversations.find(c => c.conversationId === activeConvId) || conversations[0];

  // Handle file upload to Google Drive via backend
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
      requestRef: linkedRequirement?.refNumber || (selectedRefFilter !== 'ALL' ? selectedRefFilter : undefined),
      requestTitle: linkedRequirement?.title || undefined,
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
        setSendError(errData.error || 'Message delivery failed. Click to retry.');
        if (showToast) showToast(`Message error: ${errData.error}`, 'error');
        return;
      }

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        setNewMessageText('');
        setAttachedFiles([]);
        setLinkedRequirement(null);
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

  // Keyboard shortcut: Enter to send, Shift+Enter for new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations for Auditor sidebar
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

  // Filter in-chat messages by search query and ref
  const filteredMessages = messages.filter(m => {
    const matchesRef = selectedRefFilter === 'ALL' || m.requestRef === selectedRefFilter;
    const matchesSearch = !chatSearchQuery || 
      m.content.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
      m.senderName.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
      m.senderOrganization.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
      (m.requestRef && m.requestRef.toLowerCase().includes(chatSearchQuery.toLowerCase()));

    return matchesRef && matchesSearch;
  });

  // Group messages chronologically with date headers and sender grouping
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
        {/* Date Separator Line */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-[1px] bg-slate-800" />
          <span className="text-[10px] font-bold tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full uppercase">
            {group.dateLabel}
          </span>
          <div className="flex-1 h-[1px] bg-slate-800" />
        </div>

        {/* Message Items */}
        {group.items.map((msg, idx) => {
          const isAuditorRole = msg.senderRole.toLowerCase().includes('aa') || msg.senderRole.toLowerCase().includes('auditor');
          const isMe = msg.senderEmail === currentUser?.email || msg.senderOrganization === currentUser?.organization;

          // Group consecutive messages from same sender within 5 minutes
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
                
                {/* Header (rendered for first in group) */}
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
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          isAuditorRole
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {isAuditorRole ? 'AUDITOR' : 'DISTRIBUTOR'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                          &bull; {msg.senderOrganization}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {msg.timestamp}
                    </span>
                  </div>
                )}

                {/* Linked Requirement Context Chip */}
                {msg.requestRef && (
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

                {/* Message Content */}
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>

                {/* Downloadable Attachment Cards */}
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

                {/* Consecutive Timestamp */}
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
    <div className="w-full p-3 sm:p-6 space-y-4 text-slate-100 animate-fade-in max-w-[1600px] mx-auto">
      
      {/* Top Workspace Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-indigo-400" />
              <span>DATA360 Audit Workspace</span>
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Sync</span>
            </span>
            <span className="text-xs text-slate-400">&bull; Step 10 Isolated Multi-Tenant Channels</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-indigo-400" />
            <span>Audit Communication & Clarification Threads</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {isDistributor 
              ? `Official audit discussion channel for ${currentUser?.organization}. Direct communication with Lead Auditor Sarah Jenkins.`
              : 'Isolated audit communication workspace. Multiple auditors collaborate on distributor conversations with zero cross-tenant leakage.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2.5 shadow-inner">
            <Building2 className="h-4 w-4 text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Organization</span>
              <span className="font-bold text-white">{currentUser?.organization}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[680px]">

        {/* ==================================================================== */}
        {/* LEFT PANEL: AUDITOR DISTRIBUTOR SELECTOR SIDEBAR                      */}
        {/* ==================================================================== */}
        {!isDistributor && (
          <div className={`lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl h-[680px] ${
            mobileView === 'CHAT' ? 'hidden lg:flex' : 'flex'
          }`}>
            
            {/* Sidebar Title */}
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

            {/* Search Input */}
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

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800/80 rounded-xl text-[11px]">
              <button
                onClick={() => setDistributorFilterTab('ALL')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition-all ${
                  distributorFilterTab === 'ALL' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDistributorFilterTab('UNREAD')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                  distributorFilterTab === 'UNREAD' 
                    ? 'bg-rose-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Unread</span>
              </button>
              <button
                onClick={() => setDistributorFilterTab('INTERNAL')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition-all ${
                  distributorFilterTab === 'INTERNAL' 
                    ? 'bg-emerald-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Internal
              </button>
            </div>

            {/* Distributor Cards Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loading ? (
                // Skeleton loading state
                <div className="space-y-2.5 py-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-3.5 bg-slate-950/60 border border-slate-800/60 rounded-xl space-y-2 animate-pulse">
                      <div className="h-3 bg-slate-800 rounded w-2/3" />
                      <div className="h-2 bg-slate-800/80 rounded w-1/3" />
                      <div className="h-2 bg-slate-800/50 rounded w-full" />
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
                            isInternalRoom 
                              ? 'bg-emerald-400' 
                              : isActive 
                                ? 'bg-indigo-400 animate-pulse' 
                                : 'bg-slate-600'
                          }`} />
                          <span className="font-bold text-xs text-white truncate max-w-[160px]">
                            {conv.distributorName}
                          </span>
                        </div>

                        {conv.unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold rounded-full flex items-center gap-1 animate-bounce shrink-0">
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

        {/* ==================================================================== */}
        {/* RIGHT PANEL: CHAT WORKSPACE & COMPOSER                              */}
        {/* ==================================================================== */}
        <div className={`${
          isDistributor ? 'lg:col-span-12' : 'lg:col-span-8'
        } ${
          mobileView === 'LIST' && !isDistributor ? 'hidden lg:flex' : 'flex'
        } bg-slate-900 border border-slate-800 rounded-2xl flex-col shadow-xl h-[680px] overflow-hidden relative`}>

          {/* ACTIVE CHAT HEADER */}
          <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            
            <div className="flex items-center gap-3">
              {/* Mobile Back Button for Auditors */}
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

            {/* Participants Popover Button + In-Chat Filter & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Participants Indicator */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowParticipantsPopover(!showParticipantsPopover)}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="View discussion participants"
                >
                  <Users className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-bold">
                    {activeConversation?.distributorId === 'internal-auditors' ? '3 Auditors' : '4 Participants'}
                  </span>
                </button>

                {/* Participants Popover Modal */}
                {showParticipantsPopover && (
                  <div className="absolute right-0 top-10 w-72 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 animate-fade-in text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-bold text-white uppercase text-[10px] tracking-wider">
                        PEOPLE IN THIS DISCUSSION
                      </span>
                      <button 
                        onClick={() => setShowParticipantsPopover(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Auditors */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                        Audit Team (Apex Audit Practice)
                      </span>
                      <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <span className="font-bold">Sarah Jenkins</span>
                          <span className="text-[9px] text-indigo-300 font-mono">(Lead Auditor)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <span className="font-bold">Abhilash S</span>
                          <span className="text-[9px] text-slate-400 font-mono">(Audit Associate)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <span className="font-bold">Marcus Chen</span>
                          <span className="text-[9px] text-slate-400 font-mono">(Audit Associate)</span>
                        </div>
                      </div>
                    </div>

                    {/* Distributor Reps */}
                    {activeConversation?.distributorId !== 'internal-auditors' && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Distributor Representative
                        </span>
                        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="font-bold">
                              {isDistributor ? currentUser?.name : 'David Vance'}
                            </span>
                            <span className="text-[9px] text-emerald-300 font-mono">(Compliance Lead)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* In-Chat Message Search */}
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

              {/* Requirement Ref Filter */}
              <select
                value={selectedRefFilter}
                onChange={(e) => setSelectedRefFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Ref Codes</option>
                <option value="1.1">Ref #1.1 (Org Chart)</option>
                <option value="1.2">Ref #1.2 (Tax License)</option>
                <option value="2.1">Ref #2.1 (ERP Sales Register)</option>
                <option value="3.1">Ref #3.1 (Volume Rebates)</option>
              </select>

              <button 
                onClick={() => fetchMessagesForConversation(activeConvId)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 cursor-pointer"
                title="Refresh messages"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
              </button>
            </div>

          </div>

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

          {/* Floating "↓ New Messages" Indicator Pill */}
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

          {/* Error Banner with Retry */}
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

          {/* PENDING ATTACHMENTS & LINKED REQUIREMENT PREVIEW BAR */}
          {(attachedFiles.length > 0 || linkedRequirement) && (
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
              
              {/* Linked Requirement Chip */}
              {linkedRequirement && (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-950/80 border border-indigo-500/50 rounded-xl text-indigo-200 font-bold">
                  <Link2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Ref #{linkedRequirement.refNumber}: {linkedRequirement.title}</span>
                  <button 
                    type="button" 
                    onClick={() => setLinkedRequirement(null)}
                    className="p-0.5 hover:text-white text-indigo-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Attached File Chips */}
              {attachedFiles.map((att, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-xl text-slate-200">
                  {getFileIcon(att.fileName)}
                  <span className="truncate max-w-[150px] font-medium">{att.fileName}</span>
                  <button 
                    type="button" 
                    onClick={() => removeAttachment(idx)}
                    className="p-0.5 hover:text-rose-400 text-slate-400"
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

            {/* Composer Action Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              
              <div className="flex items-center gap-2 relative flex-wrap">
                
                {/* File Attachment Button */}
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

                {/* Link Requirement Button */}
                <button
                  type="button"
                  onClick={() => setShowRequirementPicker(!showRequirementPicker)}
                  className={`px-3 py-1.5 border rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    linkedRequirement 
                      ? 'bg-indigo-950 border-indigo-500 text-indigo-300 font-bold' 
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                  title="Link an audit requirement to this message"
                >
                  <Link2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{linkedRequirement ? `Ref #${linkedRequirement.refNumber}` : 'Link Requirement'}</span>
                </button>

                {/* Requirement Picker Popover */}
                {showRequirementPicker && (
                  <div className="absolute left-0 bottom-10 w-72 bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl z-50 animate-fade-in text-xs space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800 font-bold text-white text-[10px] uppercase tracking-wider">
                      <span>SELECT REQUIREMENT TO LINK</span>
                      <button onClick={() => setShowRequirementPicker(false)} className="text-slate-400 hover:text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {AUDIT_REQUIREMENTS_LIST.map((req, reqIdx) => (
                      <div
                        key={reqIdx}
                        onClick={() => {
                          setLinkedRequirement({ refNumber: req.refNumber, title: req.title });
                          setShowRequirementPicker(false);
                        }}
                        className="p-2 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-indigo-500/30"
                      >
                        <div className="font-bold text-indigo-300 text-[11px]">Ref #{req.refNumber}</div>
                        <div className="text-[10px] text-slate-300 truncate">{req.title}</div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Send Button */}
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

        </div>

      </div>

    </div>
  );
};
