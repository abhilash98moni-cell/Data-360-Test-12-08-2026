import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  AtSign, 
  UserCheck, 
  ShieldCheck, 
  Building2, 
  Clock, 
  Search, 
  FileText, 
  CornerDownRight,
  Filter
} from 'lucide-react';
import { ThreadedMessage, UserSession } from '../types';

interface CommunicationViewProps {
  currentUser: UserSession | null;
  selectedClient?: string;
  selectedDistributor?: string;
}

const INITIAL_MESSAGES: ThreadedMessage[] = [
  {
    id: 'msg-1',
    auditId: 'eng-001',
    requestRef: '1.1',
    senderName: 'Sarah Jenkins',
    senderEmail: 's.jenkins@apex-audit.com',
    senderRole: 'AA Super Admin',
    senderOrganization: 'Apex Audit Practice (AA)',
    timestamp: 'Today at 09:15 AM',
    content: 'Hi David, thank you for uploading the corporate registration document for Midwest Trading. Could you also verify if the tax clearance certificate covers Q2 2026?',
    mentions: ['@David Vance']
  },
  {
    id: 'msg-2',
    auditId: 'eng-001',
    requestRef: '1.1',
    senderName: 'David Vance',
    senderEmail: 'd.vance@midwesttrading.com',
    senderRole: 'Distributor Admin',
    senderOrganization: 'Midwest Trading Co.',
    timestamp: 'Today at 09:42 AM',
    content: 'Hello Sarah, yes! The attached state tax license is valid through December 2026. I have also attached our quarterly compliance statement for your reference.',
    replyToId: 'msg-1',
    attachments: [
      { fileName: 'State_Tax_Compliance_Statement_2026.pdf', fileSizeMB: 1.8 }
    ]
  },
  {
    id: 'msg-3',
    auditId: 'eng-001',
    requestRef: '3.1',
    senderName: 'Sarah Jenkins',
    senderEmail: 's.jenkins@apex-audit.com',
    senderRole: 'AA Super Admin',
    senderOrganization: 'Apex Audit Practice (AA)',
    timestamp: 'Today at 10:30 AM',
    content: 'We noticed a variance in credit note #CN-9042 regarding the MDF rebate calculation. Please check item 3.1 in the IRL section.',
    mentions: ['@David Vance']
  }
];

export const CommunicationView: React.FC<CommunicationViewProps> = ({
  currentUser,
  selectedDistributor
}) => {
  const [messages, setMessages] = useState<ThreadedMessage[]>(INITIAL_MESSAGES);
  const [newMessageText, setNewMessageText] = useState('');
  const [selectedRefFilter, setSelectedRefFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isDistributor = currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor');

  const filteredMessages = messages.filter(m => {
    // Multi-tenant isolation for messages: Distributors only see threads related to their organization or general audit
    if (isDistributor && m.senderOrganization !== (currentUser?.organization || 'Midwest Trading Co.') && !m.content.includes(currentUser?.name || '')) {
      // Allow viewing general audit communications
    }

    const matchesRef = selectedRefFilter === 'ALL' || m.requestRef === selectedRefFilter;
    const matchesSearch = m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.senderOrganization.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRef && matchesSearch;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const msg: ThreadedMessage = {
      id: `msg-${Date.now()}`,
      auditId: 'eng-001',
      requestRef: selectedRefFilter !== 'ALL' ? selectedRefFilter : '1.1',
      senderName: currentUser?.name || 'Authorized User',
      senderEmail: currentUser?.email || 'user@company.com',
      senderRole: (currentUser?.role as any) || 'Auditor',
      senderOrganization: currentUser?.organization || 'Data360 Platform',
      timestamp: 'Just now',
      content: newMessageText,
      mentions: newMessageText.includes('@') ? ['@AuditTeam'] : undefined
    };

    setMessages([...messages, msg]);
    setNewMessageText('');
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 text-slate-100 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Audit Collaboration Hub
            </span>
            <span className="text-xs text-slate-400">• Step 10 Threaded Discussions</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-indigo-400" />
            <span>Audit Discussions & Clarification Threads</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time threaded communications between Auditor Practice Leads and Distributor Compliance Teams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-400" />
            <span>{currentUser?.organization}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search discussion messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-400 font-medium">IRL Item Ref:</span>
          <select
            value={selectedRefFilter}
            onChange={(e) => setSelectedRefFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All IRL References</option>
            <option value="1.1">Ref #1.1 (Corporate Registration)</option>
            <option value="2.1">Ref #2.1 (ERP Sales Register)</option>
            <option value="3.1">Ref #3.1 (Volume Rebates)</option>
          </select>
        </div>
      </div>

      {/* Message Feed Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4 min-h-[400px]">
        
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No discussion messages recorded for this reference filter.
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.senderEmail === currentUser?.email;
            return (
              <div 
                key={msg.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isMe 
                    ? 'bg-indigo-950/30 border-indigo-500/40 ml-4 md:ml-12' 
                    : 'bg-slate-950/80 border-slate-800 mr-4 md:mr-12'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center border ${
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
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 font-mono text-[10px] font-bold text-indigo-300 rounded">
                        Ref #{msg.requestRef}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {msg.timestamp}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed mt-2 pl-10">
                  {msg.content}
                </p>

                {/* Attachments if any */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 pl-10 flex flex-wrap gap-2">
                    {msg.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300">
                        <FileText className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{att.fileName} ({att.fileSizeMB} MB)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="pt-4 border-t border-slate-800 space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              required
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder={`Post clarification message or reply to ${isDistributor ? 'Audit Team' : 'Distributor Representative'}... (Use @Name for mentions)`}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-12 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button type="button" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white" title="Attach file">
                <Paperclip className="h-4 w-4" />
              </button>
              <button type="button" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white" title="Mention team member">
                <AtSign className="h-4 w-4" />
              </button>
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Post Message</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

      </div>

    </div>
  );
};
