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
import { DistributorExecutiveDashboard } from './DistributorExecutiveDashboard';
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
  onTabChange: (tab: any, params?: any) => void;
  onOpenCopilot: () => void;
  currencyMode?: CurrencyMode;
  currentUser?: UserSession | null;
  selectedEngagementId?: string;
  onSelectAuditContext?: (engagementId: string, distributorName?: string, clientName?: string) => void;
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
  currentUser,
  selectedEngagementId,
  onSelectAuditContext
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

  // Demo access rule: For this client demo, every Auditor can access every distributor audit currently available.
  // Therefore the selector can simply show all available distributor audits without blocking access.

  if (currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor')) {
    return (
      <DistributorExecutiveDashboard
        engagements={engagements}
        findings={findings}
        samplingRuns={samplingRuns}
        assignments={assignments}
        selectedEngagementId={selectedEngagementId}
        onSelectAuditContext={onSelectAuditContext}
        onTabChange={onTabChange}
        currentUser={currentUser}
        currencyMode={activeCurrencyMode}
      />
    );
  }

  return (
    <ExecutiveAuditTimelineDashboard 
      engagements={engagements} 
      currentUser={currentUser} 
      onOpenNewAudit={onOpenNewAudit}
      onTabChange={onTabChange}
      onSelectEngagement={onSelectEngagement}
      selectedEngagementId={selectedEngagementId}
      onSelectAuditContext={onSelectAuditContext}
    />
  );
};
