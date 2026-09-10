import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Clock, AlertTriangle, KeyRound, MessageSquare } from 'lucide-react';
import { UserSession } from '../types';

interface AuditorAccessRequestBannerProps {
  client: string;
  distributor: string;
  auditId?: string;
  currentUser?: UserSession | null;
  onStatusChange?: () => void;
}

export const AuditorAccessRequestBanner: React.FC<AuditorAccessRequestBannerProps> = ({
  client,
  distributor,
  auditId = 'eng-101',
  currentUser,
  onStatusChange
}) => {
  const [pendingRequest, setPendingRequest] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams();
      if (client && client !== 'All Clients') query.set('client', client);
      if (distributor && distributor !== 'All Distributors') query.set('distributor', distributor);
      const res = await fetch(`/api/iir/edit-requests?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.requests)) {
          const pending = data.requests.find((r: any) => r.status === 'PENDING');
          setPendingRequest(pending || null);
          return;
        }
      }
      setPendingRequest(null);
    } catch (err) {
      console.warn('Error fetching pending edit requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    const handleRefresh = () => fetchPendingRequests();
    window.addEventListener('edit-access-updated', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    const interval = setInterval(fetchPendingRequests, 10000);
    return () => {
      window.removeEventListener('edit-access-updated', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      clearInterval(interval);
    };
  }, [client, distributor]);

  const handleApprove = async () => {
    if (!pendingRequest) return;
    setIsProcessing(true);
    setFeedbackMsg(null);
    const targetDistributor = pendingRequest.distributor_name || pendingRequest.distributor || (distributor !== 'All Distributors' ? distributor : 'Midwest Trading Co.');
    try {
      const res = await fetch('/api/iir/request-edit/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: pendingRequest.id,
          client: pendingRequest.client || client,
          distributor: targetDistributor,
          auditId,
          reviewedBy: currentUser?.name || currentUser?.email || 'APEX Auditor',
          userRole: currentUser?.role || 'Auditor',
          comment: 'Approved by lead auditor. All sections unlocked for edits.'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve request.');
      }

      setFeedbackMsg({
        type: 'success',
        text: `Edit access approved for ${targetDistributor}! Editing is unlocked across Business Questionnaire, IRL, and Sampling.`
      });
      setPendingRequest(null);
      window.dispatchEvent(new CustomEvent('edit-access-updated'));
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Approval failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!pendingRequest) return;
    setIsProcessing(true);
    setFeedbackMsg(null);
    const targetDistributor = pendingRequest.distributor_name || pendingRequest.distributor || (distributor !== 'All Distributors' ? distributor : 'Midwest Trading Co.');
    try {
      const res = await fetch('/api/iir/request-edit/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: pendingRequest.id,
          client: pendingRequest.client || client,
          distributor: targetDistributor,
          auditId,
          reviewedBy: currentUser?.name || currentUser?.email || 'APEX Auditor',
          userRole: currentUser?.role || 'Auditor',
          comment: rejectComment.trim() || 'Declined by lead auditor. All sections remain read-only.'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject request.');
      }

      setFeedbackMsg({
        type: 'success',
        text: `Edit access rejected for ${targetDistributor}. Sections remain locked in read-only mode.`
      });
      setShowRejectModal(false);
      setRejectComment('');
      setPendingRequest(null);
      window.dispatchEvent(new CustomEvent('edit-access-updated'));
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Rejection failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!pendingRequest && !feedbackMsg) return null;

  return (
    <div className="space-y-2">
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {pendingRequest && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 shrink-0 mt-0.5">
              <KeyRound className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ACTION REQUIRED • EDIT ACCESS REQUEST
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-xs text-amber-200/90 font-medium">
                  {new Date(pendingRequest.requested_at || pendingRequest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">
                {pendingRequest.distributor_name || distributor} requested edit access
              </h4>
              <p className="text-xs text-slate-300">
                <span className="font-semibold text-amber-200">Reason:</span>{' '}
                {pendingRequest.request_reason ? (
                  <span className="italic">"{pendingRequest.request_reason}"</span>
                ) : (
                  <span className="text-slate-400 italic">No specific reason provided (optional).</span>
                )}
              </p>
              <p className="text-[11px] text-slate-400">
                Approving will unlock editing across <strong className="text-slate-200">Business Questionnaire, IRL, and Sampling</strong>. Rejecting will keep all 3 sections read-only.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:border-rose-500/50 hover:text-rose-300 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Reject Request</span>
            </button>
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isProcessing ? 'Processing...' : 'Approve & Unlock All'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-400" />
                Reject Edit Access Request
              </h4>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Provide an explanation to the distributor for why this edit request is rejected. All 3 sections will remain locked in read-only mode.
            </p>

            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
              placeholder="e.g., Audit fieldwork is closed. Please submit clarification responses under the designated follow-up items instead."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow transition-all"
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
