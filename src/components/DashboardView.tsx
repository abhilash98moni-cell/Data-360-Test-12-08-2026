import React, { useState } from 'react';
import { 
  AuditEngagement, 
  AuditFinding,
  SamplingRun,
  AuditAssignment
} from '../types';
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
  Search
} from 'lucide-react';

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

import { formatCurrency, CurrencyMode } from '../utils/currencyFormatter';

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

import { useEffect } from 'react';

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
  const currencyMode: CurrencyMode = activeCurrencyMode as CurrencyMode;
  const [expandedEngId, setExpandedEngId] = useState<string | null>('eng-101');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Financial Metrics
  const totalExposure = engagements.reduce((sum, e) => sum + e.financialExposure, 0);
  const criticalFindings = findings.filter(f => f.severity === 'Critical');
  const highFindings = findings.filter(f => f.severity === 'High');

  // Assignment Metrics (Completed, On Progress, Pending)
  const totalAssignmentsCount = assignments.length;
  const completedAssignmentsCount = assignments.filter(a => a.status === 'Completed').length;
  const onProgressAssignmentsCount = assignments.filter(a => a.status === 'On Progress').length;
  const pendingAssignmentsCount = assignments.filter(a => a.status === 'Pending').length;

  // Assignment Status Pie Chart Data
  const assignmentStatusData = [
    { name: 'Completed', value: completedAssignmentsCount, color: '#10b981' }, // Emerald
    { name: 'On Progress', value: onProgressAssignmentsCount, color: '#3b82f6' }, // Blue
    { name: 'Pending', value: pendingAssignmentsCount, color: '#f59e0b' } // Amber
  ];

  // Module Breakdown Data for Bar Chart
  const modulesList = ['Questionnaire', 'Evidence Collection', 'MUS Sampling', 'Forensic Testing', 'CAPA Review', 'Drafting Report'];
  const moduleChartData = modulesList.map(mod => {
    const modAssignments = assignments.filter(a => a.module === mod);
    return {
      module: mod.replace('Collection', 'Coll.').replace('Questionnaire', 'Quest.'),
      Completed: modAssignments.filter(a => a.status === 'Completed').length,
      'On Progress': modAssignments.filter(a => a.status === 'On Progress').length,
      Pending: modAssignments.filter(a => a.status === 'Pending').length
    };
  });

  // Filter Engagements
  const filteredEngagements = engagements.filter(eng => {
    const matchesStatus = statusFilter === 'All' || eng.status === statusFilter;
    const matchesRisk = riskFilter === 'All' || eng.riskRating === riskFilter;
    const matchesQuery = searchQuery === '' || 
      eng.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eng.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eng.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesRisk && matchesQuery;
  });

  // Render Distributor Portal Dashboard if logged in user is a Distributor
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
    const distributorFindings = findings.filter(f => 
      f.auditedEntity.toLowerCase().includes(distOrg.toLowerCase()) ||
      f.assignedTo.toLowerCase().includes(distOrg.toLowerCase())
    );
    const distFinding = distributorFindings[0] || findings[0];

    return (
      <div className="w-full p-4 sm:p-6 space-y-6 text-slate-100 animate-fade-in">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Distributor Channel Partner Portal
              </span>
              <span className="text-xs text-slate-400">• Multi-Tenant Isolated View</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Welcome, {distOrg}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Active Audit: <span className="text-emerald-300 font-semibold">FY26 Distributor Channel Rebates & Inventory Verification (Ref: AUD-2026-DIST-001)</span>. Track required document submissions, uploaded evidence verification, and action item (CAPA) responses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('engagement_workspace')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Document Requests (IIR)</span>
            </button>

            <button
              onClick={() => onTabChange('findings')}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>View Action Items ({distributorFindings.length})</span>
            </button>

            <button
              onClick={onOpenCopilot}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>AI Assistant</span>
            </button>
          </div>
        </div>

        {/* Distributor KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Engagement Status</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckSquare className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-emerald-400">Fieldwork Active</p>
            <p className="text-[11px] text-slate-400">Target Completion: <span className="font-mono text-slate-200">Aug 25, 2026</span></p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Document Requests (IIR)</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-white">18 / 24 Items Done</p>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1 border border-slate-800">
              <div className="bg-indigo-500 h-full w-[75%] rounded-full"></div>
            </div>
            <p className="text-[10px] text-indigo-300 font-medium">75% Completion Rate</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Open Action Items (CAPA)</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-amber-400">{distributorFindings.length} Observation</p>
            <p className="text-[11px] text-slate-400">Action Plan Due: <span className="font-mono text-amber-300">Aug 15, 2026</span></p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Verified Evidence Files</span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-white">12 Files Uploaded</p>
            <p className="text-[11px] text-emerald-400">✓ SHA-256 Encrypted & Validated</p>
          </div>

        </div>

        {/* Distributor Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Column: Information Requests & CAPA List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card 1: Document Request Progress (IIR Summary) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
                    <span>Required Information Requests (IRL Status)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Submit required financial schedules, invoices, and warehouse logs for audit verification.</p>
                </div>
                <button
                  onClick={() => onTabChange('engagement_workspace')}
                  className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold rounded-lg transition-all"
                >
                  Open Full IRL Portal →
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-white">1. Trade Licenses & Organizational Master File</p>
                    <p className="text-[11px] text-slate-400">Uploaded by Robert Vance on Jul 10 • 4 Files Verified</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold">Verified ✅</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-white">2. Q1-Q4 ERP Sales & Invoicing Ledgers</p>
                    <p className="text-[11px] text-slate-400">Uploaded by David Vance on Jul 14 • 8 Files Verified</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold">Verified ✅</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-amber-200">3. Q2 Volume Rebate Calculation Worksheets</p>
                    <p className="text-[11px] text-amber-300/80">Audit Team Note: Clarification requested on gross vs net price basis.</p>
                  </div>
                  <button 
                    onClick={() => onTabChange('engagement_workspace')}
                    className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Respond / Upload ⚠️
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-white">4. Physical Warehouse Stock Count Audit Certificate</p>
                    <p className="text-[11px] text-slate-400">Uploaded by Logistics Team on Jul 20 • 2 Files Verified</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold">Verified ✅</span>
                </div>
              </div>
            </div>

            {/* Card 2: Assigned Observation & CAPA Action Items */}
            {distFinding && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-amber-400" />
                      <span>Assigned Audit Observation & CAPA Action Item</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Audit findings requiring action plan submission from {distOrg}.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold">
                    {distFinding.severity} Severity
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-indigo-400 font-bold">{distFinding.findingCode}</span>
                    <span className="text-xs text-emerald-400 font-bold font-mono">Impact: {formatCurrency(distFinding.financialImpact, currencyMode)}</span>
                  </div>

                  <h4 className="font-bold text-white text-sm">{distFinding.title}</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-amber-400 font-bold block">Audit Finding Root Cause</span>
                      <p className="text-slate-300 leading-relaxed">{distFinding.rootCause}</p>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-indigo-400 font-bold block">Recommended CAPA Action</span>
                      <p className="text-slate-300 leading-relaxed">{distFinding.recommendation}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-400">Assigned To: <span className="text-slate-200 font-semibold">{distFinding.assignedTo}</span></span>
                    <button
                      onClick={() => onTabChange('findings')}
                      className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-lg shadow cursor-pointer hover:bg-amber-500 transition-colors"
                    >
                      Update CAPA Action Plan →
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Lead Auditor Contacts & Isolation Guarantee */}
          <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
                <UserCheck className="h-4 w-4 text-indigo-400" />
                <span>Audit Team Contacts</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Lead Forensic Auditor</p>
                  <p className="font-bold text-white text-sm">Sarah Jenkins</p>
                  <p className="text-slate-400">Apex Audit Practice (AA)</p>
                  <p className="text-indigo-300 font-mono text-[11px] mt-1">s.jenkins@apex-audit.com</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Client Audit Sponsor</p>
                  <p className="font-bold text-white text-sm">Marcus Thorne</p>
                  <p className="text-slate-400">Apex Electronics Corp</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <UserCheck className="h-4 w-4" />
                <span>Multi-Tenant Security Guarantee</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Your portal connection is cryptographically isolated under <span className="text-emerald-300 font-semibold">{distOrg}</span>. Financial data and uploaded evidence are strictly inaccessible to other distributors or unauthorized third parties.
              </p>
            </div>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">
      
      {/* Welcome & Access Security Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/30">
                Data360 Executive Control Hub
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                Auditor & Company Access (Distributor Portal Isolated)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Enterprise Executive Audit Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('engagement_workspace')}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              <span>Engagement Workspace</span>
            </button>

            <button
              onClick={onOpenNewAudit}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Initiate New Audit</span>
            </button>
            

            
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Financial Exposure */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Identified Leakage</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {currencyMode === 'USD' ? <DollarSign className="h-4 w-4" /> : <IndianRupee className="h-4 w-4" />}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {formatCurrency(totalExposure, currencyMode)}
            </div>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="h-3 w-3" />
              +{formatCurrency(320000, currencyMode, true)} recovery pipeline across active audits
            </p>
          </div>
        </div>

        {/* Active Audit Engagements */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Engagements</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {engagements.length} <span className="text-sm text-slate-400 font-normal">Active Audits</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Distributor, Forensic, Vendor & Franchise
            </p>
          </div>
        </div>

        {/* Critical & High Findings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Identified Observations</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-2">
              <span className="text-red-400">{criticalFindings.length} Critical</span>
              <span className="text-sm text-amber-400 font-medium">/ {highFindings.length} High</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Requiring Partner review & CAPA action
            </p>
          </div>
        </div>

        {/* Total Assignments Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Assignments</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-2">
              <span>{totalAssignmentsCount}</span>
              <span className="text-xs text-emerald-400 font-semibold">({completedAssignmentsCount} Completed)</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {onProgressAssignmentsCount} On Progress &bull; {pendingAssignmentsCount} Pending
            </p>
          </div>
        </div>

      </div>

      {/* SECTION 3: Total Assignments Charts (Completed, Pending, On Progress) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Audit Assignments Overview & Completion Status</span>
            </h2>
            <p className="text-xs text-slate-400">Breakdown of audit task assignments across Completed, On Progress, and Pending workflow stages</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Completed: <b>{completedAssignmentsCount}</b> ({Math.round((completedAssignmentsCount / (totalAssignmentsCount || 1)) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>On Progress: <b>{onProgressAssignmentsCount}</b> ({Math.round((onProgressAssignmentsCount / (totalAssignmentsCount || 1)) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Pending: <b>{pendingAssignmentsCount}</b> ({Math.round((pendingAssignmentsCount / (totalAssignmentsCount || 1)) * 100)}%)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Donut Chart: Status Ratio */}
          <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Assignment Status Distribution</h3>
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assignmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assignmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 text-center text-xs divide-x divide-slate-800 pt-2 border-t border-slate-800">
              <div>
                <span className="text-emerald-400 font-bold block">{completedAssignmentsCount}</span>
                <span className="text-[10px] text-slate-400">Completed</span>
              </div>
              <div>
                <span className="text-blue-400 font-bold block">{onProgressAssignmentsCount}</span>
                <span className="text-[10px] text-slate-400">On Progress</span>
              </div>
              <div>
                <span className="text-amber-400 font-bold block">{pendingAssignmentsCount}</span>
                <span className="text-[10px] text-slate-400">Pending</span>
              </div>
            </div>
          </div>

          {/* Bar Chart: Module Assignment Workload */}
          <div className="lg:col-span-8 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Assignments Workload by Audit Lifecycle Module</h3>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="module" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                  <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="On Progress" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Auditors actively performing fieldwork and sampling across 6 active enterprise clients.</span>
              <span className="text-indigo-400 font-medium">Auto-updated from field workpapers</span>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 1 & 2: Active Engagements Table with Status & Expandable Identified Issues + Sample Coverage */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-400" />
              <span>Active Audit Engagements & Nested Observations</span>
            </h2>
            <p className="text-xs text-slate-400">Click any engagement to expand its sample coverage and identified issues/observations.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit / client..."
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Planning">Planning</option>
              <option value="Fieldwork">Fieldwork</option>
              <option value="Sampling">Sampling</option>
              <option value="Draft Report">Draft Report</option>
              <option value="Remediation">Remediation</option>
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Risk Ratings</option>
              <option value="Critical">Critical Risk</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
        </div>

        {/* Engagements Accordion Table */}
        <div className="space-y-3">
          {filteredEngagements.map((eng) => {
            const isExpanded = expandedEngId === eng.id;
            const engFindings = findings.filter(f => f.engagementId === eng.id);
            const engSampling = samplingRuns.find(s => s.auditId === eng.id);
            const engAssignments = assignments.filter(a => a.engagementId === eng.id);

            // Sample Coverage Math
            const sampleCoveragePercent = eng.totalPopulationCount > 0 
              ? Math.round((eng.sampledRecordsCount / eng.totalPopulationCount) * 1000) / 10
              : 0;

            return (
              <div 
                key={eng.id}
                className={`border rounded-xl transition-all overflow-hidden ${
                  isExpanded 
                    ? 'border-indigo-500/50 bg-slate-950/80 shadow-lg' 
                    : 'border-slate-800 bg-slate-950/40 hover:bg-slate-950/60'
                }`}
              >
                {/* Main Engagement Bar */}
                <div 
                  onClick={() => setExpandedEngId(isExpanded ? null : eng.id)}
                  className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button 
                      className={`p-1.5 rounded-lg border transition-all mt-0.5 ${
                        isExpanded ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {eng.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          eng.riskRating === 'Critical' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                          eng.riskRating === 'High' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {eng.riskRating} Risk
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{eng.type} Audit</span>
                      </div>
                      
                      <h3 className="text-sm font-bold text-white tracking-tight truncate">{eng.title}</h3>
                      
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                        <span>Client: <strong className="text-slate-200">{eng.clientName}</strong></span>
                        <span>&bull; Lead: <strong className="text-slate-200">{eng.leadAuditor}</strong></span>
                        <span>&bull; Target: <strong className="text-slate-200">{eng.targetCompletion}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status & Financial Exposure Block */}
                  <div className="flex items-center gap-6 shrink-0 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 w-full md:w-auto justify-between md:justify-end">
                    
                    {/* Status Badge */}
                    <div className="text-left md:text-right">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Status</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block mt-0.5 ${
                        eng.status === 'Fieldwork' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                        eng.status === 'Sampling' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                        eng.status === 'Draft Report' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        eng.status === 'Remediation' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {eng.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-24 text-left">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Progress</span>
                        <span className="font-mono font-bold text-indigo-300">{eng.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${eng.progressPercent}%` }}></div>
                      </div>
                    </div>

                    {/* Financial Exposure */}
                    <div className="text-right min-w-[100px]">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Exposure</span>
                      <span className="text-sm font-mono font-extrabold text-emerald-400 block mt-0.5">
                        {formatCurrency(eng.financialExposure, currencyMode)}
                      </span>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEngagement(eng.id);
                        onTabChange('sampling');
                      }}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold shadow-sm cursor-pointer"
                    >
                      Workpapers
                    </button>
                  </div>
                </div>

                {/* EXPANDED CONTENT: Sample Coverage + Identified Observations inside Engagement */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-900/60 p-5 space-y-5">
                    
                    {/* SECTION A: Sample Coverage Summary */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Sample Coverage & Population Metrics</h4>
                        </div>
                        <span className="text-[11px] bg-cyan-500/10 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-500/20">
                          Methodology: {engSampling?.methodology || 'Monetary Unit Sampling (MUS)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                          <span className="text-[10px] uppercase text-slate-400 block">Sampled Records</span>
                          <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                            {eng.sampledRecordsCount.toLocaleString()} / {eng.totalPopulationCount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-semibold mt-1 block">
                            {sampleCoveragePercent}% population tested
                          </span>
                        </div>

                        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                          <span className="text-[10px] uppercase text-slate-400 block">Sampled Dollar Value</span>
                          <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                            {engSampling ? formatCurrency(engSampling.sampledValue, currencyMode, true) : formatCurrency(eng.financialExposure * 4, currencyMode, true)}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Out of {engSampling ? formatCurrency(engSampling.totalPopulationValue, currencyMode, true) : formatCurrency(eng.financialExposure * 15, currencyMode, true)}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                          <span className="text-[10px] uppercase text-slate-400 block">Confidence Level</span>
                          <span className="text-sm font-bold font-mono text-indigo-300 mt-0.5 block">
                            {engSampling?.confidenceLevel || 95}% Confidence
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Tolerable Error: {engSampling ? formatCurrency(engSampling.tolerableMisstatement, currencyMode) : formatCurrency(150000, currencyMode)}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                          <span className="text-[10px] uppercase text-slate-400 block">Projected Error</span>
                          <span className="text-sm font-bold font-mono text-amber-400 mt-0.5 block">
                            {engSampling ? formatCurrency(engSampling.projectedError, currencyMode) : formatCurrency(eng.financialExposure, currencyMode)}
                          </span>
                          <span className="text-[10px] text-red-400 font-semibold mt-1 block">
                            {engFindings.length} Active Observations
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION B: Identified Issues & Observations nested inside Engagement */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                            Identified Issues & Observations ({engFindings.length})
                          </h4>
                        </div>
                        <button
                          onClick={() => onTabChange('findings')}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <span>Manage all CAPA remediation plans</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>

                      {engFindings.length === 0 ? (
                        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg text-center text-xs text-slate-400">
                          No open critical findings recorded for this engagement yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {engFindings.map((fnd) => (
                            <div 
                              key={fnd.id}
                              onClick={() => onTabChange('findings')}
                              className="p-3.5 bg-slate-950/90 border border-slate-800 hover:border-indigo-500/40 rounded-xl space-y-2 cursor-pointer transition-all shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border ${
                                    fnd.severity === 'Critical' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                    fnd.severity === 'High' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                    'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  }`}>
                                    {fnd.severity}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">{fnd.findingCode}</span>
                                </div>
                                <span className="font-mono font-extrabold text-emerald-400 text-xs">
                                  {formatCurrency(fnd.financialImpact, currencyMode)}
                                </span>
                              </div>

                              <h5 className="text-xs font-bold text-white leading-tight">{fnd.title}</h5>
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{fnd.rootCause}</p>

                              <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-800/80 text-slate-400">
                                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-medium">
                                  Category: {fnd.category}
                                </span>
                                <span className="text-amber-400 font-semibold">
                                  Status: {fnd.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SECTION C: Active Task Assignments inside Engagement */}
                    {engAssignments.length > 0 && (
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                          Active Audit Tasks for this Engagement ({engAssignments.length})
                        </h4>
                        <div className="divide-y divide-slate-800/60 text-xs text-slate-300">
                          {engAssignments.map((asgn) => (
                            <div key={asgn.id} className="py-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  asgn.status === 'Completed' ? 'bg-emerald-500' :
                                  asgn.status === 'On Progress' ? 'bg-blue-500' : 'bg-amber-500'
                                }`}></span>
                                <span className="font-semibold text-slate-200">{asgn.taskTitle}</span>
                                <span className="text-[10px] text-slate-500">({asgn.module})</span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px]">
                                <span className="text-slate-400">{asgn.assignee}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                  asgn.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                  asgn.status === 'On Progress' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                  'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`}>
                                  {asgn.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
