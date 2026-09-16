import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AuditEngagement,
  AuditFinding,
  SamplingRun,
  AuditAssignment,
  IIRRequestItem
} from '../types';
import { isItemComplete } from '../utils/irlValidation';
import { INITIAL_IIR_REQUESTS } from '../data/iirData';
import { TOTAL_BUSINESS_QUESTIONNAIRE_QUESTIONS } from '../data/questionnaireData';
import { UserSession } from './AuthModal';
import { CurrencyMode } from '../utils/currencyFormatter';
import {
  Building2,
  ChevronDown,
  Check,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  ArrowRight,
  Upload,
  FileText,
  MessageSquare,
  BarChart3,
  Calendar,
  Layers,
  Send,
  Download,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  FileSpreadsheet,
  Headphones
} from 'lucide-react';

interface DistributorExecutiveDashboardProps {
  engagements: AuditEngagement[];
  findings?: AuditFinding[];
  samplingRuns?: SamplingRun[];
  assignments?: AuditAssignment[];
  selectedEngagementId?: string;
  onSelectAuditContext?: (engagementId: string, distributorName?: string, clientName?: string) => void;
  onTabChange: (tab: any) => void;
  currentUser?: UserSession | null;
  currencyMode?: CurrencyMode;
}

const getIIRStorageKey = (client: string, dist: string) =>
  `data360_iir_reqs_${(client || 'default').replace(/\s+/g, '_')}_${(dist || 'default').replace(/\s+/g, '_')}`;

const loadIIRRequestsFromStorage = (client: string, dist: string, fallback: IIRRequestItem[]): IIRRequestItem[] => {
  if (typeof window === 'undefined') return fallback;
  const key = getIIRStorageKey(client, dist);
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {}
  }
  return fallback;
};

interface LiveMessageItem {
  id: string;
  sender: string;
  senderRole: string;
  content: string;
  timestamp: string;
  isAuditor: boolean;
}

export const DistributorExecutiveDashboard: React.FC<DistributorExecutiveDashboardProps> = ({
  engagements,
  findings = [],
  samplingRuns = [],
  assignments = [],
  selectedEngagementId,
  onSelectAuditContext,
  onTabChange,
  currentUser,
  currencyMode = 'INR'
}) => {
  // Determine distributor organization from live session
  const distOrg = currentUser?.organization || 'Midwest Trading Co.';

  // 1. Available audits for this distributor
  const availableAudits = useMemo(() => {
    const matched = engagements.filter(e =>
      (e.distributorName && e.distributorName.toLowerCase() === distOrg.toLowerCase()) ||
      e.title.toLowerCase().includes(distOrg.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(distOrg.toLowerCase()))
    );
    return matched.length > 0 ? matched : engagements;
  }, [engagements, distOrg]);

  // 2. Active selected audit
  const currentAudit = useMemo(() => {
    if (selectedEngagementId) {
      const found = engagements.find(e => e.id === selectedEngagementId || e.code === selectedEngagementId);
      if (found) return found;
    }
    return availableAudits[0] || engagements[0] || {
      id: 'eng-101',
      code: 'AUD-2026-DIST-001',
      title: 'Midwest Trading Co. Annual Compliance Audit',
      distributorName: distOrg,
      clientName: 'Apex Electronics Corp',
      status: 'Fieldwork',
      progressPercent: 78,
      period: 'FY2025-26',
      leadAuditor: 'Sarah Jenkins',
      leadAuditorEmail: 'sarah.jenkins@data360.audit',
      startDate: '2026-04-01',
      endDate: '2026-08-25'
    };
  }, [availableAudits, selectedEngagementId, engagements, distOrg]);

  const clientOrg = currentAudit.clientName || 'Apex Electronics Corp';

  // 3. Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAudit = (audit: AuditEngagement) => {
    if (onSelectAuditContext) {
      onSelectAuditContext(audit.id, audit.distributorName || audit.title, audit.clientName);
    }
    setIsDropdownOpen(false);
  };

  const getStatusBadgeClasses = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'fieldwork':
      case 'in progress':
      case 'active':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'review':
      case 'under review':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'planning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // 4. Live IRL Data
  const [iirRequests, setIirRequests] = useState<IIRRequestItem[]>(() =>
    loadIIRRequestsFromStorage(clientOrg, distOrg, INITIAL_IIR_REQUESTS)
  );

  useEffect(() => {
    const loaded = loadIIRRequestsFromStorage(clientOrg, distOrg, INITIAL_IIR_REQUESTS);
    setIirRequests(loaded);

    // Sync live from server
    fetch(`/api/iir/sync?client=${encodeURIComponent(clientOrg)}&distributor=${encodeURIComponent(distOrg)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.requests) && data.requests.length > 0) {
          setIirRequests(data.requests);
        }
      })
      .catch(() => {});
  }, [clientOrg, distOrg, currentAudit.id]);

  // 5. Live Questionnaire Data
  const [questionnaireAnswered, setQuestionnaireAnswered] = useState<number>(0);
  const [questionnaireLocked, setQuestionnaireLocked] = useState<boolean>(false);

  useEffect(() => {
    fetch(`/api/questionnaires/state?client=${encodeURIComponent(clientOrg)}&distributor=${encodeURIComponent(distOrg)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.state) {
          if (data.state.answers) {
            setQuestionnaireAnswered(Object.keys(data.state.answers).length);
          }
          if (data.state.isLocked !== undefined) {
            setQuestionnaireLocked(Boolean(data.state.isLocked));
          }
        }
      })
      .catch(() => {});
  }, [clientOrg, distOrg]);

  // 6. Live Evidence Files Count
  const [evidenceCount, setEvidenceCount] = useState<number>(14);
  useEffect(() => {
    fetch(`/api/evidence?distributor=${encodeURIComponent(distOrg)}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.files)) {
          setEvidenceCount(data.files.length);
        } else if (data && Array.isArray(data)) {
          setEvidenceCount(data.length);
        }
      })
      .catch(() => {});
  }, [distOrg]);

  // 7. Live Messages & Discussions
  const [recentMessages, setRecentMessages] = useState<LiveMessageItem[]>([]);
  useEffect(() => {
    fetch(`/api/discussions/messages?auditId=${encodeURIComponent(currentAudit.id)}&distributorId=${encodeURIComponent(distOrg)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          const formatted = data.messages.slice(-4).reverse().map((m: any) => ({
            id: m.id || String(Math.random()),
            sender: m.senderName || 'Auditor',
            senderRole: m.senderRole || 'Audit Team',
            content: m.content || '',
            timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            isAuditor: m.senderRole === 'Auditor' || m.senderRole === 'Reviewer' || m.senderRole === 'Lead Auditor'
          }));
          setRecentMessages(formatted);
        } else {
          // Fallback to real audit team notifications
          fetch('/api/notifications')
            .then(r => r.json())
            .then(notifData => {
              if (notifData && Array.isArray(notifData.notifications) && notifData.notifications.length > 0) {
                const msgs = notifData.notifications.slice(0, 3).map((n: any) => ({
                  id: n.id,
                  sender: n.category || 'Audit Notification',
                  senderRole: 'Audit System',
                  content: n.message || n.title,
                  timestamp: n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
                  isAuditor: true
                }));
                setRecentMessages(msgs);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [currentAudit.id, distOrg]);

  // Metrics calculations from live requests
  const totalItemsCount = iirRequests.length || 24;
  const completedItemsCount = iirRequests.filter(item =>
    isItemComplete(item) || item.status === 'Completed' || item.status === 'Submitted' || item.status === 'Accepted'
  ).length;
  const pendingItemsCount = Math.max(0, totalItemsCount - completedItemsCount);
  const clarificationRequiredCount = iirRequests.filter(item =>
    item.reviewerStatus === 'Clarification Required' || item.status === 'Clarification Required'
  ).length;
  const missingMandatoryCount = iirRequests.filter(item =>
    item.isMandatory && !isItemComplete(item)
  ).length;

  const overallProgressPercent = totalItemsCount > 0
    ? Math.round((completedItemsCount / totalItemsCount) * 100)
    : (currentAudit.progressPercent || 78);

  // Remaining days calculation
  const daysRemaining = useMemo(() => {
    if (!currentAudit.endDate) return 18;
    const target = new Date(currentAudit.endDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [currentAudit.endDate]);

  // Key actionable tasks (pending or needing clarification)
  const actionableTasks = useMemo(() => {
    const pendingList = iirRequests.filter(item => !isItemComplete(item) && item.status !== 'Completed' && item.status !== 'Accepted');
    const sorted = [...pendingList].sort((a, b) => {
      if (a.reviewerStatus === 'Clarification Required') return -1;
      if (b.reviewerStatus === 'Clarification Required') return 1;
      if (a.isMandatory) return -1;
      if (b.isMandatory) return 1;
      return 0;
    });
    return sorted.slice(0, 5);
  }, [iirRequests]);

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* 1. DEDICATED DISTRIBUTOR AUDIT SWITCHER BAR (EXACT SPECIFICATION & PRESERVED) */}
      <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
            <Building2 className="h-4 w-4 text-indigo-400" />
            <span>Distributor Audit:</span>
          </div>
          
          <div className="relative flex-1 max-w-xl" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500/60 rounded-xl text-sm font-medium text-white transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="font-bold text-white text-sm truncate">
                  {currentAudit.distributorName || currentAudit.title}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="font-mono text-xs text-indigo-400 font-semibold shrink-0">
                  {currentAudit.code}
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getStatusBadgeClasses(currentAudit.status)}`}>
                  {currentAudit.status}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
              </div>
            </button>

            {/* DROPDOWN MENU */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-full min-w-[360px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800/60 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-950/60 flex items-center justify-between">
                  <span>Available Distributor Audits</span>
                  <span className="text-indigo-400 font-mono">{availableAudits.length} Audits</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40">
                  {availableAudits.map((eng) => {
                    const isSelected = eng.id === currentAudit.id || eng.code === currentAudit.code;
                    return (
                      <button
                        key={eng.id}
                        onClick={() => handleSelectAudit(eng)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                          isSelected ? 'bg-indigo-950/60 hover:bg-indigo-900/50' : 'hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          {isSelected ? (
                            <Check className="h-4 w-4 text-indigo-400 font-bold" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-700"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${isSelected ? 'text-white font-bold' : 'text-slate-200 font-medium'}`}>
                              {eng.distributorName || eng.title}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded border shrink-0 ${getStatusBadgeClasses(eng.status)}`}>
                              {eng.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span className="font-mono text-indigo-400 font-semibold">{eng.code}</span>
                            <span>•</span>
                            <span>{eng.progressPercent || 0}% Progress</span>
                            {eng.overdueItemsCount && eng.overdueItemsCount > 0 ? (
                              <>
                                <span>•</span>
                                <span className="text-rose-400 font-medium">{eng.overdueItemsCount} overdue</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Meta Chips */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-500">Client:</span>
            <span className="font-semibold text-white">{currentAudit.clientName || 'Apex Electronics Corp'}</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-500">Period:</span>
            <span className="font-semibold text-white">{currentAudit.period || currentAudit.auditPeriod || 'FY2025-26'}</span>
          </div>
        </div>
      </div>

      {/* 2. WELCOME / AUDIT ENGAGEMENT HERO CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/25 rounded-2xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                Distributor Executive Portal
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadgeClasses(currentAudit.status)}`}>
                {currentAudit.status} Phase
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Engagement ID: <strong className="text-white">{currentAudit.code}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {currentAudit.distributorName || distOrg} Workspace
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Welcome to your dedicated audit monitoring and action portal. Track data collection, review open information requests, upload compliance evidence, and interact with the audit team in real time.
            </p>

            {/* Fast status indicators */}
            <div className="pt-2 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-800">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                <span>Target Close: <strong className="text-slate-200">{currentAudit.endDate || 'Aug 25, 2026'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-800">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Deadline: <strong className="text-amber-300 font-semibold">{daysRemaining} Days Remaining</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-800">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Client Sponsor: <strong className="text-slate-200">{clientOrg}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onTabChange('engagement_workspace')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Open Engagement Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onTabChange('evidence')}
              className="flex items-center justify-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm px-4 py-3 rounded-xl transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4 text-indigo-400" />
              <span>Upload Evidence</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. SUMMARY / STAT METRIC CARDS ROW (5 HIGH-IMPACT LIVE CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Overall Progress */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overall Progress</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">{overallProgressPercent}%</span>
              <span className="text-xs text-slate-400">Complete</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, overallProgressPercent))}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex justify-between">
              <span>{completedItemsCount} of {totalItemsCount} requests</span>
              <span className="text-indigo-400 font-medium">{daysRemaining}d left</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Requirements */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Requirements</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">{totalItemsCount}</span>
              <span className="text-xs text-slate-400">Items</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              IRL Schedule & Business Questionnaire
            </p>
            <div className="mt-2 text-[10px] text-blue-400 font-medium">
              32 Questionnaire questions active
            </div>
          </div>
        </div>

        {/* Card 3: Completed / Submitted */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Completed / Lodged</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{completedItemsCount}</span>
              <span className="text-xs text-slate-400">Items</span>
            </div>
            <p className="text-[11px] text-emerald-400/80 mt-3">
              {evidenceCount} Evidence files lodged in vault
            </p>
            <div className="mt-2 text-[10px] text-slate-400">
              {questionnaireAnswered > 0 ? `${questionnaireAnswered}/32 Questionnaire answers` : 'Verified & Accepted'}
            </div>
          </div>
        </div>

        {/* Card 4: Pending / Action Required */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Pending Action</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">{pendingItemsCount}</span>
              <span className="text-xs text-slate-400">Items</span>
            </div>
            <p className="text-[11px] text-amber-400/80 mt-3">
              {missingMandatoryCount > 0 ? `${missingMandatoryCount} Mandatory uploads due` : 'Awaiting data entry'}
            </p>
            <div className="mt-2 text-[10px] text-slate-400">
              Requires distributor upload
            </div>
          </div>
        </div>

        {/* Card 5: Clarifications Needed / Attention */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-rose-500/40 transition-all flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Attention Needed</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-400">
                {clarificationRequiredCount > 0 ? clarificationRequiredCount : missingMandatoryCount}
              </span>
              <span className="text-xs text-slate-400">Flags</span>
            </div>
            <p className="text-[11px] text-rose-300 mt-3">
              {clarificationRequiredCount > 0 ? 'Auditor queries open' : 'Mandatory items outstanding'}
            </p>
            <div className="mt-2 text-[10px] text-slate-400">
              Review & respond in workspace
            </div>
          </div>
        </div>
      </div>

      {/* 4. AUDIT TIMELINE / PHASES SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Audit Lifecycle & Phase Tracking</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status across core compliance audit workstreams for {distOrg}
            </p>
          </div>
          <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
            Audit Stage: {currentAudit.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
          {/* Phase 1: IRL */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phase 1</span>
              <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {completedItemsCount === totalItemsCount && totalItemsCount > 0 ? 'Completed' : 'Active'}
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Initial Requirements (IRL)</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Data requests & mandatory documentary submissions
              </p>
            </div>
            <div className="text-[11px] text-indigo-300 font-mono pt-1 border-t border-slate-800/60">
              {completedItemsCount}/{totalItemsCount} Submitted ({overallProgressPercent}%)
            </div>
          </div>

          {/* Phase 2: Business Questionnaire */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phase 2</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                questionnaireLocked ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
              }`}>
                {questionnaireLocked ? 'Submitted' : 'In Progress'}
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Business Questionnaire</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Organizational, compliance & operational disclosures
              </p>
            </div>
            <div className="text-[11px] text-indigo-300 font-mono pt-1 border-t border-slate-800/60">
              {questionnaireAnswered}/32 Questions Answered
            </div>
          </div>

          {/* Phase 3: Evidence Uploads */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phase 3</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Lodged
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Evidence Management</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Verified ledgers, invoices & bank reconciliation statements
              </p>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono pt-1 border-t border-slate-800/60">
              {evidenceCount} Evidence Files in Vault
            </div>
          </div>

          {/* Phase 4: Sampling Review */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phase 4</span>
              <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Fieldwork
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Sampling Review & Testing</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Statistical voucher testing & forensic audit review
              </p>
            </div>
            <div className="text-[11px] text-purple-300 font-mono pt-1 border-t border-slate-800/60">
              Audit Review Active
            </div>
          </div>

          {/* Phase 5: Final Reporting */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phase 5</span>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Scheduled
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Final Report & Sign-off</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Executive debrief, findings report & formal sign-off
              </p>
            </div>
            <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
              Scheduled at Close
            </div>
          </div>
        </div>
      </div>

      {/* 5. TWO-COLUMN WORKING SECTION: KEY TASKS & RECENT COMMUNICATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (7 COLS): KEY TASKS & DEADLINES */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-indigo-400" />
                <span>Action Items & Urgent Deadlines</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Outstanding requirements requiring submission or response
              </p>
            </div>
            <button
              onClick={() => onTabChange('engagement_workspace')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All ({iirRequests.length})</span>
              <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
            </button>
          </div>

          {actionableTasks.length > 0 ? (
            <div className="space-y-2.5">
              {actionableTasks.map((task) => {
                const isClarification = task.reviewerStatus === 'Clarification Required' || task.status === 'Clarification Required';
                return (
                  <div
                    key={task.id}
                    className="p-3.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/30 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {task.refNumber || task.id}
                        </span>
                        {task.isMandatory && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            Mandatory
                          </span>
                        )}
                        {isClarification && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Clarification Needed
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                        {task.title || task.description}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Category: {task.category || 'General Requirement'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          Target: {currentAudit.endDate || 'Aug 25, 2026'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onTabChange('engagement_workspace')}
                      className="self-start sm:self-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all shrink-0 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{isClarification ? 'Respond' : 'Upload'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">All Requirements Submitted!</h4>
              <p className="text-xs text-slate-400">
                You have fulfilled all active information requests for this phase.
              </p>
            </div>
          )}

          {/* Quick Questionnaire Task if not locked */}
          {!questionnaireLocked && (
            <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">Business Questionnaire In Progress</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {questionnaireAnswered}/32 Questions completed • Complete all sections to lock submission
                  </p>
                </div>
              </div>
              <button
                onClick={() => onTabChange('engagement_workspace')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer"
              >
                Continue Form
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 COLS): RECENT COMMUNICATION & CLARIFICATIONS */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                  <span>Audit Communication</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct auditor thread & clarification queries
                </p>
              </div>
              <button
                onClick={() => onTabChange('communication')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Open Chat</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            {recentMessages.length > 0 ? (
              <div className="space-y-3">
                {recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{msg.sender}</span>
                        <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 font-medium">
                          {msg.senderRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2 my-2">
                <CheckCircle2 className="h-7 w-7 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-white">No Open Clarifications</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The audit team currently has no pending queries for your team. You can initiate a message anytime.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={() => onTabChange('communication')}
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Send className="h-3.5 w-3.5 text-indigo-400" />
              <span>Send Message to Audit Team</span>
            </button>
          </div>
        </div>

      </div>

      {/* 6. QUICK ACTIONS & AUDITOR ASSISTANCE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quick Action Tiles (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Quick Actions</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct shortcuts to high-frequency distributor audit workflows
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onTabChange('evidence')}
              className="p-4 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left space-y-2 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform w-fit">
                <Upload className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Upload Evidence</h3>
              <p className="text-[11px] text-slate-400">Add documents to vault</p>
            </button>

            <button
              onClick={() => onTabChange('engagement_workspace')}
              className="p-4 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left space-y-2 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform w-fit">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Questionnaire</h3>
              <p className="text-[11px] text-slate-400">Complete disclosures</p>
            </button>

            <button
              onClick={() => onTabChange('engagement_workspace')}
              className="p-4 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left space-y-2 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform w-fit">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Sample Testing</h3>
              <p className="text-[11px] text-slate-400">Review selected transactions</p>
            </button>

            <button
              onClick={() => onTabChange('communication')}
              className="p-4 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left space-y-2 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform w-fit">
                <MessageSquare className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Message Auditors</h3>
              <p className="text-[11px] text-slate-400">Open conversation thread</p>
            </button>

            <button
              onClick={() => onTabChange('evidence')}
              className="p-4 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left space-y-2 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform w-fit">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-white">My Uploads</h3>
              <p className="text-[11px] text-slate-400">Review lodged files</p>
            </button>

            <button
              onClick={() => onTabChange('engagement_workspace')}
              className="p-4 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left space-y-2 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform w-fit">
                <Download className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-white">IRL Package</h3>
              <p className="text-[11px] text-slate-400">Download requirement list</p>
            </button>
          </div>
        </div>

        {/* Auditor Support Banner (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-indigo-500/25 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                <Headphones className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Assigned Audit Team Support</h3>
                <p className="text-[11px] text-slate-400">Direct contact for guidance and inquiries</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Lead Auditor:</span>
                <span className="font-semibold text-white">{currentAudit.leadAuditor || 'Sarah Jenkins'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Contact Email:</span>
                <span className="font-mono text-indigo-300">{currentAudit.leadAuditorEmail || 'sarah.jenkins@data360.audit'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Response SLA:</span>
                <span className="text-emerald-400 font-medium">&lt; 24 Hours on business days</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              If you require clarification on any information request or sampling item, reach out directly through the audit communication portal.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onTabChange('communication')}
              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer text-center shadow"
            >
              Contact Lead Auditor
            </button>
            <button
              onClick={() => onTabChange('engagement_workspace')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Help Guide
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
