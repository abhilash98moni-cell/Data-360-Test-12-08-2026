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
  CheckCircle2
} from 'lucide-react';
import { ThreadedMessage, UserSession, ConversationSummary } from '../types';
import { downloadFileFromApi } from '../lib/downloadHelper';

interface CommunicationViewProps {
  currentUser: UserSession | null;
  selectedClient?: string;
  selectedDistributor?: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const CommunicationView: React.FC<CommunicationViewProps> = ({
  currentUser,
  selectedDistributor,
  showToast
}) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<ThreadedMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [selectedRefFilter, setSelectedRefFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // File Attachment State
  const [attachedFiles, setAttachedFiles] = useState<{ fileName: string; fileSizeMB: number; googleDriveFileId?: string }[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDistributor = currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor');
  const selectedAuditId = 'eng-101';

  const userHeaders = {
    'x-user-role': currentUser?.role || 'Auditor',
    'x-user-organization': currentUser?.organization || 'Apex Audit Practice (AA)',
    'x-user-email': currentUser?.email || 'user@company.com',
    'x-user-name': currentUser?.name || 'Authorized User'
  };

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

        // If active conversation is not set, set to first available
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
          // Compare if count changed to trigger smooth auto-scroll
          if (data.messages.length > prev.length && silent) {
            setTimeout(scrollToBottom, 100);
          }
          return data.messages;
        });

        if (!silent) {
          setTimeout(scrollToBottom, 100);
        }

        // Mark read
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

      // Update local unread status for that conversation card
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

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (activeConvId) {
      fetchMessagesForConversation(activeConvId);
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
  }, [activeConvId, currentUser]);

  // Active conversation object
  const activeConversation = conversations.find(c => c.conversationId === activeConvId) || conversations[0];

  // Handle uploading file attachment to Google Drive via backend
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setIsUploadingAttachment(true);
      if (showToast) showToast(`Uploading "${file.name}" to Google Drive storage...`, 'info');

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

  // Handle sending new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() && attachedFiles.length === 0) return;

    const payload = {
      conversationId: activeConvId,
      auditId: selectedAuditId,
      distributorId: activeConversation?.distributorId,
      requestRef: selectedRefFilter !== 'ALL' ? selectedRefFilter : undefined,
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
        if (showToast) showToast(`Message error: ${errData.error}`, 'error');
        return;
      }

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        setNewMessageText('');
        setAttachedFiles([]);
        setTimeout(scrollToBottom, 100);

        // Refresh conversation summaries for last message timestamp
        fetchConversations();
      }
    } catch (err: any) {
      console.error('Failed to post discussion message:', err);
      if (showToast) showToast('Failed to post discussion message.', 'error');
    }
  };

  // Filter messages by Ref and Search Query
  const filteredMessages = messages.filter(m => {
    const matchesRef = selectedRefFilter === 'ALL' || m.requestRef === selectedRefFilter;
    const matchesSearch = !searchQuery || 
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.senderOrganization.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRef && matchesSearch;
  });

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 text-slate-100 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Private Audit Channel
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Sync Active</span>
            </span>
            <span className="text-xs text-slate-400">&bull; Step 10 Isolated Conversations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-indigo-400" />
            <span>Audit Discussions & Clarification Threads</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {isDistributor 
              ? `Direct private communication channel with Lead Auditor Sarah Jenkins for ${currentUser?.organization}.`
              : 'Isolated multi-tenant conversation management. Messages and attachments remain completely separate per distributor.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2.5 shadow-inner">
            <Building2 className="h-4 w-4 text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Logged in as</span>
              <span className="font-bold text-white">{currentUser?.organization}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Conversation List (Auditors only) + Right Chat Room */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ==================================================================== */}
        {/* LEFT PANEL: AUDITOR CONVERSATIONS SIDEBAR (Hidden for Distributors)  */}
        {/* ==================================================================== */}
        {!isDistributor && (
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl h-[650px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Distributor Channels
                </h2>
              </div>
              <button 
                onClick={fetchConversations}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Refresh channel list"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* List of Conversations */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loading ? (
                <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
                  <span>Loading conversations...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No active distributor channels found.
                </div>
              ) : (
                conversations.map(conv => {
                  const isActive = conv.conversationId === activeConvId;
                  return (
                    <div
                      key={conv.conversationId}
                      onClick={() => setActiveConvId(conv.conversationId)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-indigo-950/50 border-indigo-500/60 shadow-lg shadow-indigo-950/40'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                          <span className="font-bold text-xs text-slate-100 truncate max-w-[170px]">
                            {conv.distributorName}
                          </span>
                        </div>

                        {conv.unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold rounded-full flex items-center gap-1 animate-bounce">
                            <span>🔴</span>
                            <span>{conv.unreadCount} unread</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2">
                        <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono">
                          {conv.distributorCode}
                        </span>
                        <span className="truncate">{conv.distributorRegion}</span>
                      </div>

                      {conv.lastMessage ? (
                        <p className="text-[11px] text-slate-300 truncate pl-3 border-l-2 border-slate-800">
                          <span className="font-semibold text-slate-400">{conv.lastMessage.senderName.split(' ')[0]}: </span>
                          {conv.lastMessage.content}
                        </p>
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
        {/* RIGHT PANEL: MAIN ISOLATED CHAT FEED                                  */}
        {/* ==================================================================== */}
        <div className={`${isDistributor ? 'lg:col-span-12' : 'lg:col-span-8'} bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-xl h-[650px] overflow-hidden`}>
          
          {/* Active Conversation Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Isolated Thread</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {activeConversation?.conversationId || `conv-eng-101-${currentUser?.organization}`}
                </span>
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isDistributor ? 'Official Audit Communication with Lead Auditor' : activeConversation?.distributorName}</span>
                {activeConversation?.distributorCode && (
                  <span className="text-xs font-mono font-normal text-slate-400">({activeConversation.distributorCode})</span>
                )}
              </h2>
            </div>

            {/* Filter & Search for Chat */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search in chat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-48"
                />
              </div>

              <select
                value={selectedRefFilter}
                onChange={(e) => setSelectedRefFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Ref Codes</option>
                <option value="1.1">Ref #1.1 (Org & Licensing)</option>
                <option value="2.1">Ref #2.1 (ERP Sales Register)</option>
                <option value="3.1">Ref #3.1 (Volume Rebates)</option>
              </select>
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-950/40">
            {loadingMessages ? (
              <div className="text-center py-20 text-slate-500 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                <span>Retrieving isolated conversation history...</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs flex flex-col items-center gap-2">
                <MessageSquare className="h-8 w-8 text-slate-700" />
                <span>No discussion messages in this isolated conversation yet.</span>
                <p className="text-[11px] text-slate-600">Type a message below to start the discussion.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.senderEmail === currentUser?.email || msg.senderOrganization === currentUser?.organization;
                return (
                  <div 
                    key={msg.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isMe 
                        ? 'bg-indigo-950/40 border-indigo-500/40 ml-4 sm:ml-12 shadow-md shadow-indigo-950/20' 
                        : 'bg-slate-900/90 border-slate-800/90 mr-4 sm:mr-12 shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center border shrink-0 ${
                          msg.senderRole.includes('AA') || msg.senderRole.includes('Auditor')
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {msg.senderName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-xs">{msg.senderName}</span>
                            <span className={`px-2 py-0.2 rounded text-[9px] font-bold border ${
                              msg.senderRole.includes('AA') || msg.senderRole.includes('Auditor')
                                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {msg.senderRole}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">{msg.senderOrganization}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {msg.requestRef && (
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 font-mono text-[10px] font-bold text-indigo-300 rounded">
                            Ref #{msg.requestRef}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed mt-1.5 pl-10 whitespace-pre-wrap">
                      {msg.content}
                    </p>

                    {/* Downloadable Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 pl-10 flex flex-wrap gap-2">
                        {msg.attachments.map((att, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const targetId = att.googleDriveFileId || 'attachment-file';
                              downloadFileFromApi(targetId, att.fileName, showToast);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-xs text-slate-200 transition-all cursor-pointer group"
                            title="Click to download file from Google Drive"
                          >
                            <FileText className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                            <span className="font-medium truncate max-w-[180px]">{att.fileName}</span>
                            <span className="text-[10px] text-slate-500">({att.fileSizeMB} MB)</span>
                            <Download className="h-3 w-3 text-slate-400 group-hover:text-indigo-300 ml-1" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Attachments Bar */}
          {attachedFiles.length > 0 && (
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                Pending Attachments:
              </span>
              {attachedFiles.map((att, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/60 border border-indigo-500/40 rounded-lg text-xs text-indigo-200">
                  <FileText className="h-3 w-3 text-indigo-400" />
                  <span className="truncate max-w-[150px]">{att.fileName}</span>
                  <button 
                    type="button" 
                    onClick={() => removeAttachment(idx)}
                    className="p-0.5 hover:text-white text-indigo-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
            <div className="relative">
              <textarea
                rows={2}
                required={attachedFiles.length === 0}
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={`Post clarification message in private channel for ${activeConversation?.distributorName || currentUser?.organization}...`}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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
                  title="Upload attachment to Google Drive"
                >
                  <Paperclip className={`h-3.5 w-3.5 text-indigo-400 ${isUploadingAttachment ? 'animate-spin' : ''}`} />
                  <span>{isUploadingAttachment ? 'Uploading...' : 'Attach File'}</span>
                </button>
              </div>

              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Send Message</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

        </div>

      </div>

    </div>
  );
};
