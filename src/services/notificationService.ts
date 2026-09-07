import { getSupabaseServerClient } from '../lib/supabaseServer.js';

export interface NotificationPayload {
  id?: string;
  target_user_email?: string | null;
  target_organization?: string;
  target_role?: 'Auditor' | 'Distributor' | 'All' | string;
  category: string;
  title: string;
  message: string;
  link_tab?: string;
  metadata?: Record<string, any>;
  target_voucher_no?: string;
  target_sample_id?: string;
  is_read?: boolean;
  created_at?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: string;
  timestamp: string;
  createdAt: string;
  isRead: boolean;
  linkTab?: string;
  targetUserRole: string;
  targetOrganization: string;
  targetVoucherNo?: string;
  targetSampleId?: string;
  metadata?: Record<string, any>;
}

// In-memory cache for high-speed delivery and fallback
const inMemoryNotifications: any[] = [];
const userReadNotificationIds = new Map<string, Set<string>>();
const userDeletedNotificationIds = new Map<string, Set<string>>();
const userAllReadTimestamps = new Map<string, number>();

/**
 * Derives a consistent recipient user key for isolated tracking.
 */
export function getRecipientUserKey(params: { role?: string; distributor?: string; userEmail?: string }): string {
  const clean = (s: any) => String(s || '').trim().toLowerCase();
  const rawRole = params.role || '';
  const isDist = clean(rawRole).includes('distributor');
  const org = clean(params.distributor || '');
  const email = clean(params.userEmail || '');

  if (email && email !== 'all' && email !== 'user' && !email.includes('anonymous')) {
    return email;
  }
  return `${isDist ? 'distributor' : 'auditor'}::${org || 'all'}`;
}

/**
 * Dispatches and permanently persists a notification into Supabase database (system_audit_logs).
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<any> {
  const notifId = payload.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = payload.created_at || new Date().toISOString();
  const targetRole = payload.target_role || 'All';
  const targetOrg = payload.target_organization || 'All';

  const meta: Record<string, any> = {
    ...(payload.metadata || {}),
    targetRole,
    targetOrganization: targetOrg,
    voucherNo: payload.target_voucher_no || payload.metadata?.voucherNo || payload.metadata?.voucher_no,
    sampleId: payload.target_sample_id || payload.metadata?.sampleId || payload.metadata?.sample_id,
    linkTab: payload.link_tab || payload.metadata?.linkTab || (targetRole === 'Auditor' ? 'sampling_review' : 'engagement_workspace')
  };

  const item = {
    id: notifId,
    target_user_email: payload.target_user_email || null,
    target_organization: targetOrg,
    target_role: targetRole,
    category: payload.category || 'System',
    title: payload.title,
    message: payload.message,
    is_read: false,
    created_at: nowIso,
    link_tab: meta.linkTab,
    metadata: meta,
    target_voucher_no: meta.voucherNo || '',
    target_sample_id: meta.sampleId || ''
  };

  // 1. Maintain in-memory buffer
  inMemoryNotifications.unshift(item);
  if (inMemoryNotifications.length > 300) inMemoryNotifications.pop();

  // 2. Persist to Supabase database
  try {
    const supabase = getSupabaseServerClient();
    await supabase.from('system_audit_logs').insert({
      event_type: 'APP_NOTIFICATION',
      target_user_email: payload.target_user_email || `${targetRole}::${targetOrg}`,
      ip_address: '127.0.0.1',
      details: JSON.stringify(item)
    });
  } catch (err) {
    console.warn('Supabase notification dispatch note:', err);
  }

  return item;
}

/**
 * Fetches all persistent notifications for a user based on their role and organization.
 */
export async function getNotifications(params: {
  role?: string;
  distributor?: string;
  userEmail?: string;
}): Promise<AppNotification[]> {
  const { role, distributor, userEmail } = params;
  const clean = (s: any) => String(s || '').trim().toLowerCase();

  const userKey = getRecipientUserKey(params);
  const effectiveEmail = clean(userEmail || '');

  const userReadIds = userReadNotificationIds.get(userKey) || new Set<string>();
  const userDeletedIds = userDeletedNotificationIds.get(userKey) || new Set<string>();

  const readIdsFromDb = new Set<string>(userReadIds);
  const deletedIdsFromDb = new Set<string>(userDeletedIds);
  let userDbAllReadTime = userAllReadTimestamps.get(userKey) || 0;
  const rawNotifs: any[] = [];

  // 1. Query Supabase system_audit_logs
  try {
    const supabase = getSupabaseServerClient();
    const { data: auditLogs, error: auditErr } = await supabase
      .from('system_audit_logs')
      .select('*')
      .in('event_type', ['APP_NOTIFICATION', 'APP_NOTIFICATION_READ', 'APP_NOTIFICATION_DELETED'])
      .order('created_at', { ascending: false })
      .limit(350);

    if (!auditErr && Array.isArray(auditLogs)) {
      auditLogs.forEach(log => {
        try {
          let parsed = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
          const logTargetEmail = clean(log.target_user_email);
          const isMatchForThisUser = logTargetEmail === userKey || 
                                     (effectiveEmail && logTargetEmail === effectiveEmail) ||
                                     (parsed?.userKey === userKey) ||
                                     (parsed?.userEmail && clean(parsed.userEmail) === effectiveEmail);

          if (log.event_type === 'APP_NOTIFICATION_READ' && isMatchForThisUser) {
            if (parsed?.notificationId === 'ALL') {
              if (Array.isArray(parsed?.notificationIds)) {
                parsed.notificationIds.forEach((id: string) => readIdsFromDb.add(id));
              }
              if (parsed?.readAt) {
                const rTime = new Date(parsed.readAt).getTime();
                if (!isNaN(rTime) && rTime > userDbAllReadTime) {
                  userDbAllReadTime = rTime;
                }
              }
            } else {
              const rId = parsed?.notificationId || parsed?.id;
              if (rId) readIdsFromDb.add(rId);
            }
          } else if (log.event_type === 'APP_NOTIFICATION_DELETED' && isMatchForThisUser) {
            const dId = parsed?.notificationId || parsed?.id;
            if (dId) deletedIdsFromDb.add(dId);
          } else if (log.event_type === 'APP_NOTIFICATION' && parsed) {
            const notifId = parsed.id || log.id;
            if (!rawNotifs.some(n => n.id === notifId)) {
              rawNotifs.push({
                id: notifId,
                target_user_email: parsed.target_user_email,
                target_organization: parsed.target_organization || parsed.targetOrganization || parsed.metadata?.targetOrganization,
                target_role: parsed.target_role || parsed.targetRole || parsed.metadata?.targetRole,
                category: parsed.category || 'System',
                title: parsed.title,
                message: parsed.message,
                is_read: Boolean(parsed.is_read),
                created_at: parsed.created_at || parsed.createdAt || log.created_at,
                link_tab: parsed.link_tab || parsed.linkTab || parsed.metadata?.linkTab,
                target_voucher_no: parsed.target_voucher_no || parsed.targetVoucherNo || parsed.metadata?.voucherNo || '',
                target_sample_id: parsed.target_sample_id || parsed.targetSampleId || parsed.metadata?.sampleId || '',
                metadata: parsed.metadata || {}
              });
            }
          }
        } catch (e) {}
      });
    }
  } catch (e) {
    console.warn('Error fetching notifications from Supabase:', e);
  }

  // 2. Merge in-memory notifications
  inMemoryNotifications.forEach(imn => {
    if (!rawNotifs.some(n => n.id === imn.id)) {
      rawNotifs.push(imn);
    }
  });

  // 3. Normalize notifications
  const normalized: AppNotification[] = rawNotifs
    .filter(n => !deletedIdsFromDb.has(n.id))
    .map(n => {
      let rawMsg = n.message || '';
      let cleanMsg = rawMsg;
      let meta: any = n.metadata || {};
      const metaMatch = rawMsg.match(/\[METADATA:([\s\S]*?)\]/);
      if (metaMatch) {
        try {
          meta = { ...meta, ...JSON.parse(metaMatch[1]) };
          cleanMsg = rawMsg.replace(/\[METADATA:[\s\S]*?\]/, '').trim();
        } catch (e) {}
      }

      let targetRole = n.target_role || meta.targetRole || 'All';
      const targetOrg = n.target_organization || meta.targetOrganization || 'All';
      const cat = n.category || '';

      // Canonical target inference if targetRole is generic
      if (targetRole === 'All' || !targetRole) {
        const isAuditorCat = ['Documents Uploaded', 'Required Data Submitted', 'Required Data Resubmitted', 'Data Submitted', 'IRL Submitted', 'Evidence Uploaded', 'Edit Access Requested'].includes(cat);
        const isDistCat = ['Evidence Accepted', 'Evidence Rejected', 'Clarification Requested', 'Edit Access Approved', 'System'].includes(cat);
        if (isAuditorCat) targetRole = 'Auditor';
        else if (isDistCat) targetRole = 'Distributor';
      }

      const nTime = new Date(n.created_at || 0).getTime();
      const isRead = readIdsFromDb.has(n.id) || (userDbAllReadTime > 0 && nTime > 0 && nTime <= userDbAllReadTime);

      const createdDate = new Date(n.created_at || Date.now());
      const diffMs = Date.now() - createdDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      let timeStr = 'Just now';
      if (diffMins > 0 && diffMins < 60) timeStr = `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
      else if (diffHours >= 1 && diffHours < 24) timeStr = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      else if (diffDays === 1) timeStr = 'Yesterday';
      else if (diffDays > 1) timeStr = `${diffDays} days ago`;

      return {
        id: n.id,
        title: n.title,
        message: cleanMsg,
        category: n.category,
        timestamp: timeStr,
        createdAt: n.created_at || new Date().toISOString(),
        isRead: isRead,
        linkTab: n.link_tab || meta.linkTab || (targetRole.toLowerCase().includes('auditor') ? 'sampling_review' : 'engagement_workspace'),
        targetUserRole: targetRole,
        targetOrganization: targetOrg,
        targetVoucherNo: n.target_voucher_no || meta.voucherNo || meta.voucher_no || '',
        targetSampleId: n.target_sample_id || meta.sampleId || meta.sample_id || '',
        metadata: meta
      };
    });

  // 4. Role and Organization filtering (CRITICAL: Recipient Isolation)
  const userRoleStr = clean(role || 'auditor');
  const userDistStr = clean(distributor);
  const isDistributor = userRoleStr.includes('distributor');

  const filtered = normalized.filter(n => {
    let targetRole = clean(n.targetUserRole);
    const targetOrg = clean(n.targetOrganization);

    if (isDistributor) {
      // DISTRIBUTOR LOGIN:
      // CRITICAL: A notification created for the Auditor MUST NOT appear in the Distributor's notification feed!
      if (targetRole !== 'distributor') return false;

      // Match organization if specified
      if (userDistStr && userDistStr !== 'all' && !userDistStr.includes('distributor partner') && !userDistStr.includes('distributor entity')) {
        if (targetOrg && targetOrg !== 'all') {
          const matches = targetOrg.includes(userDistStr) || userDistStr.includes(targetOrg);
          if (!matches) return false;
        }
      }
      return true;
    } else {
      // AUDITOR LOGIN:
      // CRITICAL: A notification created for the Distributor MUST NOT appear in the Auditor's notification feed!
      if (targetRole !== 'auditor') return false;

      // If auditor filtered by a specific distributor:
      if (userDistStr && userDistStr !== 'all' && !userDistStr.includes('apex') && !userDistStr.includes('audit')) {
        if (targetOrg && targetOrg !== 'all') {
          const matches = targetOrg.includes(userDistStr) || userDistStr.includes(targetOrg);
          if (!matches) return false;
        }
      }
      return true;
    }
  });

  // 5. Deduplicate
  const dedupedMap = new Map<string, AppNotification>();
  filtered.forEach(n => {
    const vKey = n.targetVoucherNo || n.targetSampleId || n.metadata?.requirementId || '';
    const dedupeKey = `${clean(n.targetUserRole)}::${clean(n.category)}::${clean(vKey)}::${clean(n.title)}`;
    const existing = dedupedMap.get(dedupeKey);
    if (!existing) {
      dedupedMap.set(dedupeKey, n);
    } else {
      const existingTime = new Date(existing.createdAt || 0).getTime();
      const newTime = new Date(n.createdAt || 0).getTime();
      if (newTime > existingTime) {
        n.isRead = existing.isRead || n.isRead;
        dedupedMap.set(dedupeKey, n);
      } else {
        existing.isRead = existing.isRead || n.isRead;
      }
    }
  });

  const finalSorted = Array.from(dedupedMap.values());
  finalSorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return finalSorted;
}

/**
 * Marks a single notification as read for a specific user.
 */
export async function markNotificationAsRead(notificationId: string, userEmailOrKey?: string): Promise<boolean> {
  const userKey = userEmailOrKey || 'user';
  let userReads = userReadNotificationIds.get(userKey);
  if (!userReads) {
    userReads = new Set<string>();
    userReadNotificationIds.set(userKey, userReads);
  }
  userReads.add(notificationId);

  try {
    const supabase = getSupabaseServerClient();
    await supabase.from('system_audit_logs').insert({
      event_type: 'APP_NOTIFICATION_READ',
      target_user_email: userKey,
      ip_address: '127.0.0.1',
      details: JSON.stringify({ notificationId, userKey, readAt: new Date().toISOString() })
    });
    return true;
  } catch (err) {
    console.warn('Error marking notification as read in Supabase:', err);
    return false;
  }
}

/**
 * Marks all matching notifications as read for a specific user.
 */
export async function markAllNotificationsAsRead(params: {
  userEmail?: string;
  role?: string;
  distributor?: string;
  userKey?: string;
}): Promise<boolean> {
  try {
    const userKey = params.userKey || getRecipientUserKey(params);
    let userReads = userReadNotificationIds.get(userKey);
    if (!userReads) {
      userReads = new Set<string>();
      userReadNotificationIds.set(userKey, userReads);
    }

    const current = await getNotifications(params);
    const ids = current.map(n => n.id);
    ids.forEach(id => userReads!.add(id));
    userAllReadTimestamps.set(userKey, Date.now());

    const supabase = getSupabaseServerClient();
    await supabase.from('system_audit_logs').insert({
      event_type: 'APP_NOTIFICATION_READ',
      target_user_email: userKey,
      ip_address: '127.0.0.1',
      details: JSON.stringify({
        notificationId: 'ALL',
        notificationIds: ids,
        userKey,
        readAt: new Date().toISOString()
      })
    });
    return true;
  } catch (err) {
    console.warn('Error marking all notifications as read:', err);
    return false;
  }
}

/**
 * Dismisses/deletes a notification for a specific user.
 */
export async function deleteNotification(notificationId: string, userEmailOrKey?: string): Promise<boolean> {
  const userKey = userEmailOrKey || 'user';
  let userDeletes = userDeletedNotificationIds.get(userKey);
  if (!userDeletes) {
    userDeletes = new Set<string>();
    userDeletedNotificationIds.set(userKey, userDeletes);
  }
  userDeletes.add(notificationId);

  try {
    const supabase = getSupabaseServerClient();
    await supabase.from('system_audit_logs').insert({
      event_type: 'APP_NOTIFICATION_DELETED',
      target_user_email: userKey,
      ip_address: '127.0.0.1',
      details: JSON.stringify({ notificationId, userKey, deletedAt: new Date().toISOString() })
    });
    return true;
  } catch (err) {
    console.warn('Error deleting notification from Supabase:', err);
    return false;
  }
}
