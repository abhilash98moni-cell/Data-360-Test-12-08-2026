import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, PlayCircle, Hourglass, CheckCircle2, AlertTriangle, Search, Briefcase, Plus, Calendar, Clock, ExternalLink,
  TrendingUp, ChevronRight, ListTodo, BarChart3, FileText, Check, ChevronDown, Building2, ShieldCheck, Download,
  Eye, FileSpreadsheet, Paperclip, Activity, ShieldAlert, ArrowUpRight, CheckCircle
} from 'lucide-react';
import { AuditEngagement, UserSession } from '../types';

interface ExecutiveAuditTimelineDashboardProps {
  engagements: AuditEngagement[];
  currentUser: UserSession | null;
  onOpenNewAudit?: () => void;
  onTabChange?: (tab: string) => void;
  onSelectEngagement?: (id: string) => void;
  selectedEngagementId?: string;
  onSelectAuditContext?: (engagementId: string, distributorName?: string, clientName?: string) => void;
}

export const ExecutiveAuditTimelineDashboard: React.FC<ExecutiveAuditTimelineDashboardProps> = ({ 
  engagements,
  currentUser,
  onOpenNewAudit, 
  onTabChange, 
  onSelectEngagement,
  selectedEngagementId,
  onSelectAuditContext
}) => {
  // Single Source of Truth for selected audit
  const [activeAuditId, setActiveAuditId] = useState<string>(() => {
    return selectedEngagementId || engagements[0]?.id || 'eng-101';
  });

  const [activeTab, setActiveTab] = useState<'Overview' | 'Timeline' | 'Documents' | 'Activity Log'>('Overview');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState<'All' | 'In Progress' | 'Pending' | 'Completed' | 'Overdue'>('All');
  const [timelineViewMode, setTimelineViewMode] = useState<'Weeks' | 'Calendar'>('Weeks');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedPanelRef = useRef<HTMLDivElement>(null);

  // Sync when parent changes selectedEngagementId
  useEffect(() => {
    if (selectedEngagementId && selectedEngagementId !== activeAuditId) {
      setActiveAuditId(selectedEngagementId);
    }
  }, [selectedEngagementId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const demoEngagements = useMemo(() => {
    return [
      { id: 'demo-1', code: 'AUD-2026-DIST-002', title: 'FY26 ABC Distributors Rebates Audit', distributorName: 'ABC Distributors', status: 'Fieldwork', progressPercent: 45, varianceStatus: 'on_track', overdueItemsCount: 0 },
      { id: 'demo-2', code: 'AUD-2026-DIST-003', title: 'FY26 XYZ Trading Rebates Audit', distributorName: 'XYZ Trading', status: 'Fieldwork', progressPercent: 60, varianceStatus: 'on_track', overdueItemsCount: 0 },
      { id: 'demo-3', code: 'AUD-2026-DIST-004', title: 'FY26 Sunrise Distributors Audit', distributorName: 'Sunrise Distributors', status: 'Fieldwork', progressPercent: 30, varianceStatus: 'on_track', overdueItemsCount: 0 },
      { id: 'demo-4', code: 'AUD-2026-DIST-005', title: 'FY26 Zenith Logistics Audit', distributorName: 'Zenith Logistics', status: 'Fieldwork', progressPercent: 20, varianceStatus: 'on_track', overdueItemsCount: 0 },
      { id: 'demo-5', code: 'AUD-2026-DIST-006', title: 'FY26 Horizon Supply Co Audit', distributorName: 'Horizon Supply Co', status: 'Fieldwork', progressPercent: 50, varianceStatus: 'on_track', overdueItemsCount: 0 },
      { id: 'demo-6', code: 'AUD-2026-DIST-007', title: 'FY26 Alpha Distributors Audit', distributorName: 'Alpha Distributors', status: 'Planning', progressPercent: 0, varianceStatus: 'neutral', overdueItemsCount: 0 },
      { id: 'demo-7', code: 'AUD-2026-DIST-008', title: 'FY26 Beta Supply Co Audit', distributorName: 'Beta Supply Co', status: 'Completed', progressPercent: 100, varianceStatus: 'completed', overdueItemsCount: 0 }
    ].map((m: any) => {
      const { timelinePhases, ...baseEngagement } = engagements[0] || {};
      return {
        ...baseEngagement,
        ...m
      };
    }) as AuditEngagement[];
  }, [engagements]);

  const dashboardEngagements = useMemo(() => {
    return [...engagements, ...demoEngagements];
  }, [engagements, demoEngagements]);

  // Find currently selected audit with graceful fallback
  const currentAudit: AuditEngagement = dashboardEngagements.find(
    e => e.id === activeAuditId || e.code === activeAuditId
  ) || dashboardEngagements[0] || {
    id: 'eng-101',
    code: 'AUD-2026-DIST-001',
    title: 'FY26 Midwest Trading Co. Rebates & Inventory Audit',
    clientName: 'Apex Electronics Corp',
    clientIndustry: 'Consumer Technology',
    distributorName: 'Midwest Trading Co.',
    distributorCode: 'MDT-8092',
    type: 'Distributor',
    status: 'Fieldwork',
    riskRating: 'High',
    leadAuditor: 'Sarah Jenkins',
    teamSize: 4,
    startDate: '15 Sep 2026',
    targetCompletion: '17 Dec 2026',
    forecastCompletion: '12 Dec 2026',
    baselineCompletion: '17 Dec 2026',
    progressPercent: 72,
    daysRemaining: 8,
    overdueItemsCount: 3,
    varianceText: '5 days ahead',
    varianceStatus: 'ahead',
    financialExposure: 425000,
    sampledRecordsCount: 1450,
    totalPopulationCount: 18200,
    findingsCount: { critical: 2, high: 4, medium: 7, low: 3 },
    location: 'Midwest Region (MDT-8092)'
  };

  const handleSelectAudit = (audit: AuditEngagement) => {
    setActiveAuditId(audit.id);
    setIsDropdownOpen(false);
    if (onSelectAuditContext) {
      onSelectAuditContext(audit.id, audit.distributorName, audit.clientName);
    }
  };

  const handleTableViewSelect = (audit: AuditEngagement) => {
    setActiveAuditId(audit.id);
    if (onSelectAuditContext) {
      onSelectAuditContext(audit.id, audit.distributorName, audit.clientName);
    }
    // Smooth scroll down to the Selected Audit Panel
    selectedPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getStatusBadgeClasses = (status?: string) => {
    switch (status) {
      case 'Fieldwork':
      case 'In Progress':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'Overdue':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Planning':
      case 'Pending':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
  };

  const getTimelinePhases = (audit: AuditEngagement) => {
    if (audit.timelinePhases) return audit.timelinePhases;
    const p = audit.progressPercent || 0;
    return {
      irlKickoff: { progress: p > 15 ? 100 : Math.min(100, p * 6), status: p >= 15 ? 'Completed' : 'In Progress', startWeek: 1, endWeek: 2 },
      dataCollection: { progress: p > 40 ? 100 : Math.max(0, Math.min(100, Math.round(p * 2.5))), status: p > 40 ? 'Completed' : (p > 15 ? 'In Progress' : 'Pending'), startWeek: 2, endWeek: 5 },
      dataAnalytics: { progress: p > 70 ? 100 : Math.max(0, Math.min(100, Math.round(p * 1.4))), status: p > 70 ? 'Completed' : (p > 35 ? 'In Progress' : 'Pending'), startWeek: 4, endWeek: 7 },
      supportingDocs: { progress: p > 80 ? 100 : Math.max(0, Math.min(100, Math.round(p * 1.2))), status: p > 80 ? 'Completed' : (p > 40 ? 'In Progress' : 'Pending'), startWeek: 6, endWeek: 9 },
      transactionTesting: { progress: p > 90 ? 100 : Math.max(0, Math.min(100, Math.round(p * 1.1))), status: p > 90 ? 'Completed' : (p > 50 ? 'In Progress' : 'Pending'), startWeek: 6, endWeek: 10 },
      interviewReporting: { progress: p >= 100 ? 100 : Math.max(0, Math.min(100, Math.round(p * 0.9))), status: p >= 100 ? 'Completed' : (p > 70 ? 'In Progress' : 'Pending'), startWeek: 10, endWeek: 12 }
    };
  };

  const phases = getTimelinePhases(currentAudit);

  // Documents for the selected audit
  const auditDocuments = currentAudit.documents || [
    { id: `doc-${currentAudit.id}-1`, name: `${currentAudit.distributorName || 'Distributor'} Master Channel Agreement.pdf`, size: '2.4 MB', category: 'Legal & Contractual', uploadDate: currentAudit.startDate, status: 'Verified' },
    { id: `doc-${currentAudit.id}-2`, name: `IRL Requirement Checklist - ${currentAudit.code}.xlsx`, size: '480 KB', category: 'Compliance', uploadDate: currentAudit.startDate, status: 'Verified' },
    { id: `doc-${currentAudit.id}-3`, name: `POS Sales & Rebate Extraction Dataset.csv`, size: '5.1 MB', category: 'Financial', uploadDate: 'Recent', status: currentAudit.overdueItemsCount ? 'Flagged Exceptions' : 'Verified' }
  ];

  // Activity logs for the selected audit
  const auditLogs = currentAudit.activityLogs || [
    { id: `act-${currentAudit.id}-1`, timestamp: 'Today, 10:45 AM', user: `${currentAudit.leadAuditor} (Lead Auditor)`, action: `Reviewed audit milestones for ${currentAudit.distributorName || currentAudit.title}` },
    { id: `act-${currentAudit.id}-2`, timestamp: 'Yesterday, 3:20 PM', user: 'System Compliance Engine', action: `Synchronized workspace progress: ${currentAudit.progressPercent}% completion` },
    { id: `act-${currentAudit.id}-3`, timestamp: `${currentAudit.startDate}`, user: `${currentAudit.leadAuditor} (Lead Auditor)`, action: `Initiated audit engagement ${currentAudit.code}` }
  ];

  // Filter distributor table rows
  const filteredAudits = dashboardEngagements.filter(audit => {
    const name = audit.distributorName || audit.title;
    const matchesSearch = name.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                          audit.code.toLowerCase().includes(tableSearchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (tableStatusFilter === 'All') return true;
    if (tableStatusFilter === 'In Progress') return audit.status === 'Fieldwork' || audit.status === 'In Progress';
    if (tableStatusFilter === 'Pending') return audit.status === 'Planning' || audit.status === 'Pending';
    if (tableStatusFilter === 'Completed') return audit.status === 'Completed';
    if (tableStatusFilter === 'Overdue') return audit.varianceStatus === 'delayed' || audit.overdueItemsCount && audit.overdueItemsCount > 0;
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-[#0B1120] text-slate-300">
      
      {/* 1. HERO SECTION & DISTRIBUTOR AUDIT SWITCHER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-wider text-indigo-400 bg-indigo-900/30 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase inline-block mb-2">
            Distributor Monitoring Platform (DMP) Executive Control Hub
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Executive Audit Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1">Complete visibility across all distributor audits</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => onTabChange && onTabChange('engagement_workspace')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg"
          >
            <Briefcase className="h-4 w-4" /> Engagement Workspace
          </button>
          <button 
            onClick={onOpenNewAudit}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg"
          >
            <Plus className="h-4 w-4" /> Initiate New Audit
          </button>
        </div>
      </div>

      {/* DEDICATED DISTRIBUTOR AUDIT SWITCHER BAR */}
      <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
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
                  <span className="text-indigo-400 font-mono">{dashboardEngagements.length} Audits</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40">
                  {dashboardEngagements.map((eng) => {
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
                            <span>{eng.progressPercent}% Progress</span>
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

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectEngagement && onSelectEngagement(currentAudit.id)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in Workspace</span>
          </button>
        </div>
      </div>

      {/* LEVEL 1 — OVERALL AUDIT PORTFOLIO OVERVIEW */}
      {/* 2. PORTFOLIO KPI CARDS (STATIC PORTFOLIO OVERVIEW — NEVER CHANGES WHEN SWITCHING AUDIT) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4 group hover:border-slate-700 transition-colors">
          <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium mb-1">Total Assignments</p>
            <h3 className="text-xl font-bold text-white leading-none mb-1">12</h3>
            <p className="text-[10px] text-slate-500">All distributor audits</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4 group hover:border-slate-700 transition-colors">
          <div className="h-12 w-12 rounded-full bg-indigo-900/30 flex items-center justify-center shrink-0">
            <PlayCircle className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium mb-1">In Progress</p>
            <h3 className="text-xl font-bold text-white leading-none mb-1">8</h3>
            <p className="text-[10px] text-slate-500">67% of total</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4 group hover:border-slate-700 transition-colors">
          <div className="h-12 w-12 rounded-full bg-amber-900/30 flex items-center justify-center shrink-0">
            <Hourglass className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium mb-1">Pending to Start</p>
            <h3 className="text-xl font-bold text-white leading-none mb-1">2</h3>
            <p className="text-[10px] text-slate-500">17% of total</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4 group hover:border-slate-700 transition-colors">
          <div className="h-12 w-12 rounded-full bg-emerald-900/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium mb-1">Completed</p>
            <h3 className="text-xl font-bold text-white leading-none mb-1">2</h3>
            <p className="text-[10px] text-slate-500">17% of total</p>
          </div>
        </div>

        <div className="bg-slate-900 border-[1.5px] border-dotted border-pink-500/60 rounded-xl p-5 shadow-lg flex items-center gap-4 group hover:border-pink-500/80 transition-colors relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <div className="h-12 w-12 rounded-full bg-rose-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium mb-1">Overdue</p>
            <h3 className="text-xl font-bold text-white leading-none mb-1">3</h3>
            <p className="text-[10px] text-rose-400">Requires attention</p>
          </div>
        </div>
      </div>

      {/* 3. DISTRIBUTOR AUDITS OVERVIEW TABLE (PORTFOLIO VIEW) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Distributor Audits Overview</h2>
            <p className="text-xs text-slate-400">Select a distributor row to view detailed audit status and timeline below</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                placeholder="Search distributors..." 
                className="bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-4 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 w-64 transition-colors"
              />
            </div>
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
              {(['All', 'In Progress', 'Pending', 'Completed', 'Overdue'] as const).map((filter) => {
                const count = filter === 'All' ? 12 : filter === 'In Progress' ? 8 : filter === 'Pending' ? 2 : filter === 'Completed' ? 2 : 3;
                return (
                  <button 
                    key={filter}
                    onClick={() => setTableStatusFilter(filter)}
                    className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                      tableStatusFilter === filter 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {filter} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto overflow-y-auto max-h-[380px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider shadow-md shadow-slate-900/50">
                <th className="px-6 py-3 font-semibold">Distributor Name</th>
                <th className="px-6 py-3 font-semibold">Engagement ID</th>
                <th className="px-6 py-3 font-semibold w-48">Overall Progress</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Baseline Completion</th>
                <th className="px-6 py-3 font-semibold">Forecast Completion</th>
                <th className="px-6 py-3 font-semibold">Variance</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {filteredAudits.map((audit) => {
                const isSelected = audit.id === currentAudit.id || audit.code === currentAudit.code;
                const progressColor = audit.progressPercent >= 100 
                  ? 'from-emerald-500 to-emerald-400' 
                  : audit.varianceStatus === 'delayed' 
                    ? 'from-amber-500 to-rose-400' 
                    : audit.progressPercent > 0 
                      ? 'from-indigo-500 to-emerald-400' 
                      : 'from-slate-600 to-slate-500';

                return (
                  <tr 
                    key={audit.id}
                    onClick={() => handleTableViewSelect(audit)}
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-indigo-950/40 border-l-4 border-indigo-500' 
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                      {audit.distributorName || audit.title}
                      {isSelected && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-indigo-500/20 text-indigo-300 font-normal rounded border border-indigo-500/30">
                          Active Selection
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">{audit.code}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white w-8">{audit.progressPercent}%</span>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${progressColor} rounded-full transition-all duration-300`} 
                            style={{ width: `${audit.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border ${getStatusBadgeClasses(audit.status)}`}>
                        {audit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{audit.baselineCompletion || audit.targetCompletion}</td>
                    <td className="px-6 py-4 text-slate-300">{audit.forecastCompletion || audit.targetCompletion}</td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${
                        audit.varianceStatus === 'ahead' 
                          ? 'text-emerald-400' 
                          : audit.varianceStatus === 'delayed' 
                            ? 'text-rose-400' 
                            : audit.varianceStatus === 'completed'
                              ? 'text-emerald-400'
                              : 'text-slate-500'
                      }`}>
                        {audit.varianceText || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTableViewSelect(audit);
                        }}
                        className={`px-4 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                          isSelected 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {isSelected ? 'Viewing' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEVEL 2 — SELECTED DISTRIBUTOR AUDIT SECTION (DYNAMICALLY REACTS TO SWITCHER) */}
      <div 
        ref={selectedPanelRef}
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 transition-all duration-200"
      >
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-white">
                {currentAudit.distributorName || currentAudit.title}
              </h2>
              <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${getStatusBadgeClasses(currentAudit.status)}`}>
                {currentAudit.status}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="font-mono text-indigo-400 font-semibold">{currentAudit.code}</span>
              <span>|</span>
              <span>Started: {currentAudit.startDate}</span>
              {currentAudit.location && (
                <>
                  <span>|</span>
                  <span>{currentAudit.location}</span>
                </>
              )}
            </div>
          </div>
          <button 
            onClick={() => onSelectEngagement && onSelectEngagement(currentAudit.id)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-300 hover:text-indigo-200 border border-indigo-700/50 rounded-lg text-xs font-semibold transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Open in Workspace
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-6 border-b border-slate-800 mb-6">
          {(['Overview', 'Timeline', 'Documents', 'Activity Log'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
                activeTab === tab 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SUMMARY KPI CARDS (DYNAMIC TO SELECTED AUDIT) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full border-4 border-slate-800 flex items-center justify-center shrink-0 ${
                currentAudit.progressPercent >= 100 
                  ? 'border-t-emerald-400 border-r-emerald-400 border-b-emerald-400 border-l-emerald-400' 
                  : currentAudit.progressPercent >= 50
                    ? 'border-t-emerald-400 border-r-emerald-400'
                    : 'border-t-indigo-500'
              }`}>
                <span className="text-xs font-bold text-white">{currentAudit.progressPercent}%</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white">Overall Progress</p>
                <p className={`text-[11px] mt-1 font-medium flex items-center gap-1 ${
                  currentAudit.varianceStatus === 'ahead' || currentAudit.progressPercent >= 100
                    ? 'text-emerald-400'
                    : currentAudit.varianceStatus === 'delayed'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                }`}>
                  <TrendingUp className="h-3 w-3" /> 
                  {currentAudit.progressPercent >= 100 
                    ? 'Completed' 
                    : currentAudit.varianceStatus === 'delayed' 
                      ? 'Delayed' 
                      : 'On track'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{currentAudit.forecastCompletion || currentAudit.targetCompletion}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Forecast Completion</p>
              <p className={`text-[11px] font-medium mt-0.5 ${
                currentAudit.varianceStatus === 'ahead' || currentAudit.progressPercent >= 100
                  ? 'text-emerald-400' 
                  : currentAudit.varianceStatus === 'delayed'
                    ? 'text-rose-400'
                    : 'text-slate-400'
              }`}>
                {currentAudit.varianceText || 'On schedule'}
              </p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-slate-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{currentAudit.baselineCompletion || currentAudit.targetCompletion}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Baseline Completion</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-slate-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{currentAudit.daysRemaining ?? 0} days</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Remaining</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3 justify-between group cursor-pointer hover:border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                currentAudit.overdueItemsCount && currentAudit.overdueItemsCount > 0 
                  ? 'bg-rose-500/10' 
                  : 'bg-emerald-500/10'
              }`}>
                <FileText className={`h-5 w-5 ${
                  currentAudit.overdueItemsCount && currentAudit.overdueItemsCount > 0 
                    ? 'text-rose-400' 
                    : 'text-emerald-400'
                }`} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{currentAudit.overdueItemsCount ?? 0}</p>
                <p className={`text-[11px] mt-0.5 ${
                  currentAudit.overdueItemsCount && currentAudit.overdueItemsCount > 0 
                    ? 'text-rose-400' 
                    : 'text-emerald-400'
                }`}>
                  Overdue Items
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />
          </div>
        </div>

        {/* TAB 1: OVERVIEW & TIMELINE PREVIEW */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            {/* Audit Scope & Governance Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-1">Entity & Ownership</p>
                <p className="text-sm font-bold text-white">{currentAudit.distributorName || currentAudit.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">Distributor ID: {currentAudit.distributorCode || 'N/A'}</p>
                <p className="text-xs text-slate-400">Parent Tenant: {currentAudit.clientName}</p>
              </div>

              <div>
                <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-1">Audit Team & Lead</p>
                <p className="text-sm font-bold text-white">{currentAudit.leadAuditor}</p>
                <p className="text-xs text-slate-400 mt-0.5">Audit Team Size: {currentAudit.teamSize} Auditors</p>
                <p className="text-xs text-slate-400">Risk Assessment: <span className="text-amber-400 font-semibold">{currentAudit.riskRating} Risk</span></p>
              </div>

              <div>
                <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-1">Exposure & Population</p>
                <p className="text-sm font-bold text-rose-400">${(currentAudit.financialExposure || 0).toLocaleString()} USD</p>
                <p className="text-xs text-slate-400 mt-0.5">Sampled: {(currentAudit.sampledRecordsCount || 0).toLocaleString()} / {(currentAudit.totalPopulationCount || 0).toLocaleString()} lines</p>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="text-rose-400 font-medium">{currentAudit.findingsCount?.critical || 0} Critical</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-400 font-medium">{currentAudit.findingsCount?.high || 0} High</span>
                </div>
              </div>
            </div>

            {/* Timeline Snapshot */}
            <div className="border border-slate-800 rounded-xl p-5 bg-slate-950/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Phase Completion Breakdown</h3>
                <button 
                  onClick={() => setActiveTab('Timeline')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  View 12-Week Gantt Chart <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  { label: 'IRL & Kick-off', phase: phases.irlKickoff },
                  { label: 'Data Collection', phase: phases.dataCollection },
                  { label: 'Data Analytics', phase: phases.dataAnalytics },
                  { label: 'Supporting Docs', phase: phases.supportingDocs },
                  { label: 'Transaction Testing', phase: phases.transactionTesting },
                  { label: 'Interview & Report', phase: phases.interviewReporting }
                ].map(({ label, phase }) => (
                  <div key={label} className="bg-slate-900 border border-slate-800/80 rounded-lg p-3">
                    <p className="text-[11px] font-medium text-slate-400 truncate mb-1">{label}</p>
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                      <span>{phase.progress}%</span>
                      <span className={`text-[10px] font-normal ${
                        phase.status === 'Completed' ? 'text-emerald-400' :
                        phase.status === 'Overdue' ? 'text-rose-400' :
                        phase.status === 'In Progress' ? 'text-indigo-400' : 'text-slate-500'
                      }`}>
                        {phase.status}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          phase.status === 'Completed' ? 'bg-emerald-500' :
                          phase.status === 'Overdue' ? 'bg-rose-500' :
                          phase.status === 'In Progress' ? 'bg-indigo-500' : 'bg-slate-700'
                        }`}
                        style={{ width: `${phase.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT TIMELINE (12 WEEKS GANTT) */}
        {activeTab === 'Timeline' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-white">
                Audit Timeline (12 Weeks) — {currentAudit.distributorName || currentAudit.title}
              </h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500/40 rounded-full"></div><span className="text-slate-400">Baseline Plan</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div><span className="text-slate-400">Actual Progress</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-400 rounded-full"></div><span className="text-slate-400">Current Forecast</span></div>
                </div>
                <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
                  <button 
                    onClick={() => setTimelineViewMode('Weeks')}
                    className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                      timelineViewMode === 'Weeks' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Weeks
                  </button>
                  <button 
                    onClick={() => setTimelineViewMode('Calendar')}
                    className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                      timelineViewMode === 'Calendar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Calendar
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline Grid */}
            <div className="relative overflow-x-auto pb-4">
              <div className="min-w-[840px]">
                {/* Header */}
                <div className="flex w-full mb-4 relative ml-56">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex-1 text-[10px] font-semibold text-slate-500 tracking-wider">
                      Week {i + 1}
                    </div>
                  ))}
                </div>

                {/* Grid Lines */}
                <div className="absolute top-8 bottom-0 left-56 right-0 flex pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex-1 border-l border-slate-800/50"></div>
                  ))}
                  <div className="border-l border-slate-800/50"></div>
                </div>

                {/* Rows */}
                <div className="space-y-4">
                  
                  {/* IRL & Kick-off */}
                  <div className="flex items-center h-8">
                    <div className="w-56 shrink-0 flex items-center justify-between pr-4 text-xs font-medium text-slate-200">
                      <span className="flex items-center gap-2">
                        {phases.irlKickoff.status === 'Completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Hourglass className="h-4 w-4 text-indigo-400 shrink-0" />
                        )}
                        IRL & Kick-off
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{phases.irlKickoff.progress}%</span>
                    </div>
                    <div className="flex-1 relative h-full flex items-center">
                      <div className="absolute h-3.5 rounded-full border border-emerald-500/40 bg-indigo-500/20" style={{ left: '0%', width: '16.66%' }}>
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${phases.irlKickoff.progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Data Collection & Interview */}
                  <div className="flex items-center h-8">
                    <div className="w-56 shrink-0 flex items-center justify-between pr-4 text-xs font-medium text-slate-200">
                      <span className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                          phases.dataCollection.status === 'Overdue' ? 'bg-rose-600' : 'bg-indigo-600'
                        }`}>
                          <ListTodo className="h-3 w-3 text-white" />
                        </div>
                        Data Collection & Interview
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{phases.dataCollection.progress}%</span>
                    </div>
                    <div className="flex-1 relative h-full flex items-center">
                      <div className={`absolute h-3.5 rounded-full border ${
                        phases.dataCollection.status === 'Overdue' ? 'border-rose-500/50 bg-rose-950/20' : 'border-indigo-500/40 bg-indigo-500/20'
                      }`} style={{ left: '8.33%', width: '33.33%' }}>
                        <div className={`h-full rounded-full ${
                          phases.dataCollection.status === 'Overdue' ? 'bg-rose-500' : 'bg-indigo-500'
                        }`} style={{ width: `${phases.dataCollection.progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Data Analytics */}
                  <div className="flex items-center h-8">
                    <div className="w-56 shrink-0 flex items-center justify-between pr-4 text-xs font-medium text-slate-200">
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center shrink-0">
                          <BarChart3 className="h-3 w-3 text-white" />
                        </div>
                        Data Analytics
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{phases.dataAnalytics.progress}%</span>
                    </div>
                    <div className="flex-1 relative h-full flex items-center">
                      <div className="absolute h-3.5 rounded-full border border-slate-700 border-dashed bg-indigo-500/20" style={{ left: '33.33%', width: '25%' }}>
                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${phases.dataAnalytics.progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Supporting Documents */}
                  <div className="flex items-center h-8">
                    <div className="w-56 shrink-0 flex items-center justify-between pr-4 text-xs font-medium text-slate-200">
                      <span className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                          phases.supportingDocs.status === 'Overdue' ? 'bg-rose-500' : 'bg-orange-500'
                        }`}>
                          <FileText className="h-3 w-3 text-white" />
                        </div>
                        Supporting Documents
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{phases.supportingDocs.progress}%</span>
                    </div>
                    <div className="flex-1 relative h-full flex items-center">
                      <div className={`absolute h-3.5 rounded-full border border-dashed ${
                        phases.supportingDocs.status === 'Overdue' ? 'border-rose-500/50 bg-rose-950/20' : 'border-slate-700 bg-indigo-500/20'
                      }`} style={{ left: '50%', width: '25%' }}>
                        <div className={`h-full rounded-full ${
                          phases.supportingDocs.status === 'Overdue' ? 'bg-rose-500' : 'bg-orange-400'
                        }`} style={{ width: `${phases.supportingDocs.progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Testing */}
                  <div className="flex items-center h-8">
                    <div className="w-56 shrink-0 flex items-center justify-between pr-4 text-xs font-medium text-slate-200">
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-cyan-500 flex items-center justify-center shrink-0">
                          <Search className="h-3 w-3 text-white" />
                        </div>
                        Transaction Testing
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{phases.transactionTesting.progress}%</span>
                    </div>
                    <div className="flex-1 relative h-full flex items-center">
                      <div className="absolute h-3.5 rounded-full border border-slate-700 border-dashed bg-indigo-500/20" style={{ left: '50%', width: '33.33%' }}>
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${phases.transactionTesting.progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Interview & Reporting */}
                  <div className="flex items-center h-8">
                    <div className="w-56 shrink-0 flex items-center justify-between pr-4 text-xs font-medium text-slate-200">
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-rose-500 flex items-center justify-center shrink-0">
                          <FileText className="h-3 w-3 text-white" />
                        </div>
                        Interview & Reporting
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{phases.interviewReporting.progress}%</span>
                    </div>
                    <div className="flex-1 relative h-full flex items-center">
                      <div className="absolute h-3.5 rounded-full border border-rose-500/40 border-dashed bg-indigo-500/20" style={{ left: '83.33%', width: '16.66%' }}>
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${phases.interviewReporting.progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DOCUMENTS TAB (DYNAMIC TO SELECTED AUDIT) */}
        {activeTab === 'Documents' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Audit Documents & Evidence Package
                </h3>
                <p className="text-xs text-slate-400">
                  Document repository and verification records for {currentAudit.distributorName || currentAudit.title} ({currentAudit.code})
                </p>
              </div>
              <button 
                onClick={() => onTabChange && onTabChange('evidence')}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Paperclip className="h-3.5 w-3.5" /> View in Evidence Repository
              </button>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <th className="px-5 py-3 font-semibold">Document Title</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Size</th>
                    <th className="px-5 py-3 font-semibold">Uploaded</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-white flex items-center gap-2.5">
                        <FileSpreadsheet className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span>{doc.name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{doc.category}</td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">{doc.size}</td>
                      <td className="px-5 py-3.5 text-slate-400">{doc.uploadDate}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          doc.status === 'Verified' || doc.status === 'Signed & Published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : doc.status === 'Flagged Exceptions'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVITY LOG TAB (DYNAMIC TO SELECTED AUDIT) */}
        {activeTab === 'Activity Log' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Audit Activity Stream
                </h3>
                <p className="text-xs text-slate-400">
                  Auditor actions, distributor uploads, and status changes for {currentAudit.distributorName || currentAudit.title}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{log.user}</span>
                      <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300">{log.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
