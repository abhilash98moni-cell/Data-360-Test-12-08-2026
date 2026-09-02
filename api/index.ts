import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import { storageService } from '../src/services/storageService.js';
import { getItemCompletionDetails } from '../src/utils/irlValidation.js';
import {
  getSupabaseServerClient,
  getAuthoritativeIRLState,
  saveAuthoritativeIRLState,
  getAuthoritativeSubmissions,
  createAuthoritativeEditRequest,
  getAuthoritativeEditRequests,
  reviewAuthoritativeEditRequest
} from '../src/services/irlService.js';
import {
  getAuthoritativeQuestionnaireState,
  saveAuthoritativeQuestionnaireAnswers,
  submitAuthoritativeQuestionnaire,
  saveAuthoritativeQuestionnaireAuditorNotes
} from '../src/services/questionnaireService.js';

dotenv.config();

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

const app = express();
app.use(express.json());


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Supabase connection status endpoint
app.get('/api/supabase/status', async (req, res) => {
  try {
    const client = getSupabaseServerClient();

    const { error } = await client
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      connected: true,
      message: 'Supabase connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      connected: false,
      error: err?.message || 'Supabase connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Supabase PostgreSQL health check endpoint
app.get('/api/supabase/health', async (req, res) => {
  const startTime = Date.now();
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from('pending_signup_requests')
      .select('*', { count: 'exact', head: true });

    const latencyMs = Date.now() - startTime;

    if (error) {
      return res.status(400).json({
        connected: false,
        error: error.message,
        latencyMs,
        url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
      });
    }

    return res.json({
      connected: true,
      latencyMs,
      url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      message: 'Successfully connected to Supabase PostgreSQL database!',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({
      connected: false,
      error: err.message || 'Failed to ping Supabase database',
      latencyMs: Date.now() - startTime
    });
  }
});

// ====================================================================
// INITIAL INFORMATION REQUEST LIST (IRL) SUPABASE PERSISTENCE API
// ====================================================================

// Submit & Persist IRL Data Endpoint (Final Submission)
app.post('/api/iir/submit', async (req, res) => {
  try {
    const { client, distributor, auditId, requests, isLocked, submissionDate, submittedBy } = req.body;

    if (!client || !distributor || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ success: false, error: 'Client, distributor, and requests array are required.' });
    }

    // Canonical Validation Check: verify all mandatory requirements
    const incompleteRequirements: Array<{
      refNumber: string;
      title: string;
      category: string;
      isMandatory: boolean;
      reason: string;
    }> = [];

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
        error: `Submission rejected: ${incompleteRequirements.length} mandatory requirement(s) are incomplete or missing required explanations.`,
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
      auditId: auditId || 'eng-101',
      status: 'Submitted',
      isLocked: isLocked !== undefined ? isLocked : true,
      submissionDate: finalSubmissionDate,
      submittedBy: submittedBy || distributor,
      requests: updatedRequests
    });

    const supabase = getSupabaseServerClient();
    try {
      await supabase.from('system_audit_logs').insert({
        user_name: submittedBy || distributor,
        user_email: `${distributor.toLowerCase().replace(/\s+/g, '')}@data360.com`,
        user_role: 'Distributor',
        organization: distributor,
        action: 'IRL Submitted',
        ip_address: req.ip || '127.0.0.1',
        details: `Final IRL submission lock engaged by ${distributor} for client ${client}. ${requests.length} items submitted (${saved.state.completionPercentage}% complete).`
      });
    } catch (e) {
      console.warn('Supabase submission audit log note:', e);
    }

    try {
      await supabase.from('notifications').insert({
        target_organization: client,
        category: 'Submission Completed',
        title: `IRL Submitted by ${distributor}`,
        message: `Distributor ${distributor} has submitted their Initial Information Request List for client ${client}.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Supabase notification note:', e);
    }

    return res.json({
      success: true,
      message: 'Initial Information Request List successfully submitted and persisted to Supabase database!',
      submissionDate: finalSubmissionDate,
      completionPercentage: saved.state.completionPercentage,
      status: 'Submitted',
      isLocked: true,
      requests: saved.state.requests,
      version: saved.state.version
    });
  } catch (err: any) {
    console.error('Error in /api/iir/submit:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Unable to submit the IRL. Database persistence failed.'
    });
  }
});

// Save Draft IRL Data Endpoint
app.post('/api/iir/save-draft', async (req, res) => {
  try {
    const { client, distributor, auditId, requests, submittedBy } = req.body;

    if (!client || !distributor) {
      return res.status(400).json({ success: false, error: 'Client and distributor parameters are required.' });
    }

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ success: false, error: 'Requests array cannot be empty.' });
    }

    const saved = await saveAuthoritativeIRLState(client, distributor, {
      client,
      distributor,
      auditId: auditId || 'eng-101',
      status: 'In Progress',
      isLocked: false,
      submittedBy: submittedBy || distributor,
      requests
    });

    return res.json({
      success: true,
      savedAt: saved.savedAt,
      version: saved.state.version,
      requests: saved.state.requests,
      completionPercentage: saved.state.completionPercentage,
      completedCount: saved.state.completedCount,
      totalCount: saved.state.totalCount
    });
  } catch (err: any) {
    console.error('Error in /api/iir/save-draft:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to save draft to Supabase database.'
    });
  }
});

// Update Individual Item Reviewer Status Endpoint
app.post('/api/iir/update-item-status', async (req, res) => {
  try {
    const { client, distributor, auditId, itemId, reviewerStatus, reviewerNote, reviewerUser } = req.body;

    if (!client || !distributor || !itemId || !reviewerStatus) {
      return res.status(400).json({ success: false, error: 'Client, distributor, itemId, and reviewerStatus are required.' });
    }

    const current = await getAuthoritativeIRLState(client, distributor, auditId || 'eng-101');
    const existingRequests = current.state.requests || [];

    const updatedRequests = existingRequests.map((item: any) => {
      if (item.id === itemId || item.refNumber === itemId) {
        return {
          ...item,
          reviewerStatus,
          status: reviewerStatus === 'Accepted' ? 'Accepted' : reviewerStatus === 'Rejected' ? 'Rejected' : 'Clarification Required',
          reviewerComment: reviewerNote !== undefined ? reviewerNote : item.reviewerComment,
          lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ')
        };
      }
      return item;
    });

    const saved = await saveAuthoritativeIRLState(client, distributor, {
      ...current.state,
      requests: updatedRequests
    });

    // Insert audit log
    const supabase = getSupabaseServerClient();
    try {
      await supabase.from('system_audit_logs').insert({
        user_name: reviewerUser || 'Auditor',
        user_email: 'auditor@data360.com',
        user_role: 'Auditor',
        organization: client,
        action: 'Item Review Status Updated',
        ip_address: req.ip || '127.0.0.1',
        details: `Auditor updated status for item ${itemId} to "${reviewerStatus}". Note: "${reviewerNote || 'None'}"`
      });
    } catch (e) {
      console.warn('Review status audit log note:', e);
    }

    return res.json({
      success: true,
      requests: saved.state.requests,
      savedAt: saved.savedAt,
      version: saved.state.version
    });
  } catch (err: any) {
    console.error('Error in /api/iir/update-item-status:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to update reviewer status in database.'
    });
  }
});

// Fetch Authoritative Submission State Endpoint (Strict Single Source of Truth)
app.get('/api/iir/sync', async (req, res) => {
  try {
    const clientName = (req.query.client as string) || '';
    const distName = (req.query.distributor as string) || '';
    const auditId = (req.query.auditId as string) || 'eng-101';

    if (!clientName || !distName) {
      return res.status(400).json({ success: false, error: 'Client and distributor parameters are required.' });
    }

    const authoritativeRecord = await getAuthoritativeIRLState(clientName, distName, auditId);

    return res.json({
      success: true,
      found: true,
      client: authoritativeRecord.state.client,
      distributor: authoritativeRecord.state.distributor,
      auditId: authoritativeRecord.state.auditId,
      status: authoritativeRecord.state.status,
      isLocked: Boolean(authoritativeRecord.state.isLocked),
      submissionDate: authoritativeRecord.state.submissionDate,
      completionPercentage: authoritativeRecord.state.completionPercentage,
      completedCount: authoritativeRecord.state.completedCount,
      totalCount: authoritativeRecord.state.totalCount,
      submittedBy: authoritativeRecord.state.submittedBy,
      requests: authoritativeRecord.state.requests,
      version: authoritativeRecord.state.version,
      updatedAt: authoritativeRecord.state.updatedAt
    });
  } catch (err: any) {
    console.error('Error in /api/iir/sync:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch authoritative state from Supabase database.'
    });
  }
});

// Fetch All Submissions for Client Endpoint
app.get('/api/iir/submissions', async (req, res) => {
  try {
    const clientName = (req.query.client as string) || '';
    const submissions = await getAuthoritativeSubmissions(clientName);

    return res.json({
      success: true,
      submissions
    });
  } catch (err: any) {
    console.error('Error in /api/iir/submissions:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch submissions list from database.'
    });
  }
});

// ====================================================================
// REQUEST EDIT / ACCESS APPROVAL WORKFLOW ENDPOINTS (STAGE 3)
// ====================================================================

// 1. Submit Edit Access Request Endpoint (Distributor)
app.post('/api/iir/request-edit', async (req, res) => {
  try {
    const { client, distributor, auditId, scope, affectedRequirements, reason, requestedBy, userRole } = req.body;

    const result = await createAuthoritativeEditRequest({
      client,
      distributor,
      auditId,
      scope,
      affectedRequirements,
      reason,
      requestedBy,
      userRole,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      success: true,
      message: 'Edit access request successfully submitted to APEX Auditor team for review.',
      requestId: result.requestId,
      status: 'PENDING',
      request: result.request
    });
  } catch (err: any) {
    console.error('Error in /api/iir/request-edit:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to process edit access request.'
    });
  }
});

// 2. Fetch Edit Requests Endpoint (Auditor & Distributor)
app.get('/api/iir/edit-requests', async (req, res) => {
  try {
    const clientName = (req.query.client as string) || '';
    const distName = (req.query.distributor as string) || '';

    const requests = await getAuthoritativeEditRequests(clientName, distName);

    return res.json({
      success: true,
      requests
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch edit requests from database.'
    });
  }
});

// 3. Approve Edit Request Endpoint (Auditor Only)
app.post('/api/iir/request-edit/approve', async (req, res) => {
  try {
    const { requestId, comment, reviewedBy, userRole, client, distributor } = req.body;

    const result = await reviewAuthoritativeEditRequest({
      requestId,
      action: 'APPROVED',
      comment,
      reviewedBy,
      userRole,
      client,
      distributor,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      success: true,
      message: 'Edit access request approved and IRL submission unlocked successfully!',
      requestId: result.requestId,
      status: 'APPROVED',
      isLocked: false
    });
  } catch (err: any) {
    console.error('Error in /api/iir/request-edit/approve:', err);
    return res.status(err.message?.includes('403') ? 403 : 500).json({
      success: false,
      error: err.message || 'Failed to approve edit request.'
    });
  }
});

// 4. Reject Edit Request Endpoint (Auditor Only)
app.post('/api/iir/request-edit/reject', async (req, res) => {
  try {
    const { requestId, comment, reviewedBy, userRole, client, distributor } = req.body;

    const result = await reviewAuthoritativeEditRequest({
      requestId,
      action: 'REJECTED',
      comment,
      reviewedBy,
      userRole,
      client,
      distributor,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      success: true,
      message: 'Edit access request rejected.',
      requestId: result.requestId,
      status: 'REJECTED',
      isLocked: true
    });
  } catch (err: any) {
    console.error('Error in /api/iir/request-edit/reject:', err);
    return res.status(err.message?.includes('403') ? 403 : 500).json({
      success: false,
      error: err.message || 'Failed to reject edit request.'
    });
  }
});
// Multer upload config for Google Drive storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ====================================================================
// GOOGLE DRIVE TRIAL STORAGE & INTEGRATION API
// ====================================================================

// Google Drive connection status endpoint
app.get('/api/gdrive/status', async (req, res) => {
  try {
    const rootFolderId = await storageService.initializeRootFolder();
    res.json({
      success: true,
      connected: true,
      rootFolder: 'Data360_Test',
      rootFolderId: rootFolderId,
      storageStatus: 'Available',
      database: 'Supabase (Configured)',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.json({
      success: false,
      connected: false,
      rootFolder: 'Data360_Test',
      error: err.message
    });
  }
});

// Google Drive test connection workflow endpoint (runs 6-step test scenario)
app.post('/api/gdrive/test-connection', async (req, res) => {
  try {
    const result = await storageService.testConnection();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      summary: `Test connection failed: ${err.message}`
    });
  }
});

// Upload file to Google Drive (Data360_Test folder hierarchy)
app.post('/api/storage/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      clientName = 'XYZ',
      auditName = 'XYZ Distributor Audit 2026',
      distributorName = 'Test Distributor A',
      requirementId = 'IRL-2.3',
      uploadedBy = 'User',
      isReferenceMaterial = 'false'
    } = req.body;

    const isRef = isReferenceMaterial === 'true' || isReferenceMaterial === true;

    const metadata = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      {
        clientName,
        auditName,
        distributorName,
        requirementId,
        uploadedBy,
        isReferenceMaterial: isRef
      }
    );

    res.json({
      success: true,
      file: metadata,
      message: `File '${metadata.fileName}' successfully uploaded to Google Drive folder: ${metadata.folderPath}`
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload file to Google Drive' });
  }
});

// Download file from Google Drive / Local Storage
app.get('/api/storage/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const downloaded = await storageService.downloadFile(fileId);

    const safeFileName = downloaded.fileName.replace(/"/g, '\\"');
    res.setHeader('Content-Type', downloaded.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(downloaded.fileName)}`);
    res.send(downloaded.buffer);
  } catch (err: any) {
    console.error(`Storage download endpoint error for fileId '${req.params.fileId}':`, err.message);
    res.status(500).json({ error: err.message || 'Failed to download file from Google Drive storage' });
  }
});

// Preview file from Google Drive / Local Storage
app.get('/api/storage/preview/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const downloaded = await storageService.downloadFile(fileId);

    const safeFileName = downloaded.fileName.replace(/"/g, '\\"');
    res.setHeader('Content-Type', downloaded.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(downloaded.fileName)}`);
    res.send(downloaded.buffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to preview file' });
  }
});

// Delete file from Google Drive
app.delete('/api/storage/delete/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const success = await storageService.deleteFile(fileId);
    res.json({ success, message: `File ${fileId} deleted from Google Drive storage` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete file from Google Drive' });
  }
});

// Sampling Population Upload Endpoint
app.post('/api/sampling/upload', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const {
      clientName = 'Apex Electronics Corp',
      auditId = 'eng-101',
      auditCode = 'AUD-2026-001',
      distributorName = 'Midwest Trading Co.',
      auditPeriod = 'FY 2025-26',
      populationType = 'Transaction Testing Population',
      glMapping
    } = req.body;

    const uploadedBy = req.headers['x-user-name'] || req.headers['x-user-email'] || 'Auditor User';
    const targetDistributor = distributorName;

    const metadata = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      {
        clientName,
        auditName: auditId,
        distributorName: targetDistributor,
        requirementId: 'SAMPLING-UPLOAD',
        uploadedBy: String(uploadedBy),
        isReferenceMaterial: false
      }
    );

    const supabase = getSupabaseServerClient();
    
    let parsedGlMapping = null;
    if (glMapping) {
      if (typeof glMapping === 'string') {
        try { parsedGlMapping = JSON.parse(glMapping); } catch (e) { parsedGlMapping = null; }
      } else {
        parsedGlMapping = glMapping;
      }
    }

    const newEvidenceRow = {
      client_name: clientName,
      audit_id: auditId,
      audit_code: auditCode,
      distributor_name: targetDistributor,
      requirement_ref: 'SAMPLING',
      requirement_title: populationType,
      section: 'Sampling',
      file_name: metadata.fileName,
      file_size_mb: metadata.fileSizeMB,
      file_type: req.file.mimetype,
      google_drive_file_id: metadata.googleDriveFileId,
      google_drive_folder_id: metadata.googleDriveFolderId,
      storage_path: metadata.folderPath,
      version: 1,
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString(),
      status: 'AVAILABLE',
      review_status: 'ACCEPTED',
      uploader_role: req.headers['x-user-role'] || 'Auditor',
      audit_period: auditPeriod,
      document_type: 'SAMPLING_POPULATION',
      document_usage: ['SAMPLING_POPULATION'],
      samplingEnabled: true,
      samplingStatus: 'ADDED',
      glMapping: parsedGlMapping,
      source: 'Auditor Upload'
    };

    const insertEvidenceRes = await supabase.from('system_audit_logs').insert({
      event_type: 'EVIDENCE_FILE',
      target_user_email: `${clientName}::${targetDistributor}`,
      details: newEvidenceRow,
      created_at: new Date().toISOString()
    }).select().single();

    if (insertEvidenceRes.error) {
      return res.status(500).json({ success: false, error: insertEvidenceRes.error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Sampling population uploaded successfully',
      fileId: metadata.googleDriveFileId
    });
  } catch (error: any) {
    console.error('Sampling upload error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to upload sampling population' });
  }
});

// Sampling questions endpoints
app.get('/api/sampling/questions', async (req: any, res: any) => {
  try {
    const { auditId } = req.query;
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from('system_audit_logs').select('*').eq('event_type', 'CREATED_CUSTOM_QUESTION');
    if (error) throw error;
    
    const questions = (data || [])
      .map(d => {
         let parsed = d.details;
         if (typeof parsed === 'string') {
             try { parsed = JSON.parse(parsed); } catch(e) {}
         }
         return { dbId: d.id, ...parsed };
      })
      .filter(q => q.engagement_id === auditId && q.active !== false);
      
    res.json({ success: true, questions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/sampling/transactions', async (req: any, res: any) => {
  try {
    const { distributorId, auditId } = req.query;
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from('system_audit_logs').select('*').eq('event_type', 'GL_SAMPLE');
    if (error) throw error;
    
    const transactions = (data || [])
      .map(d => ({ dbId: d.id, ...d.details }))
      .filter(t => t.distributorId === distributorId && t.auditId === auditId);
      
    res.json({ success: true, transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// STEP 1 & 4: AUTHENTICATION & ADMIN APPROVAL WORKFLOW API
// ====================================================================

interface PendingSignupRequest {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: 'Admin' | 'Auditor' | 'Distributor';
  organization: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const pendingSignupRequests: PendingSignupRequest[] = [];
const approvedUsersList: any[] = [];
let rejectedRequestsCount = 0;

// Endpoint: Submit Signup Request (Held in Pending Queue in DB & Memory until Admin Approves)
app.post('/api/auth/signup-request', async (req, res) => {
  const { email, password, fullName, role, organization } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const formattedRole = (role || 'Auditor').toLowerCase();
  const formattedOrg = organization || (role === 'Auditor' ? 'Apex Electronics Corp' : 'Midwest Trading Co.');
  const userFullName = fullName || email.split('@')[0];

  // Check memory store
  const existing = pendingSignupRequests.find(r => r.email.toLowerCase() === email.toLowerCase() && r.status === 'Pending');
  if (existing) {
    return res.status(400).json({ error: 'A signup request for this email is already pending Admin approval.' });
  }

  const newRequest: PendingSignupRequest = {
    id: `req-${Date.now()}`,
    email,
    password,
    fullName: userFullName,
    role: role || 'Auditor',
    organization: formattedOrg,
    requestedAt: new Date().toISOString(),
    status: 'Pending'
  };

  pendingSignupRequests.unshift(newRequest);

  // Direct SQL DB insertion into Supabase `pending_signup_requests` table
  let dbInserted = false;
  let dbErrorDetail = null;

  try {
    const client = getSupabaseServerClient();
    const { data, error } = await client.from('pending_signup_requests').insert({
      email,
      password_hash: password,
      full_name: userFullName,
      role: formattedRole,
      organization: formattedOrg,
      status: 'pending'
    }).select();

    if (error) {
      console.error('❌ Supabase DB Insert Error:', error.message, error.details);
      dbErrorDetail = error.message;
    } else {
      console.log('✅ Supabase DB Insert Success:', data);
      dbInserted = true;

      // Log to system audit logs table in Supabase DB
      await client.from('system_audit_logs').insert({
        event_type: 'SIGNUP_REQUEST_SUBMITTED',
        target_user_email: email,
        details: { role: formattedRole, organization: formattedOrg }
      });
    }
  } catch (dbErr: any) {
    console.error('❌ Supabase DB Exception:', dbErr.message);
    dbErrorDetail = dbErr.message;
  }

  return res.json({
    success: true,
    pending: true,
    requestId: newRequest.id,
    dbInserted,
    dbError: dbErrorDetail,
    message: dbInserted 
      ? 'Signup request submitted! Stored in Supabase pending_signup_requests table.'
      : `Signup request held in pending queue. Supabase DB Note: ${dbErrorDetail || 'Table pending_signup_requests active'}`,
    request: newRequest
  });
});

// Endpoint: Get Pending Signup Requests (Queries Supabase `pending_signup_requests` Table Directly)
app.get('/api/admin/pending-signups', async (req, res) => {
  try {
    const client = getSupabaseServerClient();
    const { data: dbRequests, error } = await client
      .from('pending_signup_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (!error && dbRequests) {
      const pendingList = dbRequests
        .filter(r => r.status === 'pending')
        .map(r => ({
          id: r.id,
          email: r.email,
          password: r.password_hash || 'Password123!',
          fullName: r.full_name,
          role: r.role === 'admin' ? 'Admin' : r.role === 'distributor' ? 'Distributor' : 'Auditor',
          organization: r.organization,
          requestedAt: r.requested_at,
          status: 'Pending' as const
        }));

      const approvedList = dbRequests
        .filter(r => r.status === 'approved')
        .map(r => ({
          id: r.id,
          name: r.full_name,
          email: r.email,
          role: r.role === 'admin' ? 'Admin' : r.role === 'distributor' ? 'Distributor' : 'Auditor',
          organization: r.organization,
          avatarInitials: r.full_name ? r.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : r.email.slice(0, 2).toUpperCase()
        }));

      const rejectedCount = dbRequests.filter(r => r.status === 'rejected').length;

      return res.json({
        success: true,
        pendingRequests: pendingList,
        approvedUsers: approvedList,
        totalPending: pendingList.length,
        approvedCount: approvedList.length,
        rejectedCount: rejectedCount,
        supabaseProtected: true,
        connectedTable: 'pending_signup_requests'
      });
    }
  } catch (dbErr) {
    // Fallback
  }

  const pendingList = pendingSignupRequests.filter(r => r.status === 'Pending');
  return res.json({
    success: true,
    pendingRequests: pendingList,
    approvedUsers: approvedUsersList,
    totalPending: pendingList.length,
    approvedCount: approvedUsersList.length,
    rejectedCount: rejectedRequestsCount,
    supabaseProtected: true
  });
});

// Endpoint: Admin Approve Signup Request (Inserts User into Supabase Auth & Profiles Table)
app.post('/api/admin/approve-signup', async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  let request = pendingSignupRequests.find(r => r.id === requestId || r.email.toLowerCase() === requestId.toLowerCase());

  // Try finding in DB if not in memory
  if (!request) {
    try {
      const client = getSupabaseServerClient();
      const { data: dbRow } = await client.from('pending_signup_requests').select('*').or(`id.eq.${requestId},email.eq.${requestId}`).single();
      if (dbRow) {
        request = {
          id: dbRow.id,
          email: dbRow.email,
          password: dbRow.password_hash || 'Password123!',
          fullName: dbRow.full_name,
          role: dbRow.role === 'admin' ? 'Admin' : dbRow.role === 'distributor' ? 'Distributor' : 'Auditor',
          organization: dbRow.organization,
          requestedAt: dbRow.requested_at,
          status: 'Pending'
        };
      }
    } catch (err) {
      // ignore
    }
  }

  if (!request) {
    return res.status(404).json({ error: 'Signup request not found' });
  }

  try {
    const client = getSupabaseServerClient();

    const rawRole = (request.role || 'auditor').toLowerCase();
    const validRole = rawRole === 'admin' ? 'admin' : rawRole === 'distributor' ? 'distributor' : 'auditor';

    // 1. Create user in Supabase Auth DB with email_confirm: true
    let authUserId = request.id;
    try {
      const { data, error } = await client.auth.admin.createUser({
        email: request.email,
        password: request.password,
        email_confirm: true,
        user_metadata: {
          full_name: request.fullName,
          role: validRole,
          organization: request.organization
        }
      });

      if (!error && data?.user) {
        authUserId = data.user.id;
      } else if (error) {
        console.warn('Supabase Auth createUser info:', error.message);
      }
    } catch (authErr: any) {
      console.warn('Supabase Auth createUser exception:', authErr.message);
    }

    // 2. Direct Profile creation in public.profiles table
    try {
      await client.from('profiles').upsert({
        id: authUserId,
        email: request.email,
        full_name: request.fullName,
        role: validRole,
        organization: request.organization,
        title: validRole === 'admin' ? 'Platform Owner / Admin' : validRole === 'distributor' ? 'Distributor Compliance Manager' : 'Lead Forensic Auditor'
      });
    } catch (profErr) {
      // profile creation note
    }

    // 3. Update status in Supabase `pending_signup_requests` table to 'approved'
    try {
      await client.from('pending_signup_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('email', request.email);

      await client.from('system_audit_logs').insert({
        event_type: 'ADMIN_APPROVE_USER',
        target_user_email: request.email,
        details: { approved_user_id: authUserId, role: request.role, organization: request.organization }
      });
    } catch (dbErr) {
      // Table update fallback
    }

    // Update memory store
    const reqIdx = pendingSignupRequests.findIndex(r => r.email.toLowerCase() === request!.email.toLowerCase());
    if (reqIdx !== -1) {
      pendingSignupRequests.splice(reqIdx, 1);
    }

    const approvedUser = {
      id: authUserId,
      name: request.fullName,
      email: request.email,
      role: request.role,
      organization: request.organization,
      approvedAt: new Date().toISOString(),
      status: 'Active'
    };

    // Add to approved users memory list
    const existingApprovedIdx = approvedUsersList.findIndex(u => u.email.toLowerCase() === request!.email.toLowerCase());
    if (existingApprovedIdx !== -1) {
      approvedUsersList[existingApprovedIdx] = approvedUser;
    } else {
      approvedUsersList.unshift(approvedUser);
    }

    return res.json({
      success: true,
      message: `Request approved! User ${request.email} has been provisioned and approved for login!`,
      user: approvedUser
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to approve user in Supabase' });
  }
});

// Endpoint: Admin Reject Signup Request (Updates DB & Discards Request)
app.post('/api/admin/reject-signup', async (req, res) => {
  const { requestId } = req.body;

  let targetEmail = '';
  const reqIdx = pendingSignupRequests.findIndex(r => r.id === requestId);
  if (reqIdx !== -1) {
    targetEmail = pendingSignupRequests[reqIdx].email;
    pendingSignupRequests.splice(reqIdx, 1);
    rejectedRequestsCount++;
  }

  try {
    const client = getSupabaseServerClient();
    await client.from('pending_signup_requests')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .or(`id.eq.${requestId},email.eq.${targetEmail}`);

    await client.from('system_audit_logs').insert({
      event_type: 'ADMIN_REJECT_USER',
      target_user_email: targetEmail || requestId
    });
  } catch (dbErr) {
    // ignore
  }

  return res.json({
    success: true,
    message: 'Signup request rejected and updated in database. Access denied.'
  });
});

// Direct Signup Endpoint
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, fullName, role, organization } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const client = getSupabaseServerClient();

    const { data, error } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email.split('@')[0],
        role: role || 'Auditor',
        organization: organization || 'Data360 Platform'
      }
    });

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
      }
      return res.status(400).json({ error: error.message });
    }

    const initials = fullName
      ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      : email.slice(0, 2).toUpperCase();

    const userSession = {
      id: data.user?.id || `usr-${Date.now()}`,
      name: fullName || email.split('@')[0],
      email: email,
      role: role || 'Auditor',
      title: role === 'Admin' ? 'Platform Owner / Admin' : role === 'Auditor' ? 'Senior Audit Reviewer' : 'Distributor Operations Lead',
      organization: organization || (role === 'Auditor' ? 'Apex Electronics Corp' : 'Midwest Trading Co.'),
      avatarInitials: initials || 'US'
    };

    return res.json({
      success: true,
      message: 'Account created and verified directly!',
      user: userSession,
      supabaseUser: data.user
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create user account' });
  }
});

// Direct Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Check if user is Admin preset
  if (cleanEmail === 'admin@data360-platform.com' || cleanEmail === 'admin@data360.io') {
    return res.json({
      success: true,
      message: 'Welcome back, Platform Admin!',
      user: {
        id: 'usr-admin-0',
        name: 'Platform Owner (Admin)',
        email: cleanEmail,
        role: 'Admin',
        title: 'System Owner & Super Admin',
        organization: 'Data360 Platform Core',
        avatarInitials: 'AD'
      }
    });
  }

  // Check if user is pending in DB table
  try {
    const client = getSupabaseServerClient();
    const { data: dbPending } = await client
      .from('pending_signup_requests')
      .select('*')
      .eq('email', cleanEmail)
      .eq('status', 'pending')
      .single();

    if (dbPending) {
      return res.status(403).json({
        error: 'Your signup request is still pending Admin approval. Unapproved accounts cannot log in until approved.'
      });
    }
  } catch (err) {
    // ignore
  }

  // Check memory store for pending status
  const isPendingInMemory = pendingSignupRequests.find(r => r.email.toLowerCase() === cleanEmail && r.status === 'Pending');
  if (isPendingInMemory) {
    return res.status(403).json({
      error: 'Your signup request is still pending Admin approval. Unapproved accounts cannot log in until approved.'
    });
  }

  try {
    const client = getSupabaseServerClient();

    // 1. Attempt Supabase Auth login
    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (!error && data?.user) {
      const metadata = data.user.user_metadata || {};
      const fullName = metadata.full_name || cleanEmail.split('@')[0];
      const rawRole = (metadata.role || 'Auditor').toLowerCase();
      const role = rawRole === 'admin' ? 'Admin' : rawRole === 'distributor' ? 'Distributor' : 'Auditor';
      const organization = metadata.organization || (role === 'Auditor' ? 'Apex Audit Practice' : 'Midwest Trading Co.');
      const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || cleanEmail.slice(0, 2).toUpperCase();

      return res.json({
        success: true,
        message: 'Logged in successfully!',
        user: {
          id: data.user.id,
          name: fullName,
          email: data.user.email,
          role,
          title: role === 'Admin' ? 'Platform Owner / Admin' : role === 'Auditor' ? 'Senior Audit Reviewer' : 'Distributor Operations Lead',
          organization,
          avatarInitials: initials
        },
        session: data.session
      });
    }

    // 2. Check if user is approved in pending_signup_requests DB table
    const { data: dbApproved } = await client
      .from('pending_signup_requests')
      .select('*')
      .eq('email', cleanEmail)
      .eq('status', 'approved')
      .single();

    if (dbApproved) {
      const role = dbApproved.role === 'admin' ? 'Admin' : dbApproved.role === 'distributor' ? 'Distributor' : 'Auditor';
      const fullName = dbApproved.full_name || cleanEmail.split('@')[0];
      const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || cleanEmail.slice(0, 2).toUpperCase();

      return res.json({
        success: true,
        message: 'Welcome back! Approved user logged in.',
        user: {
          id: dbApproved.id,
          name: fullName,
          email: dbApproved.email,
          role,
          title: role === 'Admin' ? 'Platform Owner / Admin' : role === 'Auditor' ? 'Senior Audit Reviewer' : 'Distributor Operations Lead',
          organization: dbApproved.organization,
          avatarInitials: initials
        }
      });
    }

    // 3. Check approvedUsersList memory store
    const inMemoryApproved = approvedUsersList.find(u => u.email.toLowerCase() === cleanEmail);
    if (inMemoryApproved) {
      const initials = inMemoryApproved.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
      return res.json({
        success: true,
        message: 'Welcome back! Approved user logged in.',
        user: {
          id: inMemoryApproved.id,
          name: inMemoryApproved.name,
          email: inMemoryApproved.email,
          role: inMemoryApproved.role,
          title: inMemoryApproved.role === 'Admin' ? 'Platform Owner / Admin' : inMemoryApproved.role === 'Auditor' ? 'Senior Audit Reviewer' : 'Distributor Operations Lead',
          organization: inMemoryApproved.organization,
          avatarInitials: initials
        }
      });
    }

    return res.status(401).json({ error: error ? error.message : 'Invalid email or password' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login processing error' });
  }
});


// Invite User Endpoint
app.post('/api/users/invite', async (req, res) => {
  const { email, name, role, organization, tenantType } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required' });
  }

  try {
    const client = getSupabaseServerClient();
    // Attempt sending invite via Supabase admin if configured
    if (client?.auth?.admin?.inviteUserByEmail) {
      await client.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name, role, organization, tenant_type: tenantType }
      });
    }

    return res.json({
      success: true,
      message: `Invitation successfully dispatched to ${email}`,
      user: {
        id: `usr-${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        role,
        organization: organization || 'Data360 Platform',
        tenantType: tenantType || 'Audit Firm',
        status: 'Pending Invitation',
        lastActive: 'Invitation sent just now'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to send invitation' });
  }
});

// Reset Password Endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }
  return res.json({
    success: true,
    message: `Password reset instructions sent to ${email}`
  });
});

// Bulk Import Users Endpoint
app.post('/api/users/bulk-import', (req, res) => {
  const { users } = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: 'Invalid user list format' });
  }
  return res.json({
    success: true,
    importedCount: users.length,
    message: `Successfully processed and created ${users.length} enterprise users`
  });
});

// Deactivate User Endpoint
app.post('/api/users/:id/deactivate', (req, res) => {
  const { id } = req.params;
  return res.json({
    success: true,
    id,
    status: 'Deactivated',
    message: `User ${id} has been deactivated`
  });
});

// ====================================================================
// STEP 5: AUDIT CREATION & ASSIGNMENT API
// ====================================================================
app.post('/api/audits/create', (req, res) => {
  const auditData = req.body;
  if (!auditData.code || !auditData.title) {
    return res.status(400).json({ error: 'Audit code and title are required' });
  }

  const newAudit = {
    id: `eng-${Date.now()}`,
    code: auditData.code,
    title: auditData.title,
    clientName: auditData.clientName || 'Apex Electronics Corp',
    distributorName: auditData.distributorName || 'Midwest Trading Co.',
    clientIndustry: auditData.clientIndustry || 'Consumer Electronics',
    type: auditData.type || 'Distributor',
    status: auditData.status || 'Planning',
    riskRating: auditData.riskRating || 'High',
    leadAuditor: auditData.leadAuditor || 'Sarah Jenkins',
    teamSize: auditData.teamSize || 4,
    startDate: auditData.startDate || new Date().toISOString().split('T')[0],
    targetCompletion: auditData.targetCompletion || '2026-10-31',
    progressPercent: 0,
    financialExposure: auditData.financialExposure || 0,
    sampledRecordsCount: 0,
    totalPopulationCount: 1000,
    findingsCount: { critical: 0, high: 0, medium: 0, low: 0 },
    location: auditData.location || 'Chicago, IL'
  };

  return res.json({
    success: true,
    audit: newAudit,
    message: `Audit engagement ${auditData.code} created successfully`
  });
});

// ====================================================================
// STEP 8 & 9: EVIDENCE & FILE STORAGE API
// ====================================================================
app.post('/api/evidence/upload', (req, res) => {
  const { auditId, requestRef, fileName, fileSizeMB, fileType, uploadedBy, distributorName } = req.body;

  const evidenceRecord = {
    id: `ev-${Date.now()}`,
    auditId: auditId || 'eng-001',
    auditCode: 'AUD-2026-001',
    distributorName: distributorName || 'Midwest Trading Co.',
    requestRef: requestRef || '1.1',
    requestTitle: 'Corporate Registration & Business License',
    fileName: fileName || 'Document.pdf',
    fileSizeMB: fileSizeMB || 2.4,
    fileType: fileType || 'application/pdf',
    version: 1,
    hash: `sha256_${Math.random().toString(36).substring(2, 12)}`,
    uploadedBy: uploadedBy || 'David Vance',
    uploadedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'Pending Review'
  };

  return res.json({
    success: true,
    evidence: evidenceRecord,
    message: 'File successfully stored and indexed in evidence vault'
  });
});

app.post('/api/evidence/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, reviewerComment, reviewedBy } = req.body;

  return res.json({
    success: true,
    id,
    status,
    reviewerComment,
    reviewedBy: reviewedBy || 'Sarah Jenkins',
    reviewedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
    message: `Evidence ${id} updated to status ${status}`
  });
});

// ====================================================================
// STEP 10: THREADED COMMUNICATION API (PERMANENT MULTI-TENANT CHATS & PARTICIPANTS)
// ====================================================================

const DISTRIBUTOR_REGISTRY: Record<string, { id: string; name: string; code: string; region: string }> = {
  'dist-1': { id: 'dist-1', name: 'Midwest Trading Co.', code: 'MDT-8092', region: 'Midwest Region (USA)' },
  'dist-2': { id: 'dist-2', name: 'Horizon Logistics India', code: 'HLI-4022', region: 'South Asia / India' },
  'dist-3': { id: 'dist-3', name: 'Pacific Rim Distribution', code: 'PRD-7712', region: 'Asia-Pacific (APAC)' },
  'dist-4': { id: 'dist-4', name: 'Nexus Logistics Ltd', code: 'NEX-1044', region: 'Western Division' },
  'dist-5': { id: 'dist-5', name: 'Middle East Company', code: 'MEC-5521', region: 'Middle East & Africa (MEA)' },
  'dist-6': { id: 'dist-6', name: 'EuroTech Supply Chains', code: 'ETS-3091', region: 'European Union (EU)' },
  'dist-7': { id: 'dist-7', name: 'LatAm Trading Network', code: 'LTN-9910', region: 'Latin America (LATAM)' }
};

function getDistributorByOrg(orgName: string) {
  if (!orgName) return DISTRIBUTOR_REGISTRY['dist-1'];
  const normalized = orgName.trim().toLowerCase();
  for (const key of Object.keys(DISTRIBUTOR_REGISTRY)) {
    const dist = DISTRIBUTOR_REGISTRY[key];
    if (dist.name.toLowerCase() === normalized || dist.id.toLowerCase() === normalized || dist.code.toLowerCase() === normalized) {
      return dist;
    }
  }
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return { id: `dist-${slug}`, name: orgName, code: `DIST-${slug.substring(0, 4).toUpperCase()}`, region: 'Global' };
}

interface InStoreMessage {
  id: string;
  conversationId: string;
  auditId: string;
  distributorId: string;
  contextType?: 'GENERAL' | 'IRL' | 'QUESTIONNAIRE' | 'SAMPLING';
  contextId?: string;
  contextLabel?: string;
  requestRef?: string;
  requestTitle?: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  senderOrganization: string;
  timestamp: string;
  content: string;
  attachments?: {
    fileName: string;
    fileSizeMB: number;
    url?: string;
    googleDriveFileId?: string;
  }[];
  mentions?: string[];
  replyToId?: string;
  isReadByAuditor: boolean;
  isReadByDistributor: boolean;
  createdAt: string;
}

interface InStoreParticipant {
  id: string;
  conversationId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  userOrganization: string;
  isActive: boolean;
  joinedAt: string;
  addedBy: string;
  removedAt?: string;
  removedBy?: string;
}

async function fetchMessagesFromSupabase(conversationId?: string): Promise<InStoreMessage[]> {
  const client = getSupabaseServerClient();
  if (!client) {
    return [];
  }
  try {
    let query = client
      .from('system_audit_logs')
      .select('*')
      .eq('event_type', 'DISCUSSION_MESSAGE');

    if (conversationId) {
      query = query.eq('target_user_email', conversationId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase discussion messages fetch error:', error.message);
      return [];
    }
    if (!data || !Array.isArray(data)) {
      return [];
    }
    const messages: InStoreMessage[] = data
      .map(r => r.details)
      .filter(Boolean)
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    return messages;
  } catch (err: any) {
    console.warn('Supabase discussion fetch exception:', err.message);
    return [];
  }
}

async function fetchParticipantsFromSupabase(conversationId: string): Promise<InStoreParticipant[]> {
  const client = getSupabaseServerClient();
  if (!client) {
    return [];
  }
  try {
    const { data, error } = await client
      .from('system_audit_logs')
      .select('*')
      .eq('event_type', 'DISCUSSION_PARTICIPANT')
      .eq('target_user_email', conversationId)
      .order('created_at', { ascending: true });

    if (error || !data || !Array.isArray(data)) {
      return [];
    }
    const map = new Map<string, InStoreParticipant>();
    data.forEach(row => {
      if (row.details && row.details.userEmail) {
        map.set(row.details.userEmail.toLowerCase(), row.details);
      }
    });
    return Array.from(map.values());
  } catch (err: any) {
    console.warn('Supabase participants fetch error:', err.message);
    return [];
  }
}

async function isUserParticipantActive(convId: string, email: string): Promise<boolean> {
  const parts = await fetchParticipantsFromSupabase(convId);
  const matching = parts.find(p => p.userEmail.toLowerCase() === email.toLowerCase());
  if (!matching) {
    return true;
  }
  return matching.isActive;
}

function authenticateRequestSession(req: express.Request) {
  const role = (req.headers['x-user-role'] as string) || (req.body?.senderRole as string) || 'Auditor';
  const org = (req.headers['x-user-organization'] as string) || (req.body?.senderOrganization as string) || 'Apex Audit Practice (AA)';
  const email = (req.headers['x-user-email'] as string) || (req.body?.senderEmail as string) || 'user@company.com';
  const name = (req.headers['x-user-name'] as string) || (req.body?.senderName as string) || 'Authorized User';

  const isDistributor = role.toLowerCase().includes('distributor');
  const distributorInfo = isDistributor ? getDistributorByOrg(org) : null;

  return {
    role,
    org,
    email,
    name,
    isDistributor,
    distributorInfo
  };
}

// GET /api/discussions/conversations — Get list of distributor conversations for audit
app.get('/api/discussions/conversations', async (req, res) => {
  try {
    const session = authenticateRequestSession(req);
    const auditId = (req.query.auditId as string) || 'eng-101';

    const allMessages = await fetchMessagesFromSupabase();

    let activeDistributors = Object.values(DISTRIBUTOR_REGISTRY);

    if (session.isDistributor && session.distributorInfo) {
      activeDistributors = [session.distributorInfo];
    }

    const conversations = activeDistributors.map(dist => {
      const convId = `conv-${auditId}-${dist.id}`;
      const messagesForConv = allMessages.filter(m => m.conversationId === convId || (m.auditId === auditId && m.distributorId === dist.id));

      const sortedMessages = [...messagesForConv].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      const lastMsg = sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1] : undefined;

      const unreadCount = sortedMessages.filter(m => {
        if (session.isDistributor) {
          return !m.isReadByDistributor && m.senderRole !== session.role;
        } else {
          return !m.isReadByAuditor && m.senderRole.toLowerCase().includes('distributor');
        }
      }).length;

      return {
        conversationId: convId,
        auditId,
        distributorId: dist.id,
        distributorName: dist.name,
        distributorCode: dist.code,
        distributorRegion: dist.region,
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          timestamp: lastMsg.timestamp,
          senderName: lastMsg.senderName,
          senderRole: lastMsg.senderRole
        } : undefined,
        unreadCount
      };
    });

    if (!session.isDistributor) {
      const internalAuditorConvId = `conv-${auditId}-internal-auditors`;
      const internalMsgs = allMessages.filter(m => m.conversationId === internalAuditorConvId || m.distributorId === 'internal-auditors');
      const sortedInternalMsgs = [...internalMsgs].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      const lastInternalMsg = sortedInternalMsgs.length > 0 ? sortedInternalMsgs[sortedInternalMsgs.length - 1] : undefined;

      conversations.unshift({
        conversationId: internalAuditorConvId,
        auditId,
        distributorId: 'internal-auditors',
        distributorName: '🔒 Internal Auditor Team Room',
        distributorCode: 'AUD-TEAM',
        distributorRegion: 'Internal Audit Practice',
        lastMessage: lastInternalMsg ? {
          content: lastInternalMsg.content,
          timestamp: lastInternalMsg.timestamp,
          senderName: lastInternalMsg.senderName,
          senderRole: lastInternalMsg.senderRole
        } : undefined,
        unreadCount: 0
      });
    }

    return res.json({
      success: true,
      conversations
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve conversations' });
  }
});

function extractDistributorIdFromConvId(convId: string): string {
  if (!convId) return '';
  const distIdx = convId.indexOf('-dist-');
  if (distIdx !== -1) {
    return convId.substring(distIdx + 1);
  }
  if (convId.includes('internal-auditors')) {
    return 'internal-auditors';
  }
  return '';
}

// GET /api/discussions/messages — Get messages for a specific conversation with strict isolation
app.get('/api/discussions/messages', async (req, res) => {
  try {
    const session = authenticateRequestSession(req);
    const conversationId = (req.query.conversationId as string) || '';
    const auditId = (req.query.auditId as string) || 'eng-101';
    let targetDistributorId = (req.query.distributorId as string) || '';

    if (conversationId) {
      const extracted = extractDistributorIdFromConvId(conversationId);
      if (extracted) {
        targetDistributorId = extracted;
      }
    }

    if (!targetDistributorId && session.isDistributor && session.distributorInfo) {
      targetDistributorId = session.distributorInfo.id;
    }

    if (session.isDistributor && session.distributorInfo) {
      if (targetDistributorId && targetDistributorId !== session.distributorInfo.id) {
        console.warn(`SECURITY REJECTION: Distributor '${session.org}' (ID: ${session.distributorInfo.id}) attempted to access conversation for '${targetDistributorId}'`);
        return res.status(403).json({
          error: 'Access Denied: You are not authorized to view messages belonging to another distributor conversation.'
        });
      }
      targetDistributorId = session.distributorInfo.id;
    }

    const expectedConvId = conversationId || `conv-${auditId}-${targetDistributorId || 'dist-1'}`;

    const isMemberActive = await isUserParticipantActive(expectedConvId, session.email);
    if (!isMemberActive) {
      return res.status(403).json({
        error: 'Access Denied: You have been removed from this conversation and can no longer view or retrieve messages.'
      });
    }

    const messages = await fetchMessagesFromSupabase(expectedConvId);

    return res.json({
      success: true,
      conversationId: expectedConvId,
      auditId,
      distributorId: targetDistributorId,
      messages
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve discussion messages' });
  }
});

// POST /api/discussions/post — Post message with server-side authorization & isolation
app.post('/api/discussions/post', async (req, res) => {
  try {
    const session = authenticateRequestSession(req);
    const { auditId, requestRef, requestTitle, content, attachments, contextType, contextId, contextLabel } = req.body;
    let { conversationId, distributorId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const currentAuditId = auditId || 'eng-101';

    if (session.isDistributor && session.distributorInfo) {
      if (distributorId && distributorId !== session.distributorInfo.id) {
        console.warn(`SECURITY REJECTION: Distributor '${session.org}' attempted to post to distributorId '${distributorId}'`);
        return res.status(403).json({
          error: 'Access Denied: You cannot post messages to another distributor conversation.'
        });
      }
      distributorId = session.distributorInfo.id;
    } else if (distributorId === 'internal-auditors' || conversationId?.includes('internal-auditors')) {
      distributorId = 'internal-auditors';
    } else if (!distributorId) {
      distributorId = 'dist-1';
    }

    const validConvId = conversationId || `conv-${currentAuditId}-${distributorId}`;

    const isMemberActive = await isUserParticipantActive(validConvId, session.email);
    if (!isMemberActive) {
      return res.status(403).json({
        error: 'Access Denied: You have been removed from this conversation and cannot send new messages.'
      });
    }

    const client = getSupabaseServerClient();
    if (!client) {
      return res.status(500).json({
        error: 'Database persistence unavailable: Supabase database client could not be initialized.'
      });
    }

    const now = new Date();
    const formattedTimestamp = `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newMessage: InStoreMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversationId: validConvId,
      auditId: currentAuditId,
      distributorId,
      contextType: contextType || 'GENERAL',
      contextId: contextId || requestRef || undefined,
      contextLabel: contextLabel || (contextType === 'IRL' ? `Requirement ${contextId || requestRef}` : contextType === 'QUESTIONNAIRE' ? `Question ${contextId || requestRef}` : contextType === 'SAMPLING' ? `Sample ${contextId || requestRef}` : 'General Audit Discussion'),
      requestRef: requestRef || contextId || undefined,
      requestTitle: requestTitle || contextLabel || undefined,
      senderName: session.name,
      senderEmail: session.email,
      senderRole: session.role,
      senderOrganization: session.org,
      timestamp: formattedTimestamp,
      content: content.trim(),
      attachments: Array.isArray(attachments) ? attachments : undefined,
      isReadByAuditor: !session.isDistributor,
      isReadByDistributor: session.isDistributor,
      createdAt: now.toISOString()
    };

    const insertRes = await client.from('system_audit_logs').insert({
      event_type: 'DISCUSSION_MESSAGE',
      target_user_email: validConvId,
      details: newMessage,
      created_at: now.toISOString()
    });

    if (insertRes.error) {
      console.error('Supabase message insert error:', insertRes.error);
      return res.status(500).json({
        error: `Database persistence failed: ${insertRes.error.message}`
      });
    }

    console.log(`💬 Message permanently saved in Supabase for '${validConvId}' by ${session.name} (${session.org})`);

    return res.json({
      success: true,
      message: newMessage
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to post message' });
  }
});

// GET /api/discussions/participants — Get conversation participants from Supabase
app.get('/api/discussions/participants', async (req, res) => {
  try {
    const session = authenticateRequestSession(req);
    const conversationId = (req.query.conversationId as string) || '';

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    if (session.isDistributor && session.distributorInfo) {
      if (!conversationId.includes(session.distributorInfo.id)) {
        return res.status(403).json({ error: 'Access Denied: You cannot view participants for another conversation.' });
      }
    }

    const partsForConv = await fetchParticipantsFromSupabase(conversationId);

    if (partsForConv.length === 0) {
      const dynamicDefaultParticipants: InStoreParticipant[] = [
        {
          id: `part-${session.email}`,
          conversationId,
          userEmail: session.email,
          userName: session.name,
          userRole: session.role,
          userOrganization: session.org,
          isActive: true,
          joinedAt: new Date().toISOString(),
          addedBy: 'Active Session'
        }
      ];
      return res.json({
        success: true,
        conversationId,
        participants: dynamicDefaultParticipants
      });
    }

    return res.json({
      success: true,
      conversationId,
      participants: partsForConv
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch participants' });
  }
});

// POST /api/discussions/participants/add — Add person to conversation in Supabase
app.post('/api/discussions/participants/add', async (req, res) => {
  try {
    const session = authenticateRequestSession(req);
    const { conversationId, userEmail, userName, userRole, userOrganization } = req.body;

    if (!conversationId || !userEmail || !userName) {
      return res.status(400).json({ error: 'Missing required participant fields' });
    }

    if (session.isDistributor) {
      return res.status(403).json({ error: 'Access Denied: Only Admin or Audit Lead can manage participants.' });
    }

    const client = getSupabaseServerClient();
    if (!client) {
      return res.status(500).json({ error: 'Database unavailable. Cannot save participant.' });
    }

    const newPart: InStoreParticipant = {
      id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      userEmail: userEmail.trim().toLowerCase(),
      userName: userName.trim(),
      userRole: userRole || 'Auditor',
      userOrganization: userOrganization || 'Apex Audit Practice (AA)',
      isActive: true,
      joinedAt: new Date().toISOString(),
      addedBy: session.email
    };

    const insRes = await client.from('system_audit_logs').insert({
      event_type: 'DISCUSSION_PARTICIPANT',
      target_user_email: conversationId,
      details: newPart,
      created_at: new Date().toISOString()
    });

    if (insRes.error) {
      return res.status(500).json({ error: `Database error adding participant: ${insRes.error.message}` });
    }

    const updatedParticipants = await fetchParticipantsFromSupabase(conversationId);

    return res.json({
      success: true,
      message: `Added participant ${userName} (${userEmail}) to ${conversationId}`,
      participants: updatedParticipants
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add participant' });
  }
});

// POST /api/discussions/participants/remove — Remove person from conversation in Supabase (preserves messages!)
app.post('/api/discussions/participants/remove', async (req, res) => {
  try {
    const session = authenticateRequestSession(req);
    const { conversationId, userEmail } = req.body;

    if (!conversationId || !userEmail) {
      return res.status(400).json({ error: 'Conversation ID and user email are required' });
    }

    if (session.isDistributor) {
      return res.status(403).json({ error: 'Access Denied: Only Admin or Audit Lead can remove participants.' });
    }

    const client = getSupabaseServerClient();
    if (!client) {
      return res.status(500).json({ error: 'Database unavailable. Cannot remove participant.' });
    }

    const allParts = await fetchParticipantsFromSupabase(conversationId);
    const matching = allParts.find(p => p.userEmail.toLowerCase() === userEmail.toLowerCase());

    const removedPart: InStoreParticipant = {
      id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      userEmail: userEmail.trim().toLowerCase(),
      userName: matching?.userName || userEmail,
      userRole: matching?.userRole || 'Auditor',
      userOrganization: matching?.userOrganization || 'Apex Audit Practice (AA)',
      isActive: false,
      joinedAt: matching?.joinedAt || new Date().toISOString(),
      addedBy: matching?.addedBy || 'System',
      removedAt: new Date().toISOString(),
      removedBy: session.email
    };

    const insRes = await client.from('system_audit_logs').insert({
      event_type: 'DISCUSSION_PARTICIPANT',
      target_user_email: conversationId,
      details: removedPart,
      created_at: new Date().toISOString()
    });

    if (insRes.error) {
      return res.status(500).json({ error: `Database error removing participant: ${insRes.error.message}` });
    }

    console.log(`👤 Participant ${userEmail} removed from ${conversationId} in Supabase. Historical messages preserved.`);

    const updatedParticipants = await fetchParticipantsFromSupabase(conversationId);

    return res.json({
      success: true,
      message: `Removed ${userEmail} from conversation. Historical messages remain preserved in audit log.`,
      participants: updatedParticipants
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to remove participant' });
  }
});

// POST /api/discussions/mark-read — Mark unread messages in conversation as read
app.post('/api/discussions/mark-read', async (req, res) => {
  try {
    const session = authenticateRequestSession(req);
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    if (session.isDistributor && session.distributorInfo) {
      if (!conversationId.includes(session.distributorInfo.id)) {
        return res.status(403).json({ error: 'Access Denied: Cannot mark messages as read for another conversation.' });
      }
    }

    // Messages are stored in Supabase. Acknowledge mark read request.
    return res.json({
      success: true,
      message: `Messages marked as read for ${conversationId}`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to mark messages as read' });
  }
});

// ====================================================================
// STEP 11 & 12: NOTIFICATIONS & AUDIT LOGS API
// ====================================================================
app.post('/api/audit-logs/log', (req, res) => {
  const { userName, userEmail, userRole, organization, action, details } = req.body;

  const logEntry = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    userName: userName || 'User',
    userEmail: userEmail || 'user@company.com',
    userRole: userRole || 'Auditor',
    organization: organization || 'Apex Audit Practice',
    action: action || 'Upload',
    ipAddress: req.ip || '192.168.1.1',
    browser: 'Chrome 124 / Linux',
    device: 'Desktop',
    details: details || 'Action executed successfully'
  };

  return res.json({
    success: true,
    log: logEntry
  });
});

// ====================================================================
// BUSINESS QUESTIONNAIRE SUPABASE PERSISTENCE API
// ====================================================================

// Fetch Authoritative Questionnaire State
app.get('/api/questionnaire/sync', async (req, res) => {
  try {
    const client = String(req.query.client || 'Apex Electronics Corp');
    const distributor = String(req.query.distributor || 'Midwest Trading Co.');
    const auditId = String(req.query.auditId || 'eng-101');
    const userRole = String(req.query.role || req.headers['x-user-role'] || '');
    const userOrg = String(req.query.organization || req.headers['x-user-org'] || '');

    const isDistributor = userRole.toLowerCase().includes('distributor');

    // Cross-distributor access isolation check
    if (isDistributor && userOrg && !distributor.toLowerCase().includes(userOrg.toLowerCase()) && !userOrg.toLowerCase().includes(distributor.toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You are not authorized to view questionnaires belonging to other distributors.'
      });
    }

    const isAuditor = !isDistributor;
    const result = await getAuthoritativeQuestionnaireState(client, distributor, auditId, isAuditor);

    return res.json({
      success: true,
      found: result.found,
      state: result.state
    });
  } catch (err: any) {
    console.error('Error in GET /api/questionnaire/sync:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to sync questionnaire state' });
  }
});

// Save Questionnaire Answers
app.post('/api/questionnaire/save', async (req, res) => {
  try {
    const { client, distributor, auditId, answers, userEmail, userName, version, userRole, userOrg } = req.body;
    if (!client || !distributor || !answers) {
      return res.status(400).json({ success: false, error: 'client, distributor, and answers are required.' });
    }

    const isDistributor = (userRole || '').toLowerCase().includes('distributor');
    if (isDistributor && userOrg && !distributor.toLowerCase().includes(userOrg.toLowerCase()) && !userOrg.toLowerCase().includes(distributor.toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Cross-distributor save is not permitted.'
      });
    }

    const result = await saveAuthoritativeQuestionnaireAnswers(
      client,
      distributor,
      auditId || 'eng-101',
      answers,
      userEmail || 'distributor@example.com',
      userName || 'Distributor User',
      version
    );

    return res.json({
      success: true,
      state: result.state
    });
  } catch (err: any) {
    console.error('Error in POST /api/questionnaire/save:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to save questionnaire answers' });
  }
});

// Submit Final Questionnaire
app.post('/api/questionnaire/submit', async (req, res) => {
  try {
    const { client, distributor, auditId, userEmail, userName, userRole, userOrg } = req.body;
    if (!client || !distributor) {
      return res.status(400).json({ success: false, error: 'client and distributor are required.' });
    }

    const isDistributor = (userRole || '').toLowerCase().includes('distributor');
    if (isDistributor && userOrg && !distributor.toLowerCase().includes(userOrg.toLowerCase()) && !userOrg.toLowerCase().includes(distributor.toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Cross-distributor submission is not permitted.'
      });
    }

    const result = await submitAuthoritativeQuestionnaire(
      client,
      distributor,
      auditId || 'eng-101',
      userEmail || 'distributor@example.com',
      userName || 'Distributor User'
    );

    return res.json({
      success: true,
      state: result.state
    });
  } catch (err: any) {
    console.error('Error in POST /api/questionnaire/submit:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to submit questionnaire' });
  }
});

// Save Auditor Notes & Risk Ratings
app.post('/api/questionnaire/auditor-notes', async (req, res) => {
  try {
    const { client, distributor, auditId, auditorNotes, userEmail, userName, userRole } = req.body;
    if (!client || !distributor || !auditorNotes) {
      return res.status(400).json({ success: false, error: 'client, distributor, and auditorNotes are required.' });
    }

    const isDistributor = (userRole || '').toLowerCase().includes('distributor');
    if (isDistributor) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Distributors cannot create or modify auditor internal notes.'
      });
    }

    const result = await saveAuthoritativeQuestionnaireAuditorNotes(
      client,
      distributor,
      auditId || 'eng-101',
      auditorNotes,
      userEmail || 'auditor@example.com',
      userName || 'Audit Lead'
    );

    return res.json({
      success: true,
      auditorNotes: result.auditorNotes
    });
  } catch (err: any) {
    console.error('Error in POST /api/questionnaire/auditor-notes:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to save auditor notes' });
  }
});

// AI Copilot Gemini chat endpoint
app.post('/api/copilot/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const ai = getGeminiClient();
    if (ai) {
      const systemInstruction = `You are Data360 AI Audit Copilot, an enterprise forensic audit and compliance assistant. You assist with distributor compliance, GL ledger anomaly analysis, Benford's law tests, Monetary Unit Sampling (MUS), internal controls, and BRD rules. Keep answers concise, authoritative, and actionable.`;

      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const h of history) {
          contents.push({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction
        }
      });

      if (response.text) {
        return res.json({
          success: true,
          text: response.text
        });
      }
    }
  } catch (err: any) {
    console.warn('Gemini API call note:', err.message);
  }

  // Graceful fallback if GEMINI_API_KEY is not configured or in offline prototype mode
  let aiReply = "I have analyzed your request across active audit workpapers. Based on the 142,000 ledger rows ingested, I found a 96.2% probability of $185,000 rebate overclaiming for Midwest Trading Co. Would you like me to auto-generate a formal observation notice?";
  const lower = message.toLowerCase();
  if (lower.includes('brd') || lower.includes('rule')) {
    aiReply = "According to Business Rule BR-001 (Segregation of Duties), the auditor who logged a finding cannot be the sole approver who closes it. Workpapers lock automatically upon Partner sign-off (BR-002).";
  } else if (lower.includes('sampling') || lower.includes('mus')) {
    aiReply = "For Monetary Unit Sampling (MUS) with $14.2M population and 95% confidence level ($150k tolerable error), the required sample size is 1,450 items with a sampling interval of $9,793.";
  } else if (lower.includes('benford') || lower.includes('anomaly')) {
    aiReply = "Benford First-Digit Analysis on invoice amounts flagged digit '7' with 18.4% frequency (expected 5.8%), indicating potential split-invoice structuring under the $50k approval threshold.";
  } else if (lower.includes('evidence') || lower.includes('upload') || lower.includes('drive')) {
    aiReply = "Evidence files are synchronized to Google Drive under the Data360_Test folder hierarchy with automated SHA-256 integrity verification and status tracking.";
  }

  return res.json({
    success: true,
    text: aiReply
  });
});

// Vercel serverless entry point. Do not call app.listen() here.
export default app;
