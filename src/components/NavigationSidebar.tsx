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
  UserCheck,
  Layers, FileText,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

import { UserSession } from './AuthModal';
import { supabase } from '../lib/supabaseClient';

export type ActiveTab = 
  | 'dashboard' 
  | 'engagement_workspace'
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
  | 'reporting';

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

  const isAdminTabActive = activeTab === 'admin_approval' || activeTab === 'master_control' || activeTab === 'audit_logs';
  const [isAdminExpanded, setIsAdminExpanded] = React.useState<boolean>(isAdminTabActive);

  // Auto-expand if active tab becomes one of the admin tabs
  React.useEffect(() => {
    if (isAdminTabActive) {
      setIsAdminExpanded(true);
    }
  }, [isAdminTabActive]);

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

  const handleAdminControlClick = () => {
    if (!isAdminExpanded) {
      setIsAdminExpanded(true);
      if (!isAdminTabActive) {
        onTabChange('admin_approval');
      }
    } else {
      setIsAdminExpanded(false);
    }
  };

  const adminChildren = [
    {
      id: 'admin_approval' as ActiveTab,
      label: 'Admin Approval Queue',
      icon: UserCheck,
      badge: pendingCount > 0 ? `${pendingCount} Pending` : '0 Pending',
      badgeColor: pendingCount > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
    },
    {
      id: 'master_control' as ActiveTab,
      label: 'Master Control & System',
      icon: Sliders,
      badge: null
    },
    {
      id: 'audit_logs' as ActiveTab,
      label: 'Security Audit Logs',
      icon: FileCheck2,
      badge: null
    }
  ];

  const auditStreams = [
    { name: 'Distributor Audits', icon: Store, count: 2 },
    { name: 'Vendor & AP Audits', icon: Building, count: 1 },
    { name: 'Franchise & Dealer', icon: PieChart, count: 2 },
    { name: 'Financial & Forensic', icon: DollarSign, count: 1 },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-57px)]">
      
      <div className="p-3 space-y-5">
        
        {/* Navigation Sections */}
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            
            {/* 1. Executive Dashboard (Auditor / Admin only) */}
            {!isDistributor && (
              <button
                onClick={() => onTabChange('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LayoutDashboard className={`h-4 w-4 shrink-0 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">Executive Dashboard</span>
                </div>
              </button>
            )}

            {/* 2. Engagement Workspace */}
            <button
              onClick={() => onTabChange('engagement_workspace')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'engagement_workspace'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Layers className={`h-4 w-4 shrink-0 ${activeTab === 'engagement_workspace' ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">Engagement Workspace</span>
              </div>
            </button>

            {/* 3. Evidence Management / My Uploads & Evidence */}
            <button
              onClick={() => onTabChange('evidence')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'evidence'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileSpreadsheet className={`h-4 w-4 shrink-0 ${activeTab === 'evidence' ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{isDistributor ? 'My Uploads & Evidence' : 'Evidence Management'}</span>
              </div>
            </button>

            {/* 4. Communication */}
            <button
              onClick={() => onTabChange('communication')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'communication'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <HelpCircle className={`h-4 w-4 shrink-0 ${activeTab === 'communication' ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">Communication</span>
              </div>
            </button>

            {/* 5. Reporting */}
            <button
              onClick={() => onTabChange('reporting')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'reporting'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className={`h-4 w-4 shrink-0 ${activeTab === 'reporting' ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">Reporting</span>
              </div>
            </button>

            {/* 6. Admin Control (Grouped Collapsible - Auditor / Admin only) */}
            {!isDistributor && (
              <div className="space-y-1">
                <button
                  onClick={handleAdminControlClick}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isAdminTabActive && !isAdminExpanded
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                      : isAdminTabActive
                      ? 'bg-slate-800/80 text-slate-200 border border-slate-700/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Settings className={`h-4 w-4 shrink-0 ${isAdminTabActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate">Admin Control</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {pendingCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {pendingCount}
                      </span>
                    )}
                    {isAdminExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Collapsible Admin Children */}
                {isAdminExpanded && (
                  <div className="ml-3.5 pl-3 border-l border-slate-800 space-y-1 mt-1 transition-all">
                    {adminChildren.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = activeTab === child.id;
                      return (
                        <button
                          key={child.id}
                          onClick={() => onTabChange(child.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                            isChildActive
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ChildIcon className={`h-3.5 w-3.5 shrink-0 ${isChildActive ? 'text-white' : 'text-slate-400'}`} />
                            <span className="truncate">{child.label}</span>
                          </div>
                          {child.badge && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0 ${
                              child.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700/60'
                            }`}>
                              {child.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </nav>
        </div>

        {/* Audit Streams / Scope Section */}
        {!isAdmin && (
          !isDistributor ? (
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
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{stream.name}</span>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60 shrink-0">
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
          )
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
