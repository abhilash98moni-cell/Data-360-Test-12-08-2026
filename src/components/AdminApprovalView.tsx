import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Clock, 
  Database, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  UserPlus, 
  Building2, 
  Mail, 
  Lock
} from 'lucide-react';
import { UserSession } from './AuthModal';
import { supabase } from '../lib/supabaseClient';

interface PendingRequest {
  id: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Auditor' | 'Distributor';
  organization: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface ApprovedUserDisplay {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  avatarInitials: string;
}

interface AdminApprovalViewProps {
  currentUser: UserSession | null;
  onOpenAuth?: () => void;
}

export const AdminApprovalView: React.FC<AdminApprovalViewProps> = ({ currentUser }) => {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [approvedUsersList, setApprovedUsersList] = useState<ApprovedUserDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [stats, setStats] = useState({
    totalPending: 0,
    approvedCount: 0,
    rejectedCount: 0,
    supabaseProtected: true
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch from server API
      const res = await fetch('/api/admin/pending-signups');
      const data = await res.json();

      let pending: PendingRequest[] = data.success ? (data.pendingRequests || []) : [];
      let approvedList: ApprovedUserDisplay[] = data.success ? (data.approvedUsers || []) : [];
      let approvedCount = data.approvedCount || approvedList.length;
      let rejectedCount = data.rejectedCount || 0;

      // 2. Fetch directly from Supabase DB tables for real-time accuracy
      try {
        const { data: dbPending } = await supabase
          .from('pending_signup_requests')
          .select('*')
          .order('requested_at', { ascending: false });

        if (dbPending && dbPending.length > 0) {
          const pendingRows = dbPending
            .filter(r => r.status === 'pending')
            .map(r => ({
              id: r.id,
              email: r.email,
              fullName: r.full_name,
              role: (r.role === 'admin' ? 'Admin' : r.role === 'distributor' ? 'Distributor' : 'Auditor') as 'Admin' | 'Auditor' | 'Distributor',
              organization: r.organization,
              requestedAt: r.requested_at,
              status: 'Pending' as const
            }));

          const approvedRows = dbPending.filter(r => r.status === 'approved');
          const rejectedRows = dbPending.filter(r => r.status === 'rejected');

          pending = pendingRows;
          approvedCount = approvedRows.length;
          rejectedCount = rejectedRows.length;

          if (approvedRows.length > 0) {
            approvedList = approvedRows.map(r => ({
              id: r.id,
              name: r.full_name,
              email: r.email,
              role: r.role === 'admin' ? 'Admin' : r.role === 'distributor' ? 'Distributor' : 'Auditor',
              organization: r.organization,
              avatarInitials: r.full_name ? r.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : r.email.slice(0, 2).toUpperCase()
            }));
          }

          // Also check active profiles from Supabase
          const { data: dbProfiles } = await supabase.from('profiles').select('*');
          if (dbProfiles && dbProfiles.length > 0) {
            approvedList = dbProfiles.map(p => ({
              id: p.id,
              name: p.full_name,
              email: p.email,
              role: p.role === 'admin' ? 'Admin' : p.role === 'distributor' ? 'Distributor' : 'Auditor',
              organization: p.organization || 'Data360 Platform',
              avatarInitials: p.avatar_initials || p.full_name?.slice(0, 2).toUpperCase() || 'US'
            }));
            approvedCount = Math.max(approvedCount, dbProfiles.length);
          }
        }
      } catch (dbErr) {
        console.warn('Supabase DB fetch note:', dbErr);
      }

      setPendingRequests(pending);
      setApprovedUsersList(approvedList);
      setStats({
        totalPending: pending.length,
        approvedCount,
        rejectedCount,
        supabaseProtected: true
      });
    } catch (err) {
      console.error('Failed to fetch admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    setActionLoadingId(id);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/approve-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: `Approved! Account for ${name} has been provisioned into Supabase Authentication.`
        });
        fetchDashboardData();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to approve signup request.'
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Server error during approval.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string, name: string) => {
    setActionLoadingId(id);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/reject-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: `Rejected. Signup request for ${name} has been discarded.`
        });
        fetchDashboardData();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to reject signup request.'
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Server error during rejection.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 animate-fade-in text-white">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Admin Registration Approvals</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Live Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button 
            onClick={() => setMessage(null)}
            className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Key Metrics Grid - 100% Dynamic to Supabase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Pending Approvals */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Signup Requests</span>
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.totalPending}</span>
            <span className="text-xs text-amber-400 font-semibold">Awaiting Admin Review</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Unapproved user data isolated in pending_signup_requests table.
          </p>
        </div>

        {/* Metric 2: Supabase Protection Status */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Supabase Gatekeeper</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-emerald-400">ENFORCED</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Accounts created only upon Admin <span className="text-emerald-300">Approve</span> action.
          </p>
        </div>

        {/* Metric 3: Approved Users */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Approved & Provisioned</span>
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.approvedCount}</span>
            <span className="text-xs text-indigo-400 font-semibold">Active Accounts</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Real-time count of approved users in Supabase.
          </p>
        </div>

        {/* Metric 4: Rejected Requests */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Rejected Requests</span>
            <div className="p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.rejectedCount}</span>
            <span className="text-xs text-red-400 font-semibold">Blocked & Discarded</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Requests rejected and blocked from access.
          </p>
        </div>

      </div>

      {/* Main Pending Approvals Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <span>Pending Signup Request Queue</span>
              </h2>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-400" />
              <p className="text-xs font-semibold">Fetching live Supabase queue...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto space-y-3">
              <div className="h-14 w-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-white text-base">Pending Request Queue Clear!</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                There are currently no unapproved user requests in the queue. All incoming Auditor and Distributor signups will appear here for Admin authorization before being entered into Supabase.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => {
                const isProcessing = actionLoadingId === req.id;
                const reqDate = new Date(req.requestedAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div 
                    key={req.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                        req.role === 'Auditor' 
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' 
                          : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                      }`}>
                        {req.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-bold text-slate-100 text-sm">{req.fullName}</h4>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            req.role === 'Auditor' 
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {req.role} Role Request
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-mono text-slate-300">{req.email}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>{req.organization}</span>
                          </span>
                          <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Submitted {reqDate}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-0 border-slate-800/80">
                      <button
                        onClick={() => handleReject(req.id, req.fullName)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-initial px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleApprove(req.id, req.fullName)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-initial px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        <span>Approve & Provision in Supabase</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active System Users Directory - 100% Dynamic from Supabase Profiles */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <span>Active Supabase Authenticated Accounts ({approvedUsersList.length})</span>
            </h3>
            <p className="text-xs text-slate-400">Real-time listing of active accounts in Supabase database</p>
          </div>
        </div>

        {approvedUsersList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No active accounts provisioned in Supabase yet. Approved users will appear here dynamically.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {approvedUsersList.map((user) => (
              <div key={user.id || user.email} className="bg-slate-950 p-4 border border-slate-800 rounded-2xl flex items-center gap-3">
                <div className={`h-10 w-10 border rounded-xl font-bold flex items-center justify-center shrink-0 ${
                  user.role === 'Admin' 
                    ? 'bg-purple-600/20 text-purple-300 border-purple-500/30' 
                    : user.role === 'Distributor' 
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  {user.avatarInitials}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-100 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                    user.role === 'Admin' 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                      : user.role === 'Distributor' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {user.role} Role
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
