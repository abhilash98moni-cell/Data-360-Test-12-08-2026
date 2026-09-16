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
import { BUSINESS_QUESTIONNAIRE_SECTIONS } from '../data/questionnaireData';
import { fetchQuestionnaireState } from '../services/questionnaireApiClient';
import { UserSession } from './AuthModal';
import { CurrencyMode } from '../utils/currencyFormatter';
import {
  Building2,
  ChevronDown,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Upload,
  FileText,
  MessageSquare,
  BarChart3,
  Layers,
  HelpCircle,
  ExternalLink,
  Table,
  CheckSquare
} from 'lucide-react';

export interface NavigationTargetParams {
  subTab?: 'questionnaire' | 'iir' | 'sampling';
  targetQuestionId?: string;
  targetIRLId?: string;
  targetVoucherNo?: string;
}

interface DistributorExecutiveDashboardProps {
  engagements: AuditEngagement[];
  findings?: AuditFinding[];
  samplingRuns?: SamplingRun[];
  assignments?: AuditAssignment[];
  selectedEngagementId?: string;
  onSelectAuditContext?: (engagementId: string, distributorName?: string, clientName?: string) => void;
  onTabChange: (tab: any, params?: NavigationTargetParams) => void;
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
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, any>>({});
  const [questionnaireReviews, setQuestionnaireReviews] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchQuestionnaireState(clientOrg, distOrg, currentAudit.id, currentUser?.role, currentUser?.organization)
      .then(res => {
        if (res && res.success && res.state) {
          if (res.state.answers) {
            setQuestionnaireAnswers(res.state.answers);
            const count = Object.keys(res.state.answers).filter(
              k => res.state.answers[k]?.responseValue && res.state.answers[k].responseValue.trim().length > 0
            ).length;
            setQuestionnaireAnswered(count);
          }
          if (res.state.questionReviews) {
            setQuestionnaireReviews(res.state.questionReviews);
          }
          if (res.state.isLocked !== undefined) {
            setQuestionnaireLocked(Boolean(res.state.isLocked));
          }
        }
      })
      .catch(() => {});
  }, [clientOrg, distOrg, currentAudit.id, currentUser]);

  // Dynamically find the next questionnaire question needing attention/completion
  const nextTargetQuestionId = useMemo(() => {
    // 1. Any question with Clarification Required
    for (const sec of BUSINESS_QUESTIONNAIRE_SECTIONS) {
      for (const q of sec.questions) {
        const review = questionnaireReviews[q.id];
        const ans = questionnaireAnswers[q.id];
        if (review?.reviewerStatus === 'Clarification Required' || ans?.reviewerStatus === 'Clarification Required') {
          return q.id;
        }
      }
    }
    // 2. First unanswered question
    for (const sec of BUSINESS_QUESTIONNAIRE_SECTIONS) {
      for (const q of sec.questions) {
        const ans = questionnaireAnswers[q.id];
        if (!ans || !ans.responseValue || ans.responseValue.trim().length === 0) {
          return q.id;
        }
      }
    }
    return 'q-1.1';
  }, [questionnaireReviews, questionnaireAnswers]);

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
          const formatted = data.messages.slice(-3).reverse().map((m: any) => ({
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

  const attentionCount = clarificationRequiredCount > 0 ? clarificationRequiredCount : missingMandatoryCount;

  // Tasks table items derived from live pending items
  const tableTasks = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      module: string;
      dueDate: string;
      status: string;
      statusCode: 'mandatory' | 'clarification' | 'pending' | 'in_progress';
      actionLabel: string;
      actionTab: string;
      targetSubTab?: 'questionnaire' | 'iir' | 'sampling';
      targetId?: string;
      voucherNo?: string;
    }> = [];

    // Add Questionnaire if not locked
    if (!questionnaireLocked) {
      list.push({
        id: 'TASK-BQ',
        title: 'Business Questionnaire Disclosures',
        module: 'Questionnaire',
        dueDate: currentAudit.endDate || 'Aug 25, 2026',
        status: questionnaireAnswered > 0 ? `${questionnaireAnswered}/32 Completed` : 'Action Required',
        statusCode: questionnaireAnswered > 0 ? 'in_progress' : 'mandatory',
        actionLabel: 'Complete',
        actionTab: 'engagement_workspace',
        targetSubTab: 'questionnaire',
        targetId: nextTargetQuestionId
      });
    }

    // Add live pending/clarification IRL items
    const pendingIRL = iirRequests.filter(item => !isItemComplete(item) && item.status !== 'Completed' && item.status !== 'Accepted');
    const sortedIRL = [...pendingIRL].sort((a, b) => {
      if (a.reviewerStatus === 'Clarification Required') return -1;
      if (b.reviewerStatus === 'Clarification Required') return 1;
      if (a.isMandatory) return -1;
      if (b.isMandatory) return 1;
      return 0;
    });

    sortedIRL.slice(0, 4).forEach((item) => {
      const isClarification = item.reviewerStatus === 'Clarification Required' || item.status === 'Clarification Required';
      list.push({
        id: item.id || item.refNumber,
        title: item.title || item.description,
        module: item.category || 'Information Request',
        dueDate: currentAudit.endDate || 'Aug 25, 2026',
        status: isClarification ? 'Clarification Required' : (item.isMandatory ? 'Mandatory Upload' : 'Pending Upload'),
        statusCode: isClarification ? 'clarification' : (item.isMandatory ? 'mandatory' : 'pending'),
        actionLabel: isClarification ? 'Respond' : 'Upload',
        actionTab: 'engagement_workspace',
        targetSubTab: 'iir',
        targetId: item.id || item.refNumber
      });
    });

    return list;
  }, [questionnaireLocked, questionnaireAnswered, nextTargetQuestionId, iirRequests, currentAudit.endDate]);

  const handleTaskActionClick = (t: any) => {
    const isBQ = t.id === 'TASK-BQ' || t.module?.toLowerCase().includes('questionnaire') || t.targetSubTab === 'questionnaire';
    const isSampling = t.module?.toLowerCase().includes('sampling') || t.targetSubTab === 'sampling';

    if (isBQ) {
      onTabChange('engagement_workspace', {
        subTab: 'questionnaire',
        targetQuestionId: t.targetId || nextTargetQuestionId
      });
    } else if (isSampling) {
      onTabChange('engagement_workspace', {
        subTab: 'sampling',
        targetVoucherNo: t.voucherNo || t.targetId || t.id
      });
    } else {
      onTabChange('engagement_workspace', {
        subTab: 'iir',
        targetIRLId: t.targetId || t.id
      });
    }
  };

  return (
    <div className="w-full p-3 sm:p-4 space-y-3 max-w-7xl mx-auto">
      
      {/* 1. DISTRIBUTOR AUDIT CONTEXT BAR (EXACT AS REQUESTED & PRESERVED) */}
      <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
            <Building2 className="h-4 w-4 text-indigo-400" />
            <span>Distributor Audit:</span>
          </div>
          
          <div className="relative flex-1 max-w-xl" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500/60 rounded-lg text-xs sm:text-sm font-medium text-white transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-white truncate">
                  {currentAudit.distributorName || currentAudit.title}
                </span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-xs text-indigo-400 font-semibold shrink-0">
                  {currentAudit.code}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getStatusBadgeClasses(currentAudit.status)}`}>
                  {currentAudit.status}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
              </div>
            </button>

            {/* DROPDOWN MENU */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-full min-w-[340px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800/60 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-950/60 flex items-center justify-between">
                  <span>Available Distributor Audits</span>
                  <span className="text-indigo-400 font-mono">{availableAudits.length} Audits</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/40">
                  {availableAudits.map((eng) => {
                    const isSelected = eng.id === currentAudit.id || eng.code === currentAudit.code;
                    return (
                      <button
                        key={eng.id}
                        onClick={() => handleSelectAudit(eng)}
                        className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition-colors ${
                          isSelected ? 'bg-indigo-950/60 hover:bg-indigo-900/50' : 'hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          {isSelected ? (
                            <Check className="h-3.5 w-3.5 text-indigo-400 font-bold" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-700"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs truncate ${isSelected ? 'text-white font-bold' : 'text-slate-200 font-medium'}`}>
                              {eng.distributorName || eng.title}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded border shrink-0 ${getStatusBadgeClasses(eng.status)}`}>
                              {eng.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                            <span className="font-mono text-indigo-400 font-semibold">{eng.code}</span>
                            <span>•</span>
                            <span>{eng.progressPercent || 0}% Progress</span>
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

        {/* Meta Chips */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="px-2.5 py-1 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-500">Client:</span>
            <span className="font-semibold text-white truncate max-w-[140px]">{clientOrg}</span>
          </div>
          <div className="px-2.5 py-1 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-500">Period:</span>
            <span className="font-semibold text-white">{currentAudit.period || currentAudit.auditPeriod || 'FY2025-26'}</span>
          </div>
        </div>
      </div>

      {/* 2. COMPACT WELCOME CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/25 rounded-xl p-3.5 sm:p-4 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Welcome, {currentAudit.distributorName || distOrg}
              </h1>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${getStatusBadgeClasses(currentAudit.status)}`}>
                {currentAudit.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentAudit.code}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Track your audit progress, respond to requirements, upload evidence, and communicate with your audit team.
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onTabChange('engagement_workspace')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition-all cursor-pointer"
            >
              <span>Open Engagement Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. 5 SUMMARY CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Card 1: Overall Progress */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall Progress</span>
            <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-white">{overallProgressPercent}%</span>
              <span className="text-[10px] text-slate-400">Complete</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, overallProgressPercent))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {completedItemsCount} of {totalItemsCount} requests
            </p>
          </div>
        </div>

        {/* Card 2: Total Requirements */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Requirements</span>
            <div className="p-1 rounded bg-blue-500/10 text-blue-400">
              <Layers className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-white">{totalItemsCount}</span>
              <span className="text-[10px] text-slate-400">Items</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              IRL & Questionnaires
            </p>
          </div>
        </div>

        {/* Card 3: Completed / Logged */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Completed / Logged</span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">{completedItemsCount}</span>
              <span className="text-[10px] text-slate-400">Items</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {evidenceCount} Evidence files lodged
            </p>
          </div>
        </div>

        {/* Card 4: Pending Action */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Pending Action</span>
            <div className="p-1 rounded bg-amber-500/10 text-amber-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-amber-400">{pendingItemsCount}</span>
              <span className="text-[10px] text-slate-400">Items</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {missingMandatoryCount > 0 ? `${missingMandatoryCount} Mandatory uploads due` : 'Awaiting data entry'}
            </p>
          </div>
        </div>

        {/* Card 5: Attention Needed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 hover:border-rose-500/40 transition-all flex flex-col justify-between shadow-sm col-span-2 sm:col-span-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Attention Needed</span>
            <div className="p-1 rounded bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-rose-400">{attentionCount}</span>
              <span className="text-[10px] text-slate-400">Flags</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {clarificationRequiredCount > 0 ? 'Auditor queries open' : 'Review in workspace'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. MAIN ROW (SIDE-BY-SIDE): MY KEY TASKS & DEADLINES (LEFT) + RECENT COMMUNICATION (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* LEFT COLUMN: MY KEY TASKS & DEADLINES (TABLE) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Table className="h-4 w-4 text-indigo-400" />
                <span>My Key Tasks & Deadlines</span>
              </h2>
              <p className="text-[10px] text-slate-400">Action items requiring completion or response</p>
            </div>
            <button
              onClick={() => onTabChange('engagement_workspace', { subTab: 'iir' })}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All ({iirRequests.length})</span>
              <ChevronDown className="h-3 w-3 -rotate-90" />
            </button>
          </div>

          {/* Compact Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-1.5 px-2">Requirement / Task</th>
                  <th className="py-1.5 px-2">Module</th>
                  <th className="py-1.5 px-2">Due Date</th>
                  <th className="py-1.5 px-2">Status</th>
                  <th className="py-1.5 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tableTasks.length > 0 ? (
                  tableTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-2">
                        <div className="font-semibold text-white truncate max-w-[180px] text-[11px]">{t.title}</div>
                        <div className="text-[9px] font-mono text-indigo-400">{t.id}</div>
                      </td>
                      <td className="py-2 px-2 text-[11px] text-slate-300 truncate max-w-[110px]">
                        {t.module}
                      </td>
                      <td className="py-2 px-2 text-[10px] text-slate-400 whitespace-nowrap">
                        {t.dueDate}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded border ${
                          t.statusCode === 'clarification'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : t.statusCode === 'mandatory'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleTaskActionClick(t)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold transition-all shadow cursor-pointer"
                        >
                          {t.actionLabel}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400 text-xs">
                      All tasks and requirements currently fulfilled!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Pending items requiring response: <strong className="text-amber-400">{pendingItemsCount}</strong></span>
            <button
              onClick={() => onTabChange('engagement_workspace', { subTab: 'iir' })}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Go to IRL Schedule →
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT COMMUNICATION */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between space-y-2.5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                  <span>Recent Communication</span>
                </h2>
                <p className="text-[10px] text-slate-400">Auditor queries & notifications</p>
              </div>
              <button
                onClick={() => onTabChange('communication')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>View All</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            {/* Messages List */}
            <div className="space-y-2 mt-2">
              {recentMessages.length > 0 ? (
                recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-white truncate max-w-[120px]">{msg.sender}</span>
                        <span className="text-[9px] text-indigo-300 bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/20 font-medium">
                          {msg.senderRole}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-1 leading-snug">
                      {msg.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center bg-slate-950/40 rounded-lg border border-slate-800 space-y-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto" />
                  <p className="text-xs font-semibold text-white">No Open Clarifications</p>
                  <p className="text-[10px] text-slate-400">All current auditor queries have been addressed.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => onTabChange('communication')}
              className="w-full py-1.5 px-3 bg-slate-950 hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
              <span>Open Communication Thread</span>
            </button>
          </div>
        </div>

      </div>

      {/* 6. NEED ASSISTANCE BANNER AT BOTTOM */}
      <div className="bg-slate-900/90 border border-indigo-500/25 rounded-xl px-4 py-2.5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div className="text-xs text-slate-300">
            <strong className="text-white font-semibold">Need Assistance?</strong> Have questions about requirements or submissions? Our audit team is here to assist.
          </div>
        </div>

        <button
          onClick={() => onTabChange('communication')}
          className="shrink-0 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Go to Communication</span>
        </button>
      </div>

    </div>
  );
};
