const fs = require('fs');

let code = fs.readFileSync('api/index.ts', 'utf8');

// 1. Add authenticateStorage middleware
const storageMiddleware = `
function authenticateStorageRequest(req: any, res: any, next: any) {
  const role = req.headers['x-user-role'] || req.query.userRole || 'Auditor';
  const org = req.headers['x-user-organization'] || req.query.userOrg || '';
  req.auth = { role, organization: org };
  next();
}
`;
code = code.replace("const { getSupabaseServerClient } = require('../src/db/supabaseClient');", "const { getSupabaseServerClient } = require('../src/db/supabaseClient');\n" + storageMiddleware);

// 2. Update preview and download to use it and verify tenant
const oldDownload = `app.get('/api/storage/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const downloaded = await storageService.downloadFile(fileId);`;

const newDownload = `app.get('/api/storage/download/:fileId', authenticateStorageRequest, async (req: any, res: any) => {
  try {
    const { fileId } = req.params;
    const client = getSupabaseServerClient();
    
    // Verify Authorization
    if (req.auth.role === 'Distributor') {
      const { data: fileData, error: dbErr } = await client
        .from('evidence_files')
        .select('distributor_name')
        .eq('id', fileId)
        .single();
        
      if (dbErr || !fileData) {
        // Fallback check in system_audit_logs if evidence_files not found
        const { data: logData } = await client
          .from('system_audit_logs')
          .select('details')
          .eq('event_type', 'EVIDENCE_FILE')
          .contains('details', { id: fileId })
          .single();
          
        if (logData && logData.details && logData.details.distributor_name !== req.auth.organization) {
           return res.status(403).json({ error: 'Unauthorized to download this file.' });
        }
      } else if (fileData.distributor_name !== req.auth.organization) {
        return res.status(403).json({ error: 'Unauthorized to download this file.' });
      }
    }
    
    const downloaded = await storageService.downloadFile(fileId);`;
    
const oldPreview = `app.get('/api/storage/preview/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const downloaded = await storageService.downloadFile(fileId);`;

const newPreview = `app.get('/api/storage/preview/:fileId', authenticateStorageRequest, async (req: any, res: any) => {
  try {
    const { fileId } = req.params;
    const client = getSupabaseServerClient();
    
    // Verify Authorization
    if (req.auth.role === 'Distributor') {
      const { data: fileData, error: dbErr } = await client
        .from('evidence_files')
        .select('distributor_name')
        .eq('id', fileId)
        .single();
        
      if (dbErr || !fileData) {
         // Fallback check in system_audit_logs if evidence_files not found
        const { data: logData } = await client
          .from('system_audit_logs')
          .select('details')
          .eq('event_type', 'EVIDENCE_FILE')
          .contains('details', { id: fileId })
          .single();
          
        if (logData && logData.details && logData.details.distributor_name !== req.auth.organization) {
           return res.status(403).json({ error: 'Unauthorized to preview this file.' });
        }
      } else if (fileData.distributor_name !== req.auth.organization) {
        return res.status(403).json({ error: 'Unauthorized to preview this file.' });
      }
    }
    
    const downloaded = await storageService.downloadFile(fileId);`;

code = code.replace(oldDownload, newDownload);
code = code.replace(oldPreview, newPreview);

fs.writeFileSync('api/index.ts', code);
