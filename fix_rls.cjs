const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/const supabase = getSupabaseServerClient\(\);/g, 
  "const token = req.headers.authorization?.split(' ')[1];\n      const supabase = getSupabaseServerClient(token);");

// Fix IDOR in /api/storage/download/:fileId and /api/storage/preview/:fileId
const downloadSearch = `  app.get('/api/storage/download/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;`;
const downloadReplace = `  app.get('/api/storage/download/:fileId', authenticateRequest, async (req: any, res: any) => {
    try {
      const { fileId } = req.params;
      const token = req.headers.authorization?.split(' ')[1];
      const supabase = getSupabaseServerClient(token);
      const { data: fileData, error } = await supabase.from('evidence_files').select('id').eq('google_drive_file_id', fileId).maybeSingle();
      if (!fileData) {
         const { data: logData } = await supabase.from('system_audit_logs').select('id').eq('event_type', 'EVIDENCE_FILE').contains('details', { google_drive_file_id: fileId }).maybeSingle();
         if (!logData) return res.status(403).json({ error: 'Access Denied: File not found or unauthorized' });
      }`;
content = content.replace(downloadSearch, downloadReplace);

const previewSearch = `  app.get('/api/storage/preview/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;`;
const previewReplace = `  app.get('/api/storage/preview/:fileId', authenticateRequest, async (req: any, res: any) => {
    try {
      const { fileId } = req.params;
      const token = req.headers.authorization?.split(' ')[1];
      const supabase = getSupabaseServerClient(token);
      const { data: fileData, error } = await supabase.from('evidence_files').select('id').eq('google_drive_file_id', fileId).maybeSingle();
      if (!fileData) {
         const { data: logData } = await supabase.from('system_audit_logs').select('id').eq('event_type', 'EVIDENCE_FILE').contains('details', { google_drive_file_id: fileId }).maybeSingle();
         if (!logData) return res.status(403).json({ error: 'Access Denied: File not found or unauthorized' });
      }`;
content = content.replace(previewSearch, previewReplace);

// Fix Evidence History
const evidenceHistorySearch = `      const { data: targetLog } = await supabase.from('system_audit_logs').select('*').eq('id', id).maybeSingle();`;
const evidenceHistoryReplace = `      const { data: targetLog } = await supabase.from('system_audit_logs').select('*').eq('id', id).maybeSingle();
      if (targetLog && req.auth.role === 'Auditor') {
         const dName = targetLog.details?.distributor_name;
         if (dName) {
            const { data: allowed } = await supabase.from('auditor_distributor_access').select('id').eq('auditor_user_id', req.auth.id).eq('distributor_name', dName).eq('is_active', true).maybeSingle();
            if (!allowed) return res.status(403).json({ success: false, error: 'Access Denied: You are not authorized to view evidence for this distributor.' });
         }
      }`;
content = content.replace(evidenceHistorySearch, evidenceHistoryReplace);

fs.writeFileSync('server.ts', content);
