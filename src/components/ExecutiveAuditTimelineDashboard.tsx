import React, { useState } from 'react';
import { 
  Users, PlayCircle, Hourglass, CheckCircle2, AlertTriangle, Search, Briefcase, Plus, Calendar, Clock, ExternalLink,
  TrendingUp, ChevronRight, ListTodo, BarChart3, FileText
} from 'lucide-react';
import { UserSession } from '../types';

interface ExecutiveAuditTimelineDashboardProps {
  engagements: any[];
  currentUser: UserSession | null;
  onOpenNewAudit?: () => void;
  onTabChange?: (tab: string) => void;
  onSelectEngagement?: (id: string) => void;
}

export const ExecutiveAuditTimelineDashboard: React.FC<ExecutiveAuditTimelineDashboardProps> = ({ 
  onOpenNewAudit, onTabChange, onSelectEngagement
}) => {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-[#0B1120] text-slate-300">
      
      {/* 1. HERO SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-wider text-indigo-400 bg-indigo-900/30 border border-indigo-500/20 px-2 py-1 rounded-full uppercase inline-block mb-3">
            Distributor Monitoring Platform (DMP) Executive Control Hub
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Enterprise Executive Audit Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Complete visibility across all distributor audits</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onTabChange && onTabChange('engagement_workspace')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg"
          >
            <Briefcase className="h-4 w-4" /> Engagement Workspace
          </button>
          <button 
            onClick={onOpenNewAudit}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg"
          >
            <Plus className="h-4 w-4" /> Initiate New Audit
          </button>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4 group hover:border-slate-700 transition-colors">
          <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Total Assignments</p>
            <h3 className="text-2xl font-bold text-white leading-none mb-1">12</h3>
            <p className="text-[10px] text-slate-500">All distributor audits</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4 group hover:border-slate-700 transition-colors">
          <div className="h-12 w-12 rounded-full bg-indigo-900/30 flex items-center justify-center shrink-0">
            <PlayCircle className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">In Progress</p>
            <h3 className="text-2xl font-bold text-white leading-none mb-1">8</h3>
            <p className="text-[10px] text-slate-500">67% of total</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4 group hover:border-slate-700 transition-colors">
          <div className="h-12 w-12 rounded-full bg-amber-900/30 flex items-center justify-center shrink-0">
            <Hourglass className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Pending to Start</p>
            <h3 className="text-2xl font-bold text-white leading-none mb-1">2</h3>
            <p className="text-[10px] text-slate-500">17% of total</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4 group hover:border-slate-700 transition-colors">
          <div className="h-12 w-12 rounded-full bg-emerald-900/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Completed</p>
            <h3 className="text-2xl font-bold text-white leading-none mb-1">2</h3>
            <p className="text-[10px] text-slate-500">17% of total</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4 group hover:border-slate-700 transition-colors relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <div className="h-12 w-12 rounded-full bg-rose-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Overdue</p>
            <h3 className="text-2xl font-bold text-white leading-none mb-1">3</h3>
            <p className="text-[10px] text-rose-400">Requires attention</p>
          </div>
        </div>
      </div>

      {/* 3. DISTRIBUTOR AUDITS OVERVIEW */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Distributor Audits Overview</h2>
            <p className="text-sm text-slate-400">Select a distributor to view detailed audit status and timeline</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search distributors..." 
                className="bg-slate-950 border border-slate-800 text-sm text-white pl-9 pr-4 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 w-64 transition-colors"
              />
            </div>
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
              <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-indigo-600 text-white">All (12)</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-slate-400 hover:text-white hover:bg-slate-800">In Progress (8)</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-slate-400 hover:text-white hover:bg-slate-800">Pending (2)</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-slate-400 hover:text-white hover:bg-slate-800">Completed (2)</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-slate-400 hover:text-white hover:bg-slate-800">Overdue (3)</button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-800/50 text-sm">
              <tr className="bg-indigo-900/10 hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-white">Midwest Trading Co.</td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">AUD-2026-DIST-001</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white w-8">72%</span>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">In Progress</span>
                </td>
                <td className="px-6 py-4 text-slate-300">17 Dec 2026</td>
                <td className="px-6 py-4 text-slate-300">12 Dec 2026</td>
                <td className="px-6 py-4 text-emerald-400 font-medium">5 days ahead</td>
                <td className="px-6 py-4 text-right">
                  <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold transition-colors">View</button>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-200">Apex Electronics Corp.</td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">AUD-2026-DIST-002</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-200 w-8">41%</span>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: '41%' }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border bg-rose-500/10 text-rose-400 border-rose-500/20">Overdue</span>
                </td>
                <td className="px-6 py-4 text-slate-300">20 Dec 2026</td>
                <td className="px-6 py-4 text-slate-300">26 Dec 2026</td>
                <td className="px-6 py-4 text-rose-400 font-medium">6 days delayed</td>
                <td className="px-6 py-4 text-right">
                  <button className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold border border-slate-700 transition-colors">View</button>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-200">Global Retail Ltd.</td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">AUD-2026-DIST-003</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-200 w-8">18%</span>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full" style={{ width: '18%' }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">In Progress</span>
                </td>
                <td className="px-6 py-4 text-slate-300">22 Dec 2026</td>
                <td className="px-6 py-4 text-slate-300">24 Dec 2026</td>
                <td className="px-6 py-4 text-rose-400 font-medium">2 days delayed</td>
                <td className="px-6 py-4 text-right">
                  <button className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold border border-slate-700 transition-colors">View</button>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-200">Sunrise Distributors</td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">AUD-2026-DIST-004</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-200 w-8">0%</span>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-600 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border bg-slate-800 text-slate-400 border-slate-700">Pending</span>
                </td>
                <td className="px-6 py-4 text-slate-300">24 Dec 2026</td>
                <td className="px-6 py-4 text-slate-300">24 Dec 2026</td>
                <td className="px-6 py-4 text-slate-500 font-medium">-</td>
                <td className="px-6 py-4 text-right">
                  <button className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold border border-slate-700 transition-colors">View</button>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-200">Trident Supplies</td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">AUD-2026-DIST-005</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-200 w-8">100%</span>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Completed</span>
                </td>
                <td className="px-6 py-4 text-slate-300">10 Dec 2026</td>
                <td className="px-6 py-4 text-slate-300">10 Dec 2026</td>
                <td className="px-6 py-4 text-emerald-400 font-medium">Completed</td>
                <td className="px-6 py-4 text-right">
                  <button className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold border border-slate-700 transition-colors">View</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. SELECTED AUDIT PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white">Midwest Trading Co.</h2>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">In Progress</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="font-mono">AUD-2026-DIST-001</span>
              <span>|</span>
              <span>Started: 15 Sep 2026</span>
            </div>
          </div>
          <button 
            onClick={() => onSelectEngagement && onSelectEngagement('AUD-2026-DIST-001')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-300 hover:text-indigo-200 border border-indigo-700/50 rounded-lg text-sm font-semibold transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Open in Workspace
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-6 border-b border-slate-800 mb-6">
          {['Overview', 'Timeline', 'Documents', 'Activity Log'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full border-4 border-slate-800 border-t-emerald-400 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white">72%</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Overall Progress</p>
                <p className="text-xs text-emerald-400 mt-1 font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> On track
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">12 Dec 2026</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Forecast Completion</p>
              <p className="text-xs text-emerald-400 font-medium mt-0.5">5 days ahead</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">17 Dec 2026</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Baseline Completion</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">8 days</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Remaining</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3 justify-between group cursor-pointer hover:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">3</p>
                <p className="text-[11px] text-rose-400 mt-0.5">Overdue Items</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />
          </div>
        </div>

        {/* TIMELINE */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Audit Timeline (12 Weeks)</h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500/40 rounded-full"></div><span className="text-slate-400">Baseline Plan</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div><span className="text-slate-400">Actual Progress</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-400 rounded-full"></div><span className="text-slate-400">Current Forecast</span></div>
              </div>
              <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
                <button className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold">Weeks</button>
                <button className="px-3 py-1 text-slate-400 hover:text-white rounded text-xs font-semibold">Calendar</button>
              </div>
            </div>
          </div>

          {/* Timeline Grid */}
          <div className="relative overflow-x-auto pb-4">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="flex w-full mb-4 relative ml-48">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex-1 text-[10px] font-semibold text-slate-500 tracking-wider">
                    Week {i + 1}
                  </div>
                ))}
              </div>

              {/* Grid Lines */}
              <div className="absolute top-8 bottom-0 left-48 right-0 flex pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex-1 border-l border-slate-800/50"></div>
                ))}
                <div className="border-l border-slate-800/50"></div>
              </div>

              {/* Rows */}
              <div className="space-y-4">
                
                {/* IRL & Kick-off */}
                <div className="flex items-center h-8">
                  <div className="w-48 shrink-0 flex items-center gap-2 text-sm font-medium text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> IRL & Kick-off
                  </div>
                  <div className="flex-1 relative h-full flex items-center">
                    <div className="absolute h-3 rounded-full border border-emerald-500/40 bg-indigo-500/20" style={{ left: '0%', width: '16.66%' }}>
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Data Collection & Interview */}
                <div className="flex items-center h-8">
                  <div className="w-48 shrink-0 flex items-center gap-2 text-sm font-medium text-slate-200">
                    <div className="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center shrink-0">
                      <ListTodo className="h-3 w-3 text-white" />
                    </div>
                    Data Collection & Interview
                  </div>
                  <div className="flex-1 relative h-full flex items-center">
                    <div className="absolute h-3 rounded-full border border-indigo-500/40 bg-indigo-500/20" style={{ left: '8.33%', width: '33.33%' }}>
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Data Analytics */}
                <div className="flex items-center h-8">
                  <div className="w-48 shrink-0 flex items-center gap-2 text-sm font-medium text-slate-200">
                    <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center shrink-0">
                      <BarChart3 className="h-3 w-3 text-white" />
                    </div>
                    Data Analytics
                  </div>
                  <div className="flex-1 relative h-full flex items-center">
                    <div className="absolute h-3 rounded-full border border-slate-700 border-dashed bg-indigo-500/20" style={{ left: '33.33%', width: '25%' }}>
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Supporting Documents */}
                <div className="flex items-center h-8">
                  <div className="w-48 shrink-0 flex items-center gap-2 text-sm font-medium text-slate-200">
                    <div className="w-4 h-4 rounded bg-orange-500 flex items-center justify-center shrink-0">
                      <FileText className="h-3 w-3 text-white" />
                    </div>
                    Supporting Documents
                  </div>
                  <div className="flex-1 relative h-full flex items-center">
                    <div className="absolute h-3 rounded-full border border-slate-700 border-dashed bg-indigo-500/20" style={{ left: '50%', width: '25%' }}>
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Transaction Testing */}
                <div className="flex items-center h-8">
                  <div className="w-48 shrink-0 flex items-center gap-2 text-sm font-medium text-slate-200">
                    <div className="w-4 h-4 rounded bg-cyan-500 flex items-center justify-center shrink-0">
                      <Search className="h-3 w-3 text-white" />
                    </div>
                    Transaction Testing
                  </div>
                  <div className="flex-1 relative h-full flex items-center">
                    <div className="absolute h-3 rounded-full border border-slate-700 border-dashed bg-indigo-500/20" style={{ left: '50%', width: '33.33%' }}>
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Interview & Reporting */}
                <div className="flex items-center h-8">
                  <div className="w-48 shrink-0 flex items-center gap-2 text-sm font-medium text-slate-200">
                    <div className="w-4 h-4 rounded bg-rose-500 flex items-center justify-center shrink-0">
                      <FileText className="h-3 w-3 text-white" />
                    </div>
                    Interview & Reporting
                  </div>
                  <div className="flex-1 relative h-full flex items-center">
                    <div className="absolute h-3 rounded-full border border-rose-500/40 border-dashed bg-indigo-500/20" style={{ left: '83.33%', width: '16.66%' }}>
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
