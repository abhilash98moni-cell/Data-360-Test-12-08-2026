import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calculator, 
  ShieldAlert, 
  CheckSquare, 
  FileCheck2, 
  Search, 
  PieChart, 
  Scale, 
  Store, 
  Building, 
  DollarSign, 
  HelpCircle,
  FileSpreadsheet,
  Users,
  Sliders,
  UserCheck
} from 'lucide-react';

import { UserSession } from './AuthModal';
import { supabase } from '../lib/supabaseClient';

export type ActiveTab = 
  | 'dashboard' 
  | 'admin_approval'
  | 'iir' 
  | 'evidence' 
  | 'communication' 
  | 'engagements' 
  | 'sampling' 
  | 'forensics' 
  | 'findings' 
  | 'master_control' 
  | 'audit_logs' 
  | 'profile' 
  | 'brd';

interface NavigationSidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  openFindingsCount: number;
  flaggedAnomaliesCount: number;
  currentUser?: UserSession | null;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onTabChange,
  openFindingsCount,
  flaggedAnomaliesCount,
  currentUser
}) => {
  const isDistributor = currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor');
  const isAdmin = currentUser?.role === 'Admin';

  const [pendingCount, setPendingCount] = React.useState<number>(0);

  React.useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from('pending_signup_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        if (!error && count !== null) {
          setPendingCount(count);
        }
      } catch (err) {
        // ignore
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fullNav = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      badge: 'Overview',
      auditorOnly: true
    },
    {
      id: 'admin_approval' as ActiveTab,
      label: 'Admin Approval Queue',
      icon: UserCheck,
      badge: pendingCount > 0 ? `${pendingCount} Pending` : '0 Pending',
      badgeColor: pendingCount > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      auditorOnly: true
    },
    {
      id: 'iir' as ActiveTab,
      label: isDistributor ? 'Initial Requirement List (IRL)' : 'Initial Info Request (IRL)',
      icon: FileSpreadsheet,
      badge: 'Step 7',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'evidence' as ActiveTab,
      label: isDistributor ? 'My Uploads & Evidence' : 'Evidence Management',
      icon: FileSpreadsheet,
      badge: 'Vault',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'communication' as ActiveTab,
      label: 'Communication',
      icon: HelpCircle,
      badge: 'Discussions',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    {
      id: 'engagements' as ActiveTab,
      label: 'Audit Portfolio',
      icon: Briefcase,
      badge: '6 Active',
      auditorOnly: true
    },
    {
      id: 'sampling' as ActiveTab,
      label: 'Fieldwork & MUS Sampling',
      icon: Calculator,
      badge: null,
      auditorOnly: true
    },
    {
      id: 'forensics' as ActiveTab,
      label: 'Forensic Anomaly AI',
      icon: Search,
      badge: flaggedAnomaliesCount > 0 ? `${flaggedAnomaliesCount} Flagged` : null,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
      auditorOnly: true
    },
    {
      id: 'findings' as ActiveTab,
      label: isDistributor ? 'Assigned Action Items & CAPA' : 'Findings & CAPA',
      icon: ShieldAlert,
      badge: openFindingsCount > 0 ? `${openFindingsCount} Open` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      id: 'master_control' as ActiveTab,
      label: 'Master Control & System',
      icon: Sliders,
      badge: 'Governance',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      auditorOnly: true
    },
    {
      id: 'audit_logs' as ActiveTab,
      label: 'Security Audit Logs',
      icon: FileCheck2,
      badge: 'Logs',
      auditorOnly: true
    },
    {
      id: 'profile' as ActiveTab,
      label: 'My Profile & Security',
      icon: Users,
      badge: 'Account'
    },
    {
      id: 'brd' as ActiveTab,
      label: 'BRD Document View',
      icon: FileCheck2,
      badge: 'Spec',
      auditorOnly: true
    }
  ];

  const mainNav = fullNav.filter(item => !isDistributor || !item.auditorOnly);

  const auditStreams = [
    { name: 'Distributor Audits', icon: Store, count: 2 },
    { name: 'Vendor & AP Audits', icon: Building, count: 1 },
    { name: 'Franchise & Dealer', icon: PieChart, count: 2 },
    { name: 'Financial & Forensic', icon: DollarSign, count: 1 },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-57px)]">
      
      <div className="p-3 space-y-6">
        
        {/* Navigation Sections */}
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Audit Streams / Scope Section */}
        {isAdmin ? (
          <div>
            <p className="px-3 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
              Admin Control Scope
            </p>
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Role Scope:</span>
                <span className="text-amber-300 font-bold">Admin Dashboard Only</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Your account is restricted exclusively to reviewing, approving, and provisioning user signups.
              </p>
            </div>
          </div>
        ) : !isDistributor ? (
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Active Audit Streams
            </p>
            <div className="space-y-1">
              {auditStreams.map((stream, idx) => {
                const Icon = stream.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => onTabChange('engagements')}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{stream.name}</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60">
                      {stream.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Distributor Portal Scope
            </p>
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Assigned Entity:</span>
                <span className="text-emerald-300 font-semibold">{currentUser?.organization || 'Midwest Trading Co.'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Target Completion:</span>
                <span className="text-slate-200 font-mono">Aug 25, 2026</span>
              </div>
            </div>
          </div>
        )}

        {/* Practice Stats Card or Distributor Status Card */}
        {!isDistributor ? (
          <div className="p-3 bg-gradient-to-br from-slate-800/80 to-slate-800/30 border border-slate-700/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300">Practice Summary</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-medium">
                Q3 FY26
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Exposure Identified:</span>
                <span className="font-bold text-emerald-400">₹18.84 Cr</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Avg Sampling Confidence:</span>
                <span className="font-medium text-slate-200">96.3%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-300">Audit Status</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-medium">
                Fieldwork Active
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Request Progress:</span>
                <span className="font-bold text-emerald-400">75% (18/24)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Assigned CAPAs:</span>
                <span className="font-bold text-amber-400">1 Open</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Scale className="h-3.5 w-3.5 text-indigo-400" />
          <span>Data360 Core v2.4</span>
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
          SOC 2 Ready
        </span>
      </div>

    </aside>
  );
};
