import { Request, Response } from 'express';
import { getSupabaseServerClient } from '../lib/supabaseServer.js';
import { getItemCompletionDetails } from '../utils/irlValidation.js';
import { 
  getAuthoritativeIRLState, 
  saveAuthoritativeIRLState,
  createAuthoritativeEditRequest,
  getAuthoritativeEditRequests,
  reviewAuthoritativeEditRequest
} from '../services/irlService.js';
import { dispatchNotification } from '../services/notificationService.js';

export const syncIrl = async (req: any, res: Response) => {
  try {
    // Authenticate and resolve
    const userRole = req.auth?.role || 'Auditor';
    const clientName = (req.query.client as string) || '';
    const distName = (req.query.distributor as string) || '';
    const auditId = (req.query.auditId as string) || 'eng-101';

    if (!clientName || !distName || !auditId) {
      return res.status(400).json({ success: false, error: 'Client, distributor, and auditId parameters are required.' });
    }

    // Basic authorization check
    if (userRole === 'Distributor' && req.auth?.organization !== distName) {
      return res.status(403).json({ success: false, error: 'Unauthorized to access another distributor workspace.' });
    }

    const authoritativeRecord = await getAuthoritativeIRLState(clientName, distName, auditId);
    return res.json({
      success: true,
      source: 'PostgreSQL (system_audit_logs/irl_submissions)',
      recordId: authoritativeRecord.recordId,
      state: authoritativeRecord.state,
      lastSync: authoritativeRecord.createdAt
    });
  } catch (err: any) {
    console.error('Error in GET /api/iir/sync:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const submitIrl = async (req: any, res: Response) => {
  try {
    const { client, distributor, auditId, requests, isLocked, submissionDate, submittedBy } = req.body;
    
    const resolvedAuditId = auditId || 'eng-101';
    const userRole = req.auth?.role || 'Auditor';

    if (!client || !distributor || !resolvedAuditId || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ success: false, error: 'Client, distributor, auditId, and requests array are required.' });
    }

    if (userRole === 'Distributor' && req.auth?.organization !== distributor) {
      return res.status(403).json({ success: false, error: 'Unauthorized to submit IRL for another distributor.' });
    }

    const incompleteRequirements: any[] = [];
    requests.forEach((item: any) => {
      const refNum = String(item.refNumber || item.id);
      const isMand = Boolean(item.isMandatory ?? item.is_mandatory ?? false);
      item.isMandatory = isMand;
      item.is_mandatory = isMand;
      const detail = getItemCompletionDetails(item);
      if (isMand && !detail.isComplete) {
        incompleteRequirements.push({
          refNumber: refNum,
          title: String(item.title || 'Requirement'),
          category: String(item.category || 'General'),
          isMandatory: true,
          reason: detail.reason || 'Requirement is incomplete.'
        });
      }
    });

    if (incompleteRequirements.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Submission rejected: ${incompleteRequirements.length} mandatory requirement(s) are incomplete.`,
        missingMandatoriesCount: incompleteRequirements.length,
        incompleteRequirements
      });
    }

    const finalSubmissionDate = submissionDate || new Date().toISOString().substring(0, 19).replace('T', ' ');
    const updatedRequests = requests.map((item: any) => ({
      ...item,
      status: item.reviewerStatus === 'Accepted' ? 'Accepted' : 'Submitted'
    }));

    const saved = await saveAuthoritativeIRLState(client, distributor, {
      client,
      distributor,
      auditId: resolvedAuditId,
      status: 'Submitted',
      isLocked: isLocked !== undefined ? isLocked : true,
      submissionDate: finalSubmissionDate,
      submittedBy: submittedBy || req.auth?.name || distributor,
      requests: updatedRequests
    }, resolvedAuditId);

    const supabase = getSupabaseServerClient();
    try {
      await supabase.from('system_audit_logs').insert({
        user_name: submittedBy || req.auth?.name || distributor,
        user_email: req.auth?.email || `${distributor.toLowerCase().replace(/\s+/g, '')}@data360.com`,
        user_role: userRole,
        organization: distributor,
        action: 'IRL Submitted',
        ip_address: req.ip || '127.0.0.1',
        details: `Final IRL submission lock engaged by ${distributor} for client ${client} under audit ${resolvedAuditId}. ${requests.length} items submitted (${saved.state.completionPercentage}% complete).`
      });

      await dispatchNotification({
        title: `IRL Submitted by ${distributor}`,
        message: `The Initial Information Request has been fully submitted and locked.`,
        category: 'Submission Completed',
        target_role: 'Auditor',
        metadata: { client, distributor, auditId: resolvedAuditId }
      });
    } catch (e) {
      console.warn('Failed to insert audit log or dispatch notification', e);
    }

    return res.json({
      success: true,
      savedAt: saved.savedAt,
      recordId: saved.recordId,
      completionPercentage: saved.state.completionPercentage
    });

  } catch (err: any) {
    console.error('Error in POST /api/iir/submit:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getEditRequests = async (req: any, res: Response) => {
  try {
    const clientName = (req.query.client as string) || '';
    const distName = (req.query.distributor as string) || '';
    // auditId not supported by getAuthoritativeEditRequests, but we filter if needed

    const requests = await getAuthoritativeEditRequests(clientName, distName);
    res.json({ success: true, requests });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const requestEdit = async (req: any, res: Response) => {
  try {
    const { client, distributor, auditId, itemRef, itemTitle, reason, requestedBy } = req.body;
    
    if (!client || !distributor || !auditId || !itemRef || !reason) {
      return res.status(400).json({ success: false, error: 'Missing required parameters (client, distributor, auditId, itemRef, reason).' });
    }

    if (req.auth?.role === 'Distributor' && req.auth?.organization !== distributor) {
       return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    const request = await createAuthoritativeEditRequest({
      client,
      distributor,
      auditId,
      affectedRequirements: [itemRef],
      reason,
      requestedBy: requestedBy || req.auth?.name || distributor
    });
    
    await dispatchNotification({
      title: 'IRL Edit Request',
      message: `${distributor} requested edit access for item ${itemRef}. Reason: "${reason}"`,
      category: 'System',
      target_role: 'Auditor',
      target_organization: client,
      metadata: { auditId, distributor, itemRef, action: 'request_edit' }
    });

    res.json({ success: true, request });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const approveEditRequest = async (req: any, res: Response) => {
  try {
    const { requestId, client, distributor, auditId, itemRef, approvedBy, note } = req.body;
    
    if (req.auth?.role === 'Distributor') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Only Auditors can approve edit requests.' });
    }

    if (!requestId || !client || !distributor || !auditId) {
      return res.status(400).json({ success: false, error: 'Missing required parameters.' });
    }

    const updated = await reviewAuthoritativeEditRequest({
      requestId,
      action: 'APPROVED',
      comment: note,
      reviewedBy: approvedBy || req.auth?.name || 'Auditor'
    });
    
    // Unlock the IRL state for this audit
    const current = await getAuthoritativeIRLState(client, distributor, auditId);
    await saveAuthoritativeIRLState(client, distributor, {
      ...current.state,
      isLocked: false,
      status: 'In Progress'
    }, auditId);

    await dispatchNotification({
       title: 'Edit Request Approved',
       message: `Auditor approved edit access for item ${itemRef || 'IRL'}. The submission is now unlocked.`,
       category: 'System',
       target_role: 'Distributor',
       target_organization: distributor,
       metadata: { auditId, client, action: 'approve_edit' }
    });

    res.json({ success: true, request: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const rejectEditRequest = async (req: any, res: Response) => {
  try {
    const { requestId, rejectedBy, note, distributor, client, auditId } = req.body;
    
    if (req.auth?.role === 'Distributor') {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    if (!requestId) return res.status(400).json({ success: false, error: 'Missing requestId.' });

    const updated = await reviewAuthoritativeEditRequest({
      requestId,
      action: 'REJECTED',
      comment: note,
      reviewedBy: rejectedBy || req.auth?.name || 'Auditor'
    });
    
    await dispatchNotification({
       title: 'Edit Request Rejected',
       message: `Auditor rejected edit access request. Note: "${note}"`,
       category: 'System',
       target_role: 'Distributor',
       target_organization: distributor,
       metadata: { auditId, client, action: 'reject_edit' }
    });

    res.json({ success: true, request: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
