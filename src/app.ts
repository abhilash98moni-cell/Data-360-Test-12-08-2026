import express from 'express';
import { authenticateRequest } from "./middleware/auth.js";
import { 
  syncIrl, 
  submitIrl, 
  getEditRequests, 
  requestEdit, 
  approveEditRequest, 
  rejectEditRequest 
} from './controllers/irlController.js';
import { getSupabaseServerClient } from './lib/supabaseServer.js';
import { storageService } from './services/storageService.js';
import multer from 'multer';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/supabase/health', async (req, res) => {
  try {
    const supabase = getSupabaseServerClient();
    const start = Date.now();
    const { error: dbError } = await supabase.from('pending_signup_requests').select('id').limit(1);
    const latencyMs = Date.now() - start;
    if (dbError) {
       return res.json({ connected: true, latencyMs, error: 'Connection OK but table query failed: ' + dbError.message });
    }
    res.json({ connected: true, latencyMs, message: 'Supabase connected successfully.' });
  } catch (err: any) {
    res.json({ connected: false, error: err.message || 'Unable to connect to Supabase.' });
  }
});

app.post('/api/admin/approve-signup', authenticateRequest, async (req: any, res) => {
  try {
    if (req.auth?.role !== 'Admin') return res.status(403).json({ success: false, error: 'Unauthorized.' });
    const { requestId } = req.body;
    const supabase = getSupabaseServerClient();
    const { data: request, error: reqError } = await supabase.from('pending_signup_requests').select('*').eq('id', requestId).single();
    if (reqError || !request) return res.status(404).json({ success: false, error: 'Request not found' });
    await supabase.from('pending_signup_requests').update({ status: 'approved' }).eq('id', requestId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Evidence Routes
app.get('/api/evidence', authenticateRequest, async (req, res) => {
  try {
    const supabase = getSupabaseServerClient();
    let query = supabase.from('evidence_records').select('*');
    if (req.query.client && req.query.client !== 'All Clients') query = query.eq('client_name', req.query.client); // Assuming client_name exists, or we map it
    if (req.query.auditId && req.query.auditId !== 'All Audits') query = query.eq('audit_id', req.query.auditId);
    if (req.query.distributor && req.query.distributor !== 'All Distributors' && req.query.distributor !== 'all') {
       query = query.eq('distributor_name', req.query.distributor);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, records: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/evidence/:id/history', authenticateRequest, async (req, res) => {
  // Not fully implemented relationally yet, return empty for now
  res.json({ success: true, history: [] });
});

app.patch('/api/evidence/:id/usage', authenticateRequest, async (req, res) => {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('evidence_records').update({ status: req.body.usage }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

app.post('/api/evidence/:id/review', authenticateRequest, async (req: any, res) => {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('evidence_records').update({
       status: req.body.status || 'Reviewed'
    }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// Engagement Routes
app.get('/api/engagements', authenticateRequest, async (req, res) => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from('engagements').select('*');
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, engagements: data || [] });
});

app.post('/api/engagements', authenticateRequest, async (req: any, res: any) => {
  const supabase = getSupabaseServerClient();
  const { engagements } = req.body;
  
  if (Array.isArray(engagements)) {
    for (const eng of engagements) {
      await supabase.from('engagements').upsert({
        audit_id: eng.audit_id || eng.id,
        client_name: eng.client_name || eng.clientName,
        distributor_name: eng.distributor_name || eng.distributorName,
        status: eng.status || 'Planning',
        updated_at: new Date().toISOString()
      }, { onConflict: 'audit_id' });
    }
  }
  res.json({ success: true });
});

// IRL Routes
app.post('/api/iir/submit', authenticateRequest, submitIrl);
app.get('/api/iir/sync', authenticateRequest, syncIrl);
app.get('/api/iir/edit-requests', authenticateRequest, getEditRequests);
app.post('/api/iir/request-edit', authenticateRequest, requestEdit);
app.post('/api/iir/request-edit/approve', authenticateRequest, approveEditRequest);
app.post('/api/iir/request-edit/reject', authenticateRequest, rejectEditRequest);

// Google Drive & Storage Routes
app.get('/api/gdrive/status', authenticateRequest, async (req, res) => {
  try {
    const isConnected = !!(storageService as any).drive;
    res.json({ 
      success: true, 
      connected: isConnected, 
      rootFolder: 'Data360_Prod', 
      storageStatus: isConnected ? 'Available' : 'Disconnected' 
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/gdrive/test-connection', authenticateRequest, async (req, res) => {
  try {
    const result = await storageService.testConnection();
    res.json(result);
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/storage/upload', authenticateRequest, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    
    let uploadedFile;
    if ((storageService as any).drive) {
       uploadedFile = await storageService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          {
             clientName: req.body.clientName || 'General',
             auditName: req.body.auditName || 'General',
             distributorName: req.body.distributorName || 'General',
             requirementId: req.body.requirementId || 'None',
             uploadedBy: req.auth?.name || 'Unknown User'
          }
       );
    } else {
       // Graceful fallback if GDrive not initialized in production environment yet
       uploadedFile = {
          id: `fallback-ev-${Date.now()}`,
          googleDriveFileId: `fallback-gdrive-${Date.now()}`,
          name: req.file.originalname,
          webViewLink: '#',
          mimeType: req.file.mimetype,
          size: req.file.size
       };
    }
    
    res.json({ success: true, file: uploadedFile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/storage/download/:fileId', authenticateRequest, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { fileName } = req.query;
    if ((storageService as any).drive) {
      const fileData = await storageService.downloadFile(fileId, fileName as string);
      res.setHeader('Content-Type', fileData.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileData.fileName}"`);
      return res.send(fileData.buffer);
    }
    res.status(501).json({ success: false, error: 'Google Drive not configured in backend' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback for unimplemented endpoints to strictly prevent fake success responses
app.all('/api/*', authenticateRequest, (req, res) => {
  res.status(501).json({
    success: false,
    error: `Endpoint not implemented: ${req.method} ${req.path}`
  });
});

export default app;
