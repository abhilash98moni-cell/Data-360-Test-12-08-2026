import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle2, ChevronRight, Clock, Search, ListTodo, AlertCircle, 
  ArrowRight, Activity, GitCommit, FileText, CheckSquare, Presentation, ShieldAlert,
  Users, UserCheck, Check, SearchIcon, FileSpreadsheet, Hourglass, Plus, BarChart3,
  TrendingUp, CheckCircle, Clock4, Briefcase, Filter, X
} from 'lucide-react';
import { AuditEngagement, UserSession } from '../types';

interface ExecutiveAuditTimelineDashboardProps {
  engagements: AuditEngagement[];
  currentUser: UserSession | null;
  onOpenNewAudit?: () => void;
  onTabChange?: (tab: string) => void;
  onSelectEngagement?: (id: string) => void;
}

export const ExecutiveAuditTimelineDashboard: React.FC<ExecutiveAuditTimelineDashboardProps> = ({ 
  engagements, currentUser, onOpenNewAudit, onTabChange, onSelectEngagement
}) => {
  const [selectedEngId, setSelectedEngId] = useState<string | null>(null);
  const [allTimelines, setAllTimelines] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<any | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const results: Record<string, any[]> = {};
      await Promise.all(engagements.map(async (eng) => {
        try {
          const res = await fetch(`/api/engagement-timeline?auditId=${eng.id}&distributorName=${encodeURIComponent(eng.distributorName || eng.clientName)}&auditStartDate=${eng.startDate}`, {
            headers: {
              'x-user-email': currentUser?.email || '',
              'x-user-role': currentUser?.role || 'Auditor'
            }
          });
          const data = await res.json();
          if (data.success && data.stages) {
            results[eng.id] = data.stages;
          }
        } catch(e) {}
      }));
      setAllTimelines(results);
      setLoading(false);
    };
    if (engagements.length > 0) fetchAll();
  }, [engagements, currentUser]);

  const selectedEngagement = engagements.find(e => e.id === selectedEngId);
  const timelineStages = selectedEngId ? (allTimelines[selectedEngId] || []) : [];

  const getEngagementMetrics = (engId: string) => {
    const stages = allTimelines[engId] || [];
    if (!stages.length) return { progress: 0, status: 'Pending', baselineCompletion: null, forecastCompletion: null, variance: 0 };
    
    const totalWeights = stages.length;
    let completedWeights = 0;
    
    stages.forEach(s => {
      completedWeights += (s.progressPercent || 0) / 100;
    });
    
    const overallProgress = Math.round((completedWeights / totalWeights) * 100);
    
    let status = 'Not Started';
    if (overallProgress > 0 && overallProgress < 99) status = 'In Progress';
    if (overallProgress >= 99 && overallProgress < 100) status = 'Ready for Sign-off';
    if (overallProgress === 100) status = 'Completed';
    
    const lastStage = stages[stages.length - 1];
    let isOverdue = stages.some(s => s.status === 'Overdue');
    if (isOverdue && status !== 'Completed') status = 'Overdue';

    return {
      progress: overallProgress,
      status,
      baselineCompletion: lastStage?.baselineEndDate,
      forecastCompletion: lastStage?.forecastEndDate || lastStage?.actualEndDate,
      variance: lastStage?.daysVariance || 0
    };
  };

  // KPIs
  const totalAssignments = engagements.length;
  const inProgressCount = engagements.filter(e => {
    const m = getEngagementMetrics(e.id);
    return m.status === 'In Progress' || m.status === 'Ready for Sign-off';
  }).length;
  const pendingCount = engagements.filter(e => getEngagementMetrics(e.id).status === 'Not Started' || getEngagementMetrics(e.id).status === 'Pending').length;
  const completedCount = engagements.filter(e => getEngagementMetrics(e.id).status === 'Completed').length;
  const overdueCount = engagements.filter(e => getEngagementMetrics(e.id).status === 'Overdue').length;

  const filteredEngagements = engagements.filter(m => {
    const metrics = getEngagementMetrics(m.id);
    if (filter !== 'All') {
      if (filter === 'In Progress' && (metrics.status !== 'In Progress' && metrics.status !== 'Ready for Sign-off')) return false;
      if (filter === 'Pending' && (metrics.status !== 'Pending' && metrics.status !== 'Not Started')) return false;
      if (filter === 'Completed' && metrics.status !== 'Completed') return false;
      if (filter === 'Overdue' && metrics.status !== 'Overdue') return false;
    }
    const distName = m.distributorName || m.clientName;
    if (search && !distName.toLowerCase().includes(search.toLowerCase()) && !m.code.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const renderGanttTimeline = () => {
    if (!timelineStages.length) return null;

    const projectStart = new Date(timelineStages[0].baselineStartDate).getTime();
    const totalDays = 84; // 12 weeks
    const msPerDay = 1000 * 3600 * 24;

    const getPosition = (dateStr: string) => {
      if (!dateStr) return 0;
      const date = new Date(dateStr).getTime();
      const diffDays = (date - projectStart) / msPerDay;
      return Math.max(0, Math.min(100, (diffDays / totalDays) * 100));
    };

    const getWidth = (startStr: string, endStr: string) => {
      if (!startStr || !endStr) return 0;
      const start = new Date(startStr).getTime();
      const end = new Date(endStr).getTime();
      const diffDays = (end - start) / msPerDay;
      return Math.max(1, Math.min(100, (diffDays / totalDays) * 100));
    };

    return (
      <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Audit Timeline</h2>
            <p className="text-slate-400 text-sm mt-1">12-week baseline vs actual progress and current forecast</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0 text-xs">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-700 rounded-sm"></div> <span className="text-slate-400">Baseline</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> <span className="text-slate-400">Actual/Forecast</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded-sm"></div> <span className="text-slate-400">Overdue</span></div>
          </div>
        </div>

        {/* Gantt Grid */}
        <div className="relative pt-6 pb-4 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline Header (Weeks) */}
            <div className="flex w-full mb-4 relative">
              <div className="w-48 shrink-0"></div> {/* Label spacer */}
              <div className="flex-1 relative h-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="absolute text-[10px] font-bold text-slate-500 uppercase" style={{ left: `${(i / 12) * 100}%` }}>
                    W{i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Grid Lines */}
            <div className="absolute top-10 bottom-4 left-48 right-0 flex">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex-1 border-l border-slate-800/50"></div>
              ))}
              <div className="border-l border-slate-800/50"></div>
            </div>

            {/* Stages */}
            <div className="space-y-6 relative">
              {timelineStages.map((stage, idx) => {
                const baseStart = getPosition(stage.baselineStartDate);
                const baseWidth = getWidth(stage.baselineStartDate, stage.baselineEndDate);
                
                const actStartStr = stage.actualStartDate || stage.forecastStartDate;
                const actEndStr = stage.actualEndDate || stage.forecastEndDate;
                
                const actStart = getPosition(actStartStr);
                const actWidth = getWidth(actStartStr, actEndStr);

                const isOverdue = stage.status === 'Overdue';
                const isCompleted = stage.progressPercent === 100 || stage.status === 'Completed Early';

                return (
                  <div key={stage.id} className="relative flex items-center group cursor-pointer" onClick={() => setSelectedStage(stage)}>
                    {/* Stage Label */}
                    <div className="w-48 shrink-0 pr-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300 truncate pr-2 group-hover:text-white transition-colors">{idx + 1}. {stage.name}</span>
                      <span className="text-xs text-slate-500">{stage.progressPercent}%</span>
                    </div>

                    {/* Bars Container */}
                    <div className="flex-1 relative h-10 bg-slate-900/50 rounded hover:bg-slate-800/30 transition-colors">
                      {/* Baseline Bar */}
                      <div 
                        className="absolute top-2 h-1.5 bg-slate-700/50 rounded-full"
                        style={{ left: `${baseStart}%`, width: `${baseWidth}%` }}
                      ></div>
                      
                      {/* Actual/Forecast Bar Container */}
                      <div 
                        className={`absolute top-5 h-3 rounded-full overflow-hidden shadow-sm flex border ${
                          isCompleted ? 'border-emerald-500/30 bg-emerald-900/20' : 
                          isOverdue ? 'border-rose-500/30 bg-rose-900/20' : 
                          'border-indigo-500/30 bg-indigo-900/20'
                        }`}
                        style={{ left: `${actStart}%`, width: `${actWidth}%` }}
                      >
                        {/* Progress Fill */}
                        <div 
                          className={`h-full ${
                            isCompleted ? 'bg-emerald-500' : 
                            isOverdue ? 'bg-rose-500' : 
                            'bg-indigo-500'
                          }`}
                          style={{ width: `${stage.progressPercent}%` }}
                        ></div>
                        {/* Striped Forecast Fill (if not completed) */}
                        {stage.progressPercent < 100 && (
                          <div 
                            className="h-full flex-1 opacity-20"
                            style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, #ffffff 4px, #ffffff 8px)' }}
                          ></div>
                        )}
                      </div>
                      
                      {/* Variance Indicator (if completed early or late) */}
                      {isCompleted && stage.daysVariance !== 0 && (
                        <div 
                          className={`absolute top-4 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm ${
                            stage.daysVariance < 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                          style={{ left: `${actStart + actWidth}%`, transform: 'translateX(4px)' }}
                        >
                          {stage.daysVariance < 0 ? `-${Math.abs(stage.daysVariance)}d` : `+${stage.daysVariance}d`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* HEADER & DISTRIBUTOR SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Executive Control Centre</h1>
          <p className="text-slate-400 mt-1">Enterprise Audit Portfolio Management</p>
        </div>
        <div className="flex items-center gap-4">
          {onOpenNewAudit && (
            <button 
              onClick={onOpenNewAudit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Initiate New Audit
            </button>
          )}
          <div className="relative">
            <select 
              className="appearance-none bg-slate-900 border border-slate-700 text-white pl-4 pr-10 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg min-w-[240px]"
              value={selectedEngId || ''}
              onChange={(e) => setSelectedEngId(e.target.value || null)}
            >
              <option value="">Portfolio Overview</option>
              {engagements.map(eng => {
                const metrics = getEngagementMetrics(eng.id);
                return (
                  <option key={eng.id} value={eng.id}>
                    {eng.distributorName || eng.clientName} ({metrics.progress}%)
                  </option>
                );
              })}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {!selectedEngId ? (
        /* PORTFOLIO OVERVIEW */
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Briefcase className="h-16 w-16" />
              </div>
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Assignments</p>
              <h3 className="text-4xl font-bold text-white">{totalAssignments}</h3>
              <p className="text-slate-500 text-xs mt-3 flex items-center gap-1"><Activity className="h-3 w-3" /> Active portfolio</p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
              <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-2">In Progress</p>
              <h3 className="text-4xl font-bold text-white">{inProgressCount}</h3>
              <div className="mt-3 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${(inProgressCount/totalAssignments)*100}%` }}></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Pending Start</p>
              <h3 className="text-4xl font-bold text-white">{pendingCount}</h3>
              <p className="text-slate-500 text-xs mt-3 flex items-center gap-1"><Clock className="h-3 w-3" /> Awaiting kick-off</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">Completed</p>
              <h3 className="text-4xl font-bold text-white">{completedCount}</h3>
              <div className="mt-3 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(completedCount/totalAssignments)*100}%` }}></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-900/40 to-slate-900 border border-rose-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <p className="text-rose-400 text-sm font-semibold uppercase tracking-wider mb-2">Overdue</p>
              <h3 className="text-4xl font-bold text-white">{overdueCount}</h3>
              <p className="text-rose-500/70 text-xs mt-3 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Requires attention</p>
            </div>
          </div>

          {/* PORTFOLIO TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-400" /> Distributor Audit Portfolio
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search distributors..." 
                    className="bg-slate-950 border border-slate-800 text-sm text-white pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500 w-64 transition-colors"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
                  {['All', 'In Progress', 'Pending', 'Completed', 'Overdue'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Distributor</th>
                    <th className="p-4 font-semibold">Progress</th>
                    <th className="p-4 font-semibold">Lifecycle Status</th>
                    <th className="p-4 font-semibold">Baseline End</th>
                    <th className="p-4 font-semibold">Forecast End</th>
                    <th className="p-4 font-semibold">Variance</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredEngagements.map(eng => {
                    const metrics = getEngagementMetrics(eng.id);
                    const isOverdue = metrics.status === 'Overdue';
                    const isCompleted = metrics.status === 'Completed';
                    const isInProgress = metrics.status === 'In Progress' || metrics.status === 'Ready for Sign-off';
                    
                    return (
                      <tr key={eng.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="p-4">
                          <div className="font-bold text-white">{eng.distributorName || eng.clientName}</div>
                          <div className="text-xs text-slate-500 mt-1 font-mono">{eng.code}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-300 w-8">{metrics.progress}%</span>
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                style={{ width: `${metrics.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            isOverdue ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            isInProgress ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="h-3 w-3" /> :
                             isOverdue ? <AlertCircle className="h-3 w-3" /> :
                             isInProgress ? <Activity className="h-3 w-3" /> :
                             <Clock className="h-3 w-3" />}
                            {metrics.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-400">
                          {metrics.baselineCompletion ? new Date(metrics.baselineCompletion).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="p-4 text-sm text-slate-300 font-medium">
                          {metrics.forecastCompletion ? new Date(metrics.forecastCompletion).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="p-4">
                          {metrics.variance !== 0 ? (
                            <span className={`text-xs font-bold ${metrics.variance < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {metrics.variance < 0 ? `${Math.abs(metrics.variance)} days ahead` : `${metrics.variance} days delayed`}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">On track</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setSelectedEngId(eng.id)}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            Manage <ArrowRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEngagements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No distributors found matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* DETAILED DISTRIBUTOR VIEW */
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
          
          {/* DISTRIBUTOR HEADER */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{selectedEngagement?.distributorName || selectedEngagement?.clientName}</h2>
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-mono rounded border border-slate-700">{selectedEngagement?.code}</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-400">
                  <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Started: {new Date(selectedEngagement?.startDate || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="flex items-center gap-1.5"><UserCheck className="h-4 w-4" /> Lead: {selectedEngagement?.leadAuditor}</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedEngId(null)}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Back to Portfolio
                </button>
                <button 
                  onClick={() => selectedEngId && onSelectEngagement && onSelectEngagement(selectedEngId)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                >
                  <Briefcase className="h-4 w-4" /> Engagement Workspace
                </button>
              </div>
            </div>
            
            {/* KPI STRIP */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-8 pt-6 border-t border-slate-800/50">
              {(() => {
                const metrics = getEngagementMetrics(selectedEngId);
                return (
                  <>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Progress</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{metrics.progress}%</span>
                        <span className={`text-xs font-semibold ${metrics.status === 'Completed' ? 'text-emerald-400' : metrics.status === 'Overdue' ? 'text-rose-400' : 'text-indigo-400'}`}>
                          {metrics.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Forecast Completion</p>
                      <p className="text-lg font-bold text-white mt-1">
                        {metrics.forecastCompletion ? new Date(metrics.forecastCompletion).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Baseline</p>
                      <p className="text-lg font-medium text-slate-400 mt-1">
                        {metrics.baselineCompletion ? new Date(metrics.baselineCompletion).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Variance</p>
                      <p className={`text-lg font-bold mt-1 ${metrics.variance < 0 ? 'text-emerald-400' : metrics.variance > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {metrics.variance < 0 ? `${Math.abs(metrics.variance)}d early` : metrics.variance > 0 ? `${metrics.variance}d late` : 'On track'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Health</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${metrics.variance <= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <span className={`text-sm font-semibold ${metrics.variance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {metrics.variance < 0 ? 'Ahead' : metrics.variance > 0 ? 'Delayed' : 'On Track'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Items</p>
                      <p className={`text-lg font-bold mt-1 ${timelineStages.some(s => s.status === 'Overdue') ? 'text-rose-400' : 'text-slate-300'}`}>
                        {timelineStages.filter(s => s.status === 'Overdue').length}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN: TIMELINE (Spans 2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              {renderGanttTimeline()}
            </div>

            {/* RIGHT COLUMN: ATTENTION & ACTIVITY */}
            <div className="space-y-6">
              {/* ATTENTION REQUIRED */}
              <div className="bg-slate-900 border border-rose-500/20 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-rose-500" /> Attention Required
                </h3>
                
                <div className="space-y-3">
                  {timelineStages.filter(s => s.status === 'Overdue' || s.status === 'Due Soon' || s.progressPercent === 99).length === 0 ? (
                    <p className="text-sm text-slate-400 p-4 text-center bg-slate-950/50 rounded-lg border border-slate-800">
                      No actionable items requiring attention.
                    </p>
                  ) : (
                    timelineStages
                      .filter(s => s.status === 'Overdue' || s.status === 'Due Soon' || s.progressPercent === 99)
                      .map(stage => (
                        <div key={stage.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg group hover:border-rose-500/40 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-slate-200">{stage.name}</h4>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              stage.progressPercent === 99 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                              stage.status === 'Overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {stage.progressPercent === 99 ? 'Ready for Sign-off' : stage.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-3">
                            {stage.progressPercent === 99 ? 'Review and sign-off required.' : `${stage.responsibleParty} · ${Math.abs(stage.daysVariance)} days ${stage.daysVariance > 0 ? 'delayed' : 'remaining'}`}
                          </p>
                          <button className="text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors">
                            {stage.progressPercent === 99 ? 'Review' : 'Open'}
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* TIMELINE ACTIVITY LOG */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                  <Clock4 className="h-5 w-5 text-indigo-400" /> Timeline Activity
                </h3>
                <div className="space-y-4">
                  {/* Mocking activity log mapping to real stages for demonstration as requested */}
                  {[...timelineStages].reverse().filter(s => s.actualStartDate).slice(0,5).map(stage => (
                    <div key={`log-${stage.id}`} className="flex gap-3">
                      <div className="mt-0.5 relative">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-slate-900"></div>
                        <div className="absolute top-2 bottom-[-16px] left-[3px] w-px bg-slate-800"></div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-300">
                          {stage.progressPercent === 100 ? `${stage.name} completed` : `${stage.name} started`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(stage.actualEndDate || stage.actualStartDate!).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-800 rounded">
                            {stage.responsibleParty}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full text-center text-xs font-medium text-indigo-400 hover:text-indigo-300 py-2 transition-colors">
                    View Full Audit Trail
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE DETAIL POPOVER */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedStage(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-lg font-bold text-white">{selectedStage.name}</h3>
              <button onClick={() => setSelectedStage(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Responsible Party</span>
                <span className="text-sm font-semibold text-white">{selectedStage.responsibleParty}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Status</span>
                <span className={`text-xs uppercase font-bold px-2 py-1 rounded ${
                  selectedStage.status === 'Completed' || selectedStage.status === 'Completed Early' ? 'bg-emerald-500/20 text-emerald-400' :
                  selectedStage.status === 'Overdue' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {selectedStage.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Progress</span>
                <span className="text-sm font-bold text-white">{selectedStage.progressPercent}%</span>
              </div>
              
              <div className="h-px w-full bg-slate-800 my-4"></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Baseline Plan</span>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>Start: {new Date(selectedStage.baselineStartDate).toLocaleDateString()}</p>
                    <p>End: {new Date(selectedStage.baselineEndDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Current Forecast</span>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>Start: {selectedStage.forecastStartDate ? new Date(selectedStage.forecastStartDate).toLocaleDateString() : '-'}</p>
                    <p className={selectedStage.daysVariance > 0 ? 'text-rose-400 font-medium' : ''}>
                      End: {selectedStage.forecastEndDate ? new Date(selectedStage.forecastEndDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="h-px w-full bg-slate-800 my-4"></div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Variance</span>
                <span className={`text-sm font-bold ${selectedStage.daysVariance < 0 ? 'text-emerald-400' : selectedStage.daysVariance > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {selectedStage.daysVariance < 0 ? `${Math.abs(selectedStage.daysVariance)} days early` : 
                   selectedStage.daysVariance > 0 ? `${selectedStage.daysVariance} days delayed` : 'On schedule'}
                </span>
              </div>
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setSelectedStage(null)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Close
              </button>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded transition-colors shadow-lg shadow-indigo-500/20">
                Open Module
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
