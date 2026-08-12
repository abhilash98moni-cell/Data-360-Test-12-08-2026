import React, { useState } from 'react';
import { AuditFinding } from '../types';
import { 
  ShieldAlert, 
  DollarSign, 
  CheckSquare, 
  Clock, 
  UserCheck, 
  AlertCircle, 
  Building, 
  FileText, 
  Search, 
  CheckCircle2,
  Filter
} from 'lucide-react';

import { formatCurrency, CurrencyMode } from '../utils/currencyFormatter';

import { UserSession } from './AuthModal';

interface FindingsCAPAViewProps {
  findings: AuditFinding[];
  onUpdateFindingStatus: (id: string, newStatus: any) => void;
  currencyMode?: CurrencyMode;
  currentUser?: UserSession | null;
}

export const FindingsCAPAView: React.FC<FindingsCAPAViewProps> = ({
  findings,
  onUpdateFindingStatus,
  currencyMode: activeCurrencyMode = 'INR',
  currentUser
}) => {
  const currencyMode: CurrencyMode = activeCurrencyMode as CurrencyMode;
  const isDistributor = currentUser?.role === 'Distributor';
  const distOrg = currentUser?.organization || '';

  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filtered = findings.filter((f) => {
    // If distributor role, restrict strictly to findings matching their entity
    if (isDistributor && distOrg) {
      const matchesOrg = f.auditedEntity.toLowerCase().includes(distOrg.toLowerCase()) ||
                         f.assignedTo.toLowerCase().includes(distOrg.toLowerCase());
      if (!matchesOrg) return false;
    }

    const matchesSev = selectedSeverity === 'All' || f.severity === selectedSeverity;
    const matchesStat = selectedStatus === 'All' || f.status === selectedStatus;
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.auditedEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.findingCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSev && matchesStat && matchesSearch;
  });

  const totalFinancialImpact = filtered.reduce((sum, f) => sum + f.financialImpact, 0);

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 text-slate-200">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
              Observation & CAPA Portal
            </span>
            <span className="text-xs text-slate-400">Client Remediation & Recovery Tracker</span>
          </div>
          <h1 className="text-xl font-extrabold text-white mt-1">Audit Findings & Corrective Action Plans</h1>
          <p className="text-xs text-slate-400">Manage financial clawbacks, root cause analyses, auditee responses, and partner sign-offs.</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-right">
          <p className="text-[10px] uppercase text-slate-400 font-medium">Filtered Exposure Total</p>
          <p className="text-xl font-extrabold font-mono text-emerald-400">{formatCurrency(totalFinancialImpact, currencyMode)}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search finding code, entity, or title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Severity & Status Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Severity:</label>
            <select 
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Status:</label>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Review">Under Review</option>
              <option value="CAPA Assigned">CAPA Assigned</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

      </div>

      {/* Findings Cards Grid */}
      <div className="space-y-4">
        {filtered.map((fnd) => (
          <div 
            key={fnd.id} 
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
                  fnd.severity === 'Critical' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                  fnd.severity === 'High' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}>
                  {fnd.severity}
                </span>
                <span className="font-mono text-xs text-indigo-400 font-bold">{fnd.findingCode}</span>
                <span className="text-xs text-slate-400">&bull; {fnd.engagementTitle}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block">Financial Leakage</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-base">{formatCurrency(fnd.financialImpact, currencyMode)}</span>
                </div>
                
                {/* Status Toggle Selector */}
                <select 
                  value={fnd.status}
                  onChange={(e) => onUpdateFindingStatus(fnd.id, e.target.value)}
                  className="bg-slate-950 text-slate-200 text-xs font-semibold border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="Open">Status: Open</option>
                  <option value="Under Review">Status: Under Review</option>
                  <option value="CAPA Assigned">Status: CAPA Assigned</option>
                  <option value="Resolved">Status: Resolved</option>
                </select>
              </div>
            </div>

            {/* Title & Audited Entity */}
            <div>
              <h3 className="text-base font-bold text-white">{fnd.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Audited Entity / Partner: <span className="text-slate-200 font-medium">{fnd.auditedEntity}</span></p>
            </div>

            {/* Root Cause & Recommendation Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg space-y-1">
                <span className="font-bold text-amber-400 block">Root Cause Analysis</span>
                <p className="text-slate-300 leading-relaxed">{fnd.rootCause}</p>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg space-y-1">
                <span className="font-bold text-indigo-400 block">Audit Team Recommendation</span>
                <p className="text-slate-300 leading-relaxed">{fnd.recommendation}</p>
              </div>
            </div>

            {/* Assignee & SLA Footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-indigo-400" />
                <span>Assigned CAPA Owner: <span className="text-slate-200 font-semibold">{fnd.assignedTo}</span></span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>SLA Due Date: <span className="font-mono font-bold">{fnd.dueDate}</span></span>
                </div>
                <span className="text-slate-500 font-mono">Evidence Vault: {fnd.evidenceFilesCount} Files Attached</span>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
