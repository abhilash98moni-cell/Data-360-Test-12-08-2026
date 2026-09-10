import React, { useState } from 'react';
import { Shield, KeyRound, X, AlertCircle, CheckCircle2, Clock, Send } from 'lucide-react';
import { UserSession } from '../types';

interface EditAccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: string;
  distributor: string;
  auditId?: string;
  currentUser?: UserSession | null;
  onSuccess?: (request: any) => void;
}

export const EditAccessRequestModal: React.FC<EditAccessRequestModalProps> = ({
  isOpen,
  onClose,
  client,
  distributor,
  auditId = 'eng-101',
  currentUser,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/iir/request-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client,
          distributor,
          auditId,
          scope: 'All Sections (Questionnaire, IRL, Sampling)',
          reason: reason.trim(),
          requestedBy: currentUser?.name || currentUser?.email || distributor,
          userRole: currentUser?.role || 'Distributor'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit edit access request.');
      }

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess(data.request || data);
      }

      setTimeout(() => {
        setIsSuccess(false);
        setReason('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        id="edit-access-request-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Request Edit Access
              </h3>
              <p className="text-xs text-slate-400">
                Unlock editing across Business Questionnaire, IRL, and Sampling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-white">Edit Access Requested</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Your request has been submitted. A persistent notification has been dispatched to the auditor team. Upon approval, editing will be unlocked across all sections.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Target Scope Information */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Distributor:</span>
                <span className="font-semibold text-white">{distributor}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Audit Client:</span>
                <span className="font-semibold text-white">{client}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Sections to Unlock:</span>
                <span className="font-semibold text-indigo-400">Business Questionnaire, IRL & Sampling</span>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="edit-request-reason" className="text-xs font-semibold text-slate-200">
                  Reason or Context <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[11px] text-slate-500">Optional</span>
              </div>
              <textarea
                id="edit-request-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Optional: Provide details on why edit access is needed (e.g., updating bank confirmation document, revising revenue disclosure, attaching updated voucher evidence)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              />
              <p className="text-[11px] text-slate-400 leading-normal">
                You can submit without providing a reason. The APEX Auditor team will receive a persistent notification and can approve or reject the request.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
