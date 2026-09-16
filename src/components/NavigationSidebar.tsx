import React from 'react';
import { 
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
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
  Settings, BarChart3,
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
  | 'sampling_review' 
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onTabChange,
  openFindingsCount,
  flaggedAnomaliesCount,
  currentUser,
  isCollapsed = false,
  onToggleCollapse
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
    { name: 'Distributor Audits', icon: Store, count: 6 },
    { name: 'Vendor & AP Audits', icon: Building, count: 2 },
    { name: 'Franchise & Dealer', icon: PieChart, count: 3 },
    { name: 'Financial & Forensic', icon: DollarSign, count: 1 },
  ];

  return (
    <aside className={`${isCollapsed ? "w-16" : "w-[270px]"} transition-all duration-300 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 hidden md:flex min-h-screen z-20`}>
      
      <div className="p-3 space-y-5">
        
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 py-2 mt-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center font-bold text-base shadow-inner ring-1 ring-white/20 shrink-0">
            <Layers className="h-4 w-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent leading-none">
                  DMP
                </span>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 leading-none">
                  v2.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                Distributor Monitoring Platform
              </span>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div>
          <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} mb-2`}>
            {!isCollapsed && (
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Main Navigation
              </p>
            )}
            {onToggleCollapse && (
              <button 
                onClick={onToggleCollapse} 
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
                title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
              >
                {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            )}
          </div>
          <nav className="space-y-1">
            
            {/* 1. Executive Dashboard */}
            <button
              title={isCollapsed ? "Executive Dashboard" : undefined}
              onClick={() => onTabChange('dashboard')}
              className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-3"} py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
                <LayoutDashboard className={`h-4 w-4 shrink-0 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">Executive Dashboard</span>}
              </div>
            </button>

            {/* 2. Engagement Workspace */}
            <button
              title={isCollapsed ? "Engagement Workspace" : undefined}
              onClick={() => onTabChange('engagement_workspace')}
              className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-3"} py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'engagement_workspace'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
                <Layers className={`h-4 w-4 shrink-0 ${activeTab === 'engagement_workspace' ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">Engagement Workspace</span>}
              </div>
            </button>

            {/* 3. Evidence Management / My Uploads & Evidence */}
            <button
              title={isCollapsed ? (isDistributor ? "My Uploads & Evidence" : "Evidence Management") : undefined}
              onClick={() => onTabChange('evidence')}
              className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-3"} py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'evidence'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
                <FileSpreadsheet className={`h-4 w-4 shrink-0 ${activeTab === 'evidence' ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{isDistributor ? "My Uploads & Evidence" : "Evidence Management"}</span>}
              </div>
            </button>

                        

                        {/* 3.5 Sampling (Auditor Only in Main Nav) */}
            {!isDistributor && (
              <button
                title={isCollapsed ? "Sampling Review" : undefined}
                onClick={() => onTabChange('sampling_review')}
                className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-3"} py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'sampling_review'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
                  <BarChart3 className={`h-4 w-4 shrink-0 ${activeTab === 'sampling_review' ? 'text-white' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">Sampling Review</span>}
                </div>
              </button>
            )}
            

            {/* 4. Communication */}
            <button
              title={isCollapsed ? "Communication" : undefined}
              onClick={() => onTabChange('communication')}
              className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-3"} py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'communication'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
                <HelpCircle className={`h-4 w-4 shrink-0 ${activeTab === 'communication' ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">Communication</span>}
              </div>
            </button>

            {/* 5. Reporting */}
            {!isDistributor && (
              <button
                title={isCollapsed ? "Reporting Workspace" : undefined}
                onClick={() => onTabChange('reporting')}
                className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-3"} py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'reporting'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
                  <FileText className={`h-4 w-4 shrink-0 ${activeTab === 'reporting' ? 'text-white' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">Reporting</span>}
                </div>
              </button>
            )}

            {/* 6. Admin Control (Grouped Collapsible - Auditor / Admin only) */}
            {!isDistributor && (
              <div className="space-y-1">
                <button
                  onClick={handleAdminControlClick}
                  className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-3"} py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isAdminTabActive && !isAdminExpanded
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                      : isAdminTabActive
                      ? 'bg-slate-800/80 text-slate-200 border border-slate-700/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
                    <Settings className={`h-4 w-4 shrink-0 ${isAdminTabActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">Admin Control</span>}
                  </div>
                  {!isCollapsed && <div className="flex items-center gap-1.5 shrink-0">
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
                  </div>}
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
                          className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-2.5"} py-2 rounded-lg text-xs font-medium transition-all ${
                            isChildActive
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
                            <ChildIcon className={`h-3.5 w-3.5 shrink-0 ${isChildActive ? 'text-white' : 'text-slate-400'}`} />
                            {!isCollapsed && <span className="truncate">{child.label}</span>}
                          </div>
                          {!isCollapsed && child.badge && (<span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0 ${
                              child.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700/60'
                            }`}>{child.badge}</span>)}
                        </button>
                      );
                    })}
                  </div>
                  )}
              </div>
              )}

          </nav>
        </div>

        {/* Audit Streams and Stats sections have been hidden per role requirements */}


      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Scale className="h-3.5 w-3.5 text-indigo-400" />
          {!isCollapsed && <span>DMP Core v2.4</span>}
        </div>
        {!isCollapsed && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">SOC 2 Ready</span>}
      </div>

    </aside>
  );
};
