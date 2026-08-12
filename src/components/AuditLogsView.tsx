import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  ShieldCheck, 
  Clock, 
  User, 
  Globe, 
  Monitor, 
  KeyRound, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  FileText,
  Lock,
  RefreshCw
} from 'lucide-react';
import { SystemAuditLog, UserSession } from '../types';

interface AuditLogsViewProps {
  currentUser: UserSession | null;
}

const INITIAL_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: 'log-101',
    timestamp: '2026-08-01 10:45:12',
    userName: 'Sarah Jenkins',
    userEmail: 's.jenkins@apex-audit.com',
    userRole: 'AA Super Admin',
    organization: 'Apex Audit Practice (AA)',
    action: 'Login',
    ipAddress: '192.168.1.104',
    browser: 'Chrome 127.0',
    device: 'MacBook Pro (macOS 15)',
    details: 'User authenticated successfully via Supabase Auth JWT token'
  },
  {
    id: 'log-102',
    timestamp: '2026-08-01 10:12:05',
    userName: 'David Vance',
    userEmail: 'd.vance@midwesttrading.com',
    userRole: 'Distributor Admin',
    organization: 'Midwest Trading Co.',
    action: 'Upload',
    ipAddress: '172.56.21.90',
    browser: 'Edge 126.0',
    device: 'Windows 11 Enterprise',
    details: 'Uploaded file Sales_Register_Q1_Q2_Full.xlsx (18.2 MB) for Ref #2.1'
  },
  {
    id: 'log-103',
    timestamp: '2026-08-01 09:30:44',
    userName: 'Sarah Jenkins',
    userEmail: 's.jenkins@apex-audit.com',
    userRole: 'AA Super Admin',
    organization: 'Apex Audit Practice (AA)',
    action: 'Invitation',
    ipAddress: '192.168.1.104',
    browser: 'Chrome 127.0',
    device: 'MacBook Pro (macOS 15)',
    details: 'Dispatched enterprise invitation link to Karan Patel (k.patel@horizonlogistics.in)'
  },
  {
    id: 'log-104',
    timestamp: '2026-07-31 16:20:11',
    userName: 'Elena Rostova',
    userEmail: 'e.rostova@apex-audit.com',
    userRole: 'Auditor',
    organization: 'Apex Audit Practice (AA)',
    action: 'Submission',
    ipAddress: '198.51.100.42',
    browser: 'Firefox 128.0',
    device: 'Linux Workstation',
    details: 'Review decision updated to Rejected for GST_Return_Q4_Horizon.pdf'
  },
  {
    id: 'log-105',
    timestamp: '2026-07-31 14:05:00',
    userName: 'Marcus Thorne',
    userEmail: 'm.thorne@apex-electronics.com',
    userRole: 'Client Super Admin',
    organization: 'Apex Electronics Corp',
    action: 'Download',
    ipAddress: '203.0.113.15',
    browser: 'Safari 17.5',
    device: 'iPad Pro',
    details: 'Downloaded Executive Audit Report summary PDF for Audit AUD-2026-001'
  },
  {
    id: 'log-106',
    timestamp: '2026-07-30 11:15:33',
    userName: 'David Vance',
    userEmail: 'd.vance@midwesttrading.com',
    userRole: 'Distributor Admin',
    organization: 'Midwest Trading Co.',
    action: 'Delete',
    ipAddress: '172.56.21.90',
    browser: 'Edge 126.0',
    device: 'Windows 11 Enterprise',
    details: 'Deleted draft file Draft_License_Old.pdf before final submission'
  },
  {
    id: 'log-107',
    timestamp: '2026-07-30 08:45:00',
    userName: 'Sarah Jenkins',
    userEmail: 's.jenkins@apex-audit.com',
    userRole: 'AA Super Admin',
    organization: 'Apex Audit Practice (AA)',
    action: 'Role Change',
    ipAddress: '192.168.1.104',
    browser: 'Chrome 127.0',
    device: 'MacBook Pro (macOS 15)',
    details: 'Elevated user Elena Rostova from Auditor to Lead Reviewer'
  }
];

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<SystemAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesAction = selectedActionFilter === 'ALL' || log.action === selectedActionFilter;
    const matchesSearch = log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.ipAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const handleExportLogs = () => {
    const headers = 'ID,Timestamp,User,Email,Role,Organization,Action,IP,Browser,Details\n';
    const rows = filteredLogs.map(l => 
      `"${l.id}","${l.timestamp}","${l.userName}","${l.userEmail}","${l.userRole}","${l.organization}","${l.action}","${l.ipAddress}","${l.browser}","${l.details.replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data360_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 text-slate-100 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Immutable Governance Trail
            </span>
            <span className="text-xs text-slate-400">• Step 12 Compliance & Security Logs</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Database className="h-6 w-6 text-indigo-400" />
            <span>Platform Security Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Detailed immutable log capturing every user login, file upload, download, deletion, role modification, and invitation dispatch with client IP, browser metadata, and timestamps.
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV Audit Log</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by user, IP address, or event details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-400 font-medium">Filter Action Type:</span>
          <select
            value={selectedActionFilter}
            onChange={(e) => setSelectedActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Event Actions (9 Types)</option>
            <option value="Login">Login Events</option>
            <option value="Logout">Logout Events</option>
            <option value="Upload">File Uploads</option>
            <option value="Download">File Downloads</option>
            <option value="Delete">File Deletions</option>
            <option value="Submission">IRL Submissions</option>
            <option value="Role Change">Role Changes</option>
            <option value="Invitation">Invitations</option>
            <option value="Password Reset">Password Resets</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Client IP & Environment</th>
                <th className="py-3 px-4">Event Activity Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 text-indigo-300 font-bold whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{log.timestamp}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-sans">
                    <p className="font-bold text-slate-100">{log.userName}</p>
                    <p className="text-[10px] text-slate-400">{log.userRole}</p>
                  </td>

                  <td className="py-3.5 px-4 font-sans text-slate-300">
                    {log.organization}
                  </td>

                  <td className="py-3.5 px-4 font-sans">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      log.action === 'Login' || log.action === 'Submission'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : log.action === 'Upload' || log.action === 'Invitation'
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        : log.action === 'Delete'
                        ? 'bg-red-500/10 text-red-300 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Globe className="h-3 w-3 text-slate-500" />
                      <span>{log.ipAddress}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 truncate max-w-[150px]">{log.browser} • {log.device}</p>
                  </td>

                  <td className="py-3.5 px-4 font-sans text-slate-300 max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
