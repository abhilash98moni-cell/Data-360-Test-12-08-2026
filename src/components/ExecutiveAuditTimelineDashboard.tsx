import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle2, ChevronRight, Clock, Search, ListTodo, AlertCircle, 
  ArrowRight, Activity, GitCommit, FileText, CheckSquare, Presentation, ShieldAlert,
  Users, UserCheck, Check, SearchIcon, FileSpreadsheet, Hourglass, Plus
} from 'lucide-react';
import { AuditEngagement, UserSession } from '../types';

interface ExecutiveAuditTimelineDashboardProps {
  engagements: AuditEngagement[];
  currentUser: UserSession | null;
}

export const ExecutiveAuditTimelineDashboard: React.FC<ExecutiveAuditTimelineDashboardProps> = ({ 
  engagements, currentUser 
}) => {
  const [selectedEngId, setSelectedEngId] = useState<string | null>(null);
  const [allTimelines, setAllTimelines] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

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
    const completedStages = stages.filter(s => s.progressPercent === 100).length;
    const progress = stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0;
    const variance = stages.reduce((acc, stg) => acc + (stg.daysVariance || 0), 0);
    const hasOverdue = stages.some(s => s.status === 'Overdue');
    const hasStarted = stages.some(s => s.actualStartDate);
    const isCompleted = completedStages === stages.length && stages.length > 0;
    
    let status = 'Pending';
    if (isCompleted) status = 'Completed';
    else if (hasOverdue) status = 'Overdue';
    else if (hasStarted) status = 'In Progress';

    const lastStage = stages[stages.length - 1];
    const forecastCompletion = lastStage ? lastStage.forecastEndDate : null;
    const baselineCompletion = lastStage ? lastStage.baselineEndDate : null;

    return { progress, variance, status, forecastCompletion, baselineCompletion, stages };
  };

  const metricsData = engagements.map(eng => ({
    eng,
    ...getEngagementMetrics(eng.id)
  }));

  const totalAssignments = engagements.length;
  const inProgress = metricsData.filter(m => m.status === 'In Progress').length;
  const pendingStart = metricsData.filter(m => m.status === 'Pending').length;
  const completed = metricsData.filter(m => m.status === 'Completed').length;
  const overdue = metricsData.filter(m => m.status === 'Overdue').length;

  const filteredMetrics = metricsData.filter(m => {
    if (filter !== 'All') {
      if (filter === 'In Progress' && m.status !== 'In Progress') return false;
      if (filter === 'Pending' && m.status !== 'Pending') return false;
      if (filter === 'Completed' && m.status !== 'Completed') return false;
      if (filter === 'Overdue' && m.status !== 'Overdue') return false;
    }
    if (search && !(m.eng.distributorName || m.eng.clientName).toLowerCase().includes(search.toLowerCase()) && !m.eng.code.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wide">
            Enterprise Executive Audit Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">Complete visibility across all distributor audits</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors">
            <UserCheck className="h-4 w-4" />
            <span>Engagement Workspace</span>
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="h-4 w-4" />
            <span>Initiate New Audit</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-slate-800 rounded-lg text-slate-300">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Total Assignments</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-white">{totalAssignments}</span>
            <p className="text-[11px] text-slate-500 mt-1">All distributor audits</p>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400">In Progress</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-white">{inProgress}</span>
            <p className="text-[11px] text-slate-500 mt-1">{totalAssignments > 0 ? Math.round(inProgress/totalAssignments*100) : 0}% of total</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Hourglass className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Pending to Start</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-white">{pendingStart}</span>
            <p className="text-[11px] text-slate-500 mt-1">{totalAssignments > 0 ? Math.round(pendingStart/totalAssignments*100) : 0}% of total</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Completed</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-white">{completed}</span>
            <p className="text-[11px] text-slate-500 mt-1">{totalAssignments > 0 ? Math.round(completed/totalAssignments*100) : 0}% of total</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <AlertCircle className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Overdue</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-white">{overdue}</span>
            <p className="text-[11px] text-slate-500 mt-1">Require attention</p>
          </div>
        </div>
      </div>

      {/* Distributor Audits Overview Table */}
      {!selectedEngagement && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Distributor Audits Overview</h2>
              <p className="text-xs text-slate-400">Select a distributor to view detailed audit status and timeline</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search distributors..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 text-sm text-white rounded-lg focus:outline-none focus:border-indigo-500 w-full sm:w-64"
                />
              </div>
              <div className="flex bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                {['All', 'In Progress', 'Pending', 'Completed', 'Overdue'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 text-xs font-semibold transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
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
                <tr className="bg-slate-950 border-b border-slate-800">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Distributor Name</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Engagement ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Overall Progress</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Baseline Completion</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Forecast Completion</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Variance</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMetrics.map(({eng, progress, status, baselineCompletion, forecastCompletion, variance}) => (
                  <tr key={eng.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-200">{eng.distributorName || eng.clientName}</td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-400">{eng.code}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-300 w-8">{progress}%</span>
                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{width: `${progress}%`}}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded border ${
                        status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        status === 'Overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{baselineCompletion ? new Date(baselineCompletion).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-4 text-xs text-slate-400">{forecastCompletion ? new Date(forecastCompletion).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-4 text-xs font-medium">
                      {variance < 0 ? <span className="text-rose-400">{Math.abs(variance)} days delayed</span> :
                       variance > 0 ? <span className="text-emerald-400">{variance} days ahead</span> :
                       <span className="text-slate-500">-</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => setSelectedEngId(eng.id)}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMetrics.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-500 text-sm">
                      No distributor audits found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Distributor Detail */}
      {selectedEngagement && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-extrabold text-white">{selectedEngagement.clientName}</h2>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold uppercase">
                  {getEngagementMetrics(selectedEngagement.id).status}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 font-mono">
                {selectedEngagement.code} <span className="text-slate-600">|</span> Started: {new Date(selectedEngagement.startDate).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <select 
                value={selectedEngId || ''} 
                onChange={(e) => setSelectedEngId(e.target.value === '' ? null : e.target.value)}
                className="w-full sm:w-auto bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">← Back to Portfolio Overview</option>
                <optgroup label="Distributor Audits">
                  {engagements.map(eng => (
                    <option key={eng.id} value={eng.id}>{eng.distributorName || eng.clientName}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex gap-6">
              <button className="text-sm font-semibold text-indigo-400 border-b-2 border-indigo-400 pb-2 -mb-[9px]">Overview</button>
              <button className="text-sm font-semibold text-slate-400 hover:text-slate-200 pb-2">Timeline</button>
              <button className="text-sm font-semibold text-slate-400 hover:text-slate-200 pb-2">Documents</button>
              <button className="text-sm font-semibold text-slate-400 hover:text-slate-200 pb-2">Activity Log</button>
            </div>
            <button className="flex items-center gap-2 text-xs font-semibold text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors">
              Open in Workspace <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-center items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Overall Progress</span>
              <div className="relative">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="226.19" strokeDashoffset={226.19 - (226.19 * getEngagementMetrics(selectedEngagement.id).progress) / 100} className="text-indigo-500 transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{getEngagementMetrics(selectedEngagement.id).progress}%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Forecast Completion</span>
                <Calendar className="h-4 w-4 text-blue-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-white">
                  {getEngagementMetrics(selectedEngagement.id).forecastCompletion ? new Date(getEngagementMetrics(selectedEngagement.id).forecastCompletion!).toLocaleDateString() : '-'}
                </span>
                <p className={`text-xs mt-1 font-semibold ${getEngagementMetrics(selectedEngagement.id).variance < 0 ? 'text-rose-400' : getEngagementMetrics(selectedEngagement.id).variance > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {getEngagementMetrics(selectedEngagement.id).variance < 0 ? `${Math.abs(getEngagementMetrics(selectedEngagement.id).variance)} days delayed` : 
                   getEngagementMetrics(selectedEngagement.id).variance > 0 ? `${getEngagementMetrics(selectedEngagement.id).variance} days ahead` : '-'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Baseline Completion</span>
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-300">
                  {getEngagementMetrics(selectedEngagement.id).baselineCompletion ? new Date(getEngagementMetrics(selectedEngagement.id).baselineCompletion!).toLocaleDateString() : '-'}
                </span>
                <p className="text-xs mt-1 text-slate-500">Original target</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Days Remaining</span>
                <Clock className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-white">
                  {getEngagementMetrics(selectedEngagement.id).forecastCompletion ? Math.max(0, Math.round((new Date(getEngagementMetrics(selectedEngagement.id).forecastCompletion!).getTime() - Date.now()) / (1000 * 3600 * 24))) : '-'}
                </span>
                <p className="text-xs mt-1 text-slate-500">Until forecast completion</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between cursor-pointer hover:border-rose-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-rose-400 transition-colors">Overdue Items</span>
                <AlertCircle className="h-4 w-4 text-rose-400" />
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold text-rose-400">
                    {timelineStages.filter(s => s.status === 'Overdue').length}
                  </span>
                  <p className="text-xs mt-1 text-rose-500/70">Require attention</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-rose-400 transition-colors" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-6">Audit Timeline (12 Weeks)</h2>
            
            {loading ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center animate-pulse">
                <Activity className="h-8 w-8 mb-4 text-indigo-500" />
                <p>Loading timeline...</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 pb-4">
                {timelineStages.map((stage, idx) => (
                  <div key={stage.id} className="relative pl-8">
                    {/* Timeline Node */}
                    <div className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-slate-900 flex items-center justify-center ${
                      stage.progressPercent === 100 ? 'bg-emerald-500' :
                      stage.status === 'In Progress' ? 'bg-indigo-500' :
                      stage.status === 'Overdue' ? 'bg-rose-500' : 'bg-slate-600'
                    }`}>
                      {stage.progressPercent === 100 && <CheckCircle2 className="h-3 w-3 text-white absolute" />}
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          {idx + 1}. {stage.name}
                          {stage.status === 'Overdue' && <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[10px] uppercase font-bold rounded border border-rose-500/20">Overdue ({Math.abs(stage.daysVariance)} days)</span>}
                          {stage.status === 'Completed Early' && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold rounded border border-emerald-500/20">Completed {Math.abs(stage.daysVariance)} days early</span>}
                          {stage.progressPercent === 100 && stage.status !== 'Completed Early' && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold rounded border border-emerald-500/20">Completed</span>}
                          {stage.progressPercent === 99 && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold rounded border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors">Ready for Sign-off</span>}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Responsible: <strong className="text-slate-300">{stage.responsibleParty}</strong></p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono text-slate-400">Baseline: {new Date(stage.baselineStartDate).toLocaleDateString()} - {new Date(stage.baselineEndDate).toLocaleDateString()}</div>
                        <div className={`text-xs font-mono font-bold mt-1 ${
                          stage.daysVariance < 0 ? 'text-rose-400' : stage.daysVariance > 0 ? 'text-emerald-400' : 'text-indigo-400'
                        }`}>
                          Forecast: {new Date(stage.forecastStartDate).toLocaleDateString()} - {new Date(stage.forecastEndDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-3 flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          stage.progressPercent === 100 ? 'bg-emerald-500' :
                          stage.status === 'Overdue' ? 'bg-rose-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${stage.progressPercent}%` }}
                      />
                    </div>
                    
                    <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                      <GitCommit className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        {stage.actualStartDate ? (
                          <p>Work commenced on <span className="text-slate-300">{new Date(stage.actualStartDate).toLocaleDateString()}</span>.</p>
                        ) : (
                          <p>Work not yet started.</p>
                        )}
                        {stage.actualEndDate && (
                          <p className="text-emerald-400 mt-1">Completed on {new Date(stage.actualEndDate).toLocaleDateString()}.</p>
                        )}
                        {stage.daysVariance !== 0 && (
                          <p className="mt-1">
                            Impact: {stage.daysVariance > 0 ? 'Saved' : 'Delayed by'} {Math.abs(stage.daysVariance)} days relative to baseline.
                          </p>
                        )}
                        {stage.progressPercent === 99 && (
                          <button className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition-colors">
                            Sign-off Stage
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
