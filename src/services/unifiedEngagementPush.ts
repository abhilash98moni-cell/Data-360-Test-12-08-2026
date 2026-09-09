import { UserSession } from '../components/AuthModal';

export interface UnifiedPushParams {
  tab: 'questionnaire' | 'irl' | 'sampling';
  action: 'push_single' | 'push_all' | 'send_clarifications';
  client: string;
  targetDistributor: string;
  allDistributors?: { id: string; name: string; code?: string }[];
  data?: any;
  clarificationCount?: number;
  currentUser?: UserSession | null;
  auditId?: string;
}

export interface UnifiedPushResult {
  success: boolean;
  message: string;
  pushedDistributors: string[];
  count?: number;
}

/**
 * Shared underlying Push and Clarification workflow for all Engagement Workspace tabs:
 * - Business Questionnaire
 * - Initial Information Request List (IRL)
 * - Sampling & Fieldwork Data
 */
export async function executeEngagementPush(params: UnifiedPushParams): Promise<UnifiedPushResult> {
  const {
    tab,
    action,
    client,
    targetDistributor,
    allDistributors = [],
    data,
    clarificationCount = 0,
    currentUser,
    auditId = 'eng-101'
  } = params;

  const distNames = action === 'push_all' && allDistributors.length > 0
    ? allDistributors.map(d => d.name)
    : [targetDistributor];

  try {
    const res = await fetch('/api/engagement-workspace/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': currentUser?.email || 'auditor@apex-audit.com',
        'x-user-role': currentUser?.role || 'Auditor'
      },
      body: JSON.stringify({
        tab,
        action,
        client,
        targetDistributor,
        distributors: distNames,
        data,
        clarificationCount,
        auditId
      })
    });

    const result = await res.json();

    // Also persist client-side storage cache for instant reactivity if IRL
    if (tab === 'irl') {
      try {
        const storageKey = `iir_pushed_distributors_${client}`;
        const existingRaw = localStorage.getItem(storageKey);
        const existingList: string[] = existingRaw ? JSON.parse(existingRaw) : [];
        const nextList = Array.from(new Set([...existingList, ...distNames]));
        localStorage.setItem(storageKey, JSON.stringify(nextList));
      } catch (e) {
        // Safe fallback
      }
    }

    // Trigger universal synchronization and notification events across tabs
    window.dispatchEvent(new CustomEvent('notification-updated'));
    window.dispatchEvent(new CustomEvent('data360_iir_sync_event'));
    window.dispatchEvent(new CustomEvent('engagement_workspace_updated', {
      detail: { tab, action, client, distributors: distNames }
    }));

    return {
      success: result.success ?? true,
      message: result.message || `Successfully processed ${action} for ${tab}.`,
      pushedDistributors: distNames,
      count: distNames.length
    };
  } catch (err: any) {
    console.error('executeEngagementPush error:', err);
    return {
      success: false,
      message: err.message || 'Failed to complete push operation.',
      pushedDistributors: []
    };
  }
}
