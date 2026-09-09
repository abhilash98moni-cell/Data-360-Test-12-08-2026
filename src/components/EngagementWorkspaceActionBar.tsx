import React from 'react';
import { Sparkles, Send, RefreshCw } from 'lucide-react';

export interface EngagementWorkspaceActionBarProps {
  tab: 'questionnaire' | 'irl' | 'sampling';
  viewRole: 'Auditor' | 'Distributor';
  activeDistributorName: string;
  allDistributorsCount: number;
  clarificationCount?: number;
  isPushing?: boolean;
  pushSingleLabel?: string;
  onCustomize?: () => void;
  onPushToDistributor: () => void | Promise<void>;
  onPushToAllDistributors: () => void | Promise<void>;
  onSendClarificationsBack?: () => void | Promise<void>;
  extraActions?: React.ReactNode;
}

/**
 * Reusable Action Bar for Auditor Engagement Workspace.
 * Provides unified Push, Push to ALL, Customize/Add, and Send Clarifications Back actions
 * with consistent styling, tooltips, and state handling across all three tabs.
 */
export const EngagementWorkspaceActionBar: React.FC<EngagementWorkspaceActionBarProps> = ({
  tab,
  viewRole,
  activeDistributorName,
  allDistributorsCount,
  clarificationCount = 0,
  isPushing = false,
  pushSingleLabel,
  onCustomize,
  onPushToDistributor,
  onPushToAllDistributors,
  onSendClarificationsBack,
  extraActions
}) => {
  if (viewRole !== 'Auditor') {
    return null;
  }

  const effectiveDistName = activeDistributorName || 'Distributor';
  const effectiveCount = allDistributorsCount > 0 ? allDistributorsCount : 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {onCustomize && (
        <button
          type="button"
          onClick={onCustomize}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          title="Customize or add request item"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>+ Customize / Add Request Item</span>
        </button>
      )}

      <button
        type="button"
        onClick={onPushToDistributor}
        disabled={isPushing}
        className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        title={`Push current items to ${effectiveDistName} account`}
      >
        {isPushing ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Send className="h-3.5 w-3.5" />
        )}
        <span>{pushSingleLabel || `Push to ${effectiveDistName}`}</span>
      </button>

      <button
        type="button"
        onClick={onPushToAllDistributors}
        disabled={isPushing}
        className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        title={`Push current items to ALL ${effectiveCount} distributor accounts`}
      >
        {isPushing ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-200" />
        ) : (
          <Send className="h-3.5 w-3.5 text-emerald-200" />
        )}
        <span>Push to ALL ({effectiveCount}) Distributors</span>
      </button>

      {clarificationCount > 0 && onSendClarificationsBack && (
        <button
          type="button"
          onClick={onSendClarificationsBack}
          disabled={isPushing}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title={`Send ${clarificationCount} clarification request(s) back to ${effectiveDistName}`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Send {clarificationCount} Clarification(s) Back</span>
        </button>
      )}

      {extraActions}
    </div>
  );
};
