import React, { useState, useEffect, useMemo } from 'react';
import { 
  AuditEngagement, 
  AuditFinding,
  SamplingRun,
  AuditAssignment,
  IIRRequestItem
} from '../types';
import { isItemComplete } from '../utils/irlValidation';
import { INITIAL_IIR_REQUESTS } from '../data/iirData';
import { ExecutiveAuditTimelineDashboard } from './ExecutiveAuditTimelineDashboard';
import { UserSession } from './AuthModal';
import { 
  IndianRupee, 
  DollarSign,
  Briefcase, 
  ShieldAlert, 
  TrendingUp, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  AlertTriangle, 
  CheckCircle2, 
  Plus,
  Sparkles,
  FileSpreadsheet,
  Layers,
  Filter,
  CheckSquare,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  Search,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { CurrencyMode, formatCurrency } from '../utils/currencyFormatter';

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
    } catch(e) {}
  }
  return fallback;
}

interface DashboardViewProps {
  engagements: AuditEngagement[];
  findings: AuditFinding[];
  samplingRuns?: SamplingRun[];
  assignments?: AuditAssignment[];
  onSelectEngagement: (engagementId: string) => void;
  onOpenNewAudit: () => void;
  onTabChange: (tab: any) => void;
  onOpenCopilot: () => void;
  currencyMode?: CurrencyMode;
  currentUser?: UserSession | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  engagements,
  findings,
  samplingRuns = [],
  assignments = [],
  onSelectEngagement,
  onOpenNewAudit,
  onTabChange,
  onOpenCopilot,
  currencyMode: activeCurrencyMode = 'INR',
  currentUser
}) => {
  const [authorizedCount, setAuthorizedCount] = useState<number | null>(null);

  useEffect(() => { 
    if (currentUser?.role === 'Auditor') {
      fetch('/api/users/me/distributors', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('supabase_token') } })
        .then(res => res.json())
        .then(data => { if (data.success) setAuthorizedCount(data.distributors.length); })
        .catch(console.error);
    }
  }, [currentUser]);

  if (currentUser?.role === 'Auditor' && authorizedCount === 0) {
    return (
      <div className="p-12 text-center max-w-xl mx-auto my-16 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-2xl animate-fade-in text-white">
        <div className="p-4 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Distributor Access</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Your account has not been assigned to any distributor. Please contact an administrator.
        </p>
      </div>
    );
  }

  if (currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor')) {
    const distOrg = currentUser.organization || 'Midwest Trading Co.';
    
    // Find the correct client context for the distributor
    const clientOrg = engagements.find(e => 
      e.distributorName === distOrg || e.title.includes(distOrg) || e.location.includes(distOrg)
    )?.clientName || 'Apex Electronics Corp';
    
    const iirRequests = useMemo(() => {
      return loadIIRRequestsFromStorage(clientOrg, distOrg, INITIAL_IIR_REQUESTS);
    }, [clientOrg, distOrg]);

    const totalItemsCount = iirRequests.length;
    const completedItemsCount = iirRequests.filter(item => 
      isItemComplete(item) || item.status === 'Completed' || item.status === 'Submitted' || item.status === 'Accepted'
    ).length;
    const missingMandatoryCount = iirRequests.filter(item => 
      item.isMandatory && !isItemComplete(item)
    ).length;
    const clarificationRequiredCount = iirRequests.filter(item => 
      item.reviewerStatus === 'Clarification Required' || item.status === 'Clarification Required'
    ).length;
    
    const overallProgressPercent = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;

    return (
      <div className="w-full p-4 sm:p-6 space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/30">
                Distributor Action Portal
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {distOrg} Workspace
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onTabChange('engagement_workspace')}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Go to Action Items</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 group hover:border-emerald-500/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Completed / Ready</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{completedItemsCount}</p>
            <p className="text-[11px] text-slate-400">{overallProgressPercent}% Complete • {totalItemsCount} Total</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 group hover:border-rose-500/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Missing Mandatory</span>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-400">{missingMandatoryCount}</p>
            <p className="text-[11px] text-rose-300">Requires Immediate Action</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 group hover:border-amber-500/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Clarifications Needed</span>
              <HelpCircle className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{clarificationRequiredCount}</p>
            <p className="text-[11px] text-amber-300">Auditor Questions Open</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ExecutiveAuditTimelineDashboard 
      engagements={engagements} 
      currentUser={currentUser} 
      onOpenNewAudit={onOpenNewAudit}
      onTabChange={onTabChange}
      onSelectEngagement={onSelectEngagement}
    />
  );
};
