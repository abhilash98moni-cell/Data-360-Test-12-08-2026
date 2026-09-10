import { SupabaseClient } from '@supabase/supabase-js';
import { INITIAL_IIR_REQUESTS } from '../data/iirData.js';
import { getItemCompletionDetails } from '../utils/irlValidation.js';
import { getSupabaseServerClient, getSupabaseServerUrl } from '../lib/supabaseServer.js';

export { getSupabaseServerClient, getSupabaseServerUrl };

export interface AuthoritativeIRLRecord {
  found: boolean;
  recordId?: string;
  state: {
    client: string;
    distributor: string;
    auditId: string;
    status: string;
    isLocked: boolean;
    submissionDate?: string;
    completionPercentage: number;
    completedCount: number;
    totalCount: number;
    submittedBy?: string;
    requests: any[];
    version: number;
    updatedAt: string;
  };
  createdAt?: string;
}

/**
 * Retrieves the authoritative IRL state from Supabase PostgreSQL.
 * If no state exists yet, initializes the canonical state directly in Supabase and returns it.
 */
export async function getAuthoritativeIRLState(
  clientName: string,
  distName: string,
  auditId: string = 'eng-101'
): Promise<AuthoritativeIRLRecord> {
  const supabase = getSupabaseServerClient();
  const stateKey = `${clientName}::${distName}`;

  const { data, error } = await supabase
    .from('system_audit_logs')
    .select('*')
    .eq('event_type', 'IRL_DISTRIBUTOR_STATE')
    .eq('target_user_email', stateKey)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Supabase query error in getAuthoritativeIRLState:', error);
    throw new Error(`Failed to load authoritative state from Supabase: ${error.message}`);
  }

  if (data && data.length > 0 && data[0].details) {
    return {
      found: true,
      recordId: data[0].id,
      state: data[0].details,
      createdAt: data[0].created_at
    };
  }

  // Initialize canonical baseline state directly from INITIAL_IIR_REQUESTS and persist to Supabase immediately
  const isNewDistributor = distName !== 'Midwest Trading Co.';
  const initialRequests = JSON.parse(JSON.stringify(INITIAL_IIR_REQUESTS)).map((r: any) => {
    if (isNewDistributor) {
      return {
        ...r,
        status: 'Pending',
        reviewerStatus: undefined,
        textResponse: '',
        noUploadExplanation: '',
        uploadedFiles: [],
        comments: [],
        lastUpdated: undefined,
        reviewerComment: undefined,
        subQuestionResponses: {}
      };
    }
    return r;
  });
  const totalCount = initialRequests.length;
  const completedCount = isNewDistributor ? 0 : initialRequests.filter((r: any) => getItemCompletionDetails(r).isComplete).length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const initialState = {
    client: clientName,
    distributor: distName,
    auditId,
    status: 'In Progress',
    isLocked: false,
    submissionDate: undefined,
    completionPercentage,
    completedCount,
    totalCount,
    submittedBy: undefined,
    requests: initialRequests,
    version: 1,
    updatedAt: new Date().toISOString()
  };

  const insertRes = await supabase.from('system_audit_logs').insert({
    event_type: 'IRL_DISTRIBUTOR_STATE',
    target_user_email: stateKey,
    details: initialState,
    created_at: new Date().toISOString()
  }).select().single();

  if (insertRes.error) {
    console.error('Supabase initial baseline save error:', insertRes.error);
    throw new Error(`Failed to initialize baseline IRL state in database: ${insertRes.error.message}`);
  }

  return {
    found: true,
    recordId: insertRes.data?.id,
    state: initialState,
    createdAt: insertRes.data?.created_at
  };
}

/**
 * Persists an updated authoritative IRL state into Supabase PostgreSQL.
 * Automatically recalculates completion metrics and increments the state version.
 */
export async function saveAuthoritativeIRLState(
  clientName: string,
  distName: string,
  stateUpdate: any
) {
  const supabase = getSupabaseServerClient();
  const stateKey = `${clientName}::${distName}`;
  const nowIso = new Date().toISOString();

  const requests = Array.isArray(stateUpdate.requests) ? stateUpdate.requests : [];
  const totalCount = requests.length;
  const completedCount = requests.filter((r: any) => getItemCompletionDetails(r).isComplete).length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const currentVersion = Number(stateUpdate.version || 1);
  const nextVersion = currentVersion + 1;

  const fullState = {
    ...stateUpdate,
    client: clientName,
    distributor: distName,
    completionPercentage,
    completedCount,
    totalCount,
    version: nextVersion,
    updatedAt: nowIso
  };

  const insertRes = await supabase.from('system_audit_logs').insert({
    event_type: 'IRL_DISTRIBUTOR_STATE',
    target_user_email: stateKey,
    details: fullState,
    created_at: nowIso
  }).select().single();

  if (insertRes.error) {
    console.error('Supabase saveAuthoritativeIRLState error:', insertRes.error);
    throw new Error(`Failed to persist authoritative state in database: ${insertRes.error.message}`);
  }

  return {
    success: true,
    recordId: insertRes.data?.id,
    state: fullState,
    savedAt: nowIso
  };
}

/**
 * Retrieves all authoritative submissions for a client from Supabase PostgreSQL.
 */
export async function getAuthoritativeSubmissions(clientName?: string) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('system_audit_logs')
    .select('*')
    .eq('event_type', 'IRL_DISTRIBUTOR_STATE')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load submissions from database: ${error.message}`);
  }

  const latestMap = new Map<string, any>();
  (data || []).forEach(row => {
    const state = row.details;
    if (state && state.client && state.distributor) {
      const key = `${state.client}::${state.distributor}`;
      if (!latestMap.has(key)) {
        latestMap.set(key, {
          client: state.client,
          distributor: state.distributor,
          auditId: state.auditId,
          status: state.status,
          isLocked: state.isLocked,
          submissionDate: state.submissionDate,
          completionPercentage: state.completionPercentage,
          completedCount: state.completedCount,
          totalCount: state.totalCount,
          submittedBy: state.submittedBy,
          updatedAt: state.updatedAt,
          version: state.version
        });
      }
    }
  });

  let submissions = Array.from(latestMap.values());
  if (clientName) {
    submissions = submissions.filter(s => s.client === clientName);
  }

  return submissions;
}

/**
 * Submits an edit access request directly to Supabase PostgreSQL.
 */
export async function createAuthoritativeEditRequest(params: {
  client: string;
  distributor: string;
  auditId?: string;
  scope?: string;
  affectedRequirements?: string[];
  reason: string;
  requestedBy?: string;
  userRole?: string;
  ipAddress?: string;
}) {
  const { client, distributor, auditId, scope, affectedRequirements, reason, requestedBy, userRole, ipAddress } = params;

  if (!client || !distributor || !reason) {
    throw new Error('Client, distributor, and reason are required.');
  }

  const trimmedReason = String(reason).trim();
  if (trimmedReason.length < 50) {
    throw new Error(`Request reason must be at least 50 characters long. Current length: ${trimmedReason.length} characters.`);
  }

  const supabase = getSupabaseServerClient();
  const stateKey = `${client}::${distributor}`;

  // Check existing pending requests
  const { data: existingLogs, error: checkError } = await supabase
    .from('system_audit_logs')
    .select('*')
    .eq('event_type', 'IRL_EDIT_REQUEST')
    .eq('target_user_email', stateKey)
    .order('created_at', { ascending: false })
    .limit(10);

  if (checkError) {
    throw new Error(`Failed to check existing edit requests: ${checkError.message}`);
  }

  const hasPending = (existingLogs || []).some(log => log.details?.status === 'PENDING');
  if (hasPending) {
    throw new Error('You already have a pending edit request for this audit.');
  }

  const requestId = `REQ-${Date.now().toString().slice(-6)}`;
  const nowIso = new Date().toISOString();

  const newEditRequest = {
    id: requestId,
    client_name: client,
    distributor_name: distributor,
    audit_id: auditId || 'eng-101',
    scope: scope || 'Entire IRL',
    affected_requirements: affectedRequirements || [],
    requested_by: requestedBy || distributor,
    request_reason: trimmedReason,
    status: 'PENDING',
    requested_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso
  };

  const insertRes = await supabase.from('system_audit_logs').insert({
    event_type: 'IRL_EDIT_REQUEST',
    target_user_email: stateKey,
    details: newEditRequest,
    created_at: nowIso
  });

  if (insertRes.error) {
    throw new Error(`Failed to save edit request to database: ${insertRes.error.message}`);
  }

  // Audit log
  try {
    await supabase.from('system_audit_logs').insert({
      user_name: requestedBy || distributor,
      user_email: `${distributor.toLowerCase().replace(/\s+/g, '')}@data360.com`,
      user_role: userRole || 'Distributor',
      organization: distributor,
      action: 'IRL Edit Access Requested',
      ip_address: ipAddress || '127.0.0.1',
      details: `Edit access requested by ${distributor} for client ${client}. Scope: ${scope || 'Entire IRL'}. Request ID: ${requestId}. Reason: "${trimmedReason}"`
    });
  } catch (e) {
    console.warn('Edit request audit log note:', e);
  }

  return {
    requestId,
    request: newEditRequest
  };
}

/**
 * Retrieves all edit access requests from Supabase PostgreSQL.
 */
export async function getAuthoritativeEditRequests(clientName?: string, distName?: string) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('system_audit_logs')
    .select('*')
    .eq('event_type', 'IRL_EDIT_REQUEST')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch edit requests from database: ${error.message}`);
  }

  const latestMap = new Map<string, any>();
  (data || []).forEach(row => {
    const details = row.details;
    if (details && details.id) {
      if (!latestMap.has(details.id)) {
        latestMap.set(details.id, {
          id: details.id,
          client: details.client_name,
          distributor: details.distributor_name,
          auditId: details.audit_id,
          scope: details.scope,
          affectedRequirements: details.affected_requirements,
          requestedBy: details.requested_by,
          requestReason: details.request_reason,
          status: details.status,
          reviewerComment: details.reviewer_comment,
          reviewedBy: details.reviewed_by,
          requestedAt: details.requested_at,
          reviewedAt: details.reviewed_at,
          approvedAt: details.approved_at,
          rejectedAt: details.rejected_at
        });
      }
    }
  });

  let requests = Array.from(latestMap.values());
  if (distName) {
    requests = requests.filter(r => r.distributor === distName);
  } else if (clientName) {
    requests = requests.filter(r => r.client === clientName);
  }

  return requests;
}

/**
 * Approves or Rejects an edit access request directly in Supabase PostgreSQL.
 */
export async function reviewAuthoritativeEditRequest(params: {
  requestId: string;
  action: 'APPROVED' | 'REJECTED';
  comment?: string;
  reviewedBy?: string;
  userRole?: string;
  client?: string;
  distributor?: string;
  ipAddress?: string;
}) {
  const { requestId, action, comment, reviewedBy, userRole, client, distributor, ipAddress } = params;

  if (!requestId) {
    throw new Error('Request ID is required.');
  }

  if (userRole === 'Distributor') {
    throw new Error('403 Unauthorized: Distributors are strictly prohibited from reviewing edit requests.');
  }

  if (action === 'REJECTED' && (!comment || String(comment).trim().length === 0)) {
    throw new Error('A rejection comment/reason is required.');
  }

  const supabase = getSupabaseServerClient();
  const nowIso = new Date().toISOString();

  // Find target request
  const { data: logs, error: findError } = await supabase
    .from('system_audit_logs')
    .select('*')
    .eq('event_type', 'IRL_EDIT_REQUEST')
    .order('created_at', { ascending: false });

  if (findError) {
    throw new Error(`Failed to find request in database: ${findError.message}`);
  }

  const targetLog = (logs || []).find(l => l.details?.id === requestId);
  const targetClient = client || targetLog?.details?.client_name;
  const targetDistributor = distributor || targetLog?.details?.distributor_name;

  if (!targetClient || !targetDistributor) {
    throw new Error(`Could not determine client and distributor for edit request ${requestId}`);
  }

  const updatedEditRequest = {
    ...(targetLog?.details || {}),
    id: requestId,
    client_name: targetClient,
    distributor_name: targetDistributor,
    status: action,
    reviewed_by: reviewedBy || 'APEX Lead Auditor',
    reviewed_at: nowIso,
    reviewer_comment: comment || (action === 'APPROVED' ? 'Edit access approved by APEX Lead Auditor.' : 'Rejected'),
    approved_at: action === 'APPROVED' ? nowIso : undefined,
    rejected_at: action === 'REJECTED' ? nowIso : undefined,
    updated_at: nowIso
  };

  const stateKey = `${targetClient}::${targetDistributor}`;

  // Insert updated request state log
  const insertRes = await supabase.from('system_audit_logs').insert({
    event_type: 'IRL_EDIT_REQUEST',
    target_user_email: stateKey,
    details: updatedEditRequest,
    created_at: nowIso
  });

  if (insertRes.error) {
    throw new Error(`Failed to record review update in database: ${insertRes.error.message}`);
  }

  // If approved, unlock the authoritative submission state in Supabase
  if (action === 'APPROVED') {
    const current = await getAuthoritativeIRLState(targetClient, targetDistributor, updatedEditRequest.audit_id || 'eng-101');
    await saveAuthoritativeIRLState(targetClient, targetDistributor, {
      ...current.state,
      isLocked: false,
      status: 'In Progress'
    });
  }

  // Audit log
  try {
    await supabase.from('system_audit_logs').insert({
      user_name: reviewedBy || 'APEX Auditor',
      user_email: 'auditor@data360.com',
      user_role: 'Auditor',
      organization: targetClient,
      action: action === 'APPROVED' ? 'IRL Edit Access Approved' : 'IRL Edit Access Rejected',
      ip_address: ipAddress || '127.0.0.1',
      details: `Edit access ${action.toLowerCase()} for request ${requestId} (${targetDistributor} / ${targetClient}). Comment: "${comment || 'None'}"`
    });
  } catch (e) {
    console.warn('Review action audit log note:', e);
  }

  return {
    requestId,
    status: action,
    isLocked: action === 'APPROVED' ? false : true
  };
}
