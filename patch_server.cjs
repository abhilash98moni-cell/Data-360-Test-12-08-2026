const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const middlewareBlock = `
function authenticateStorageRequest(req: any, res: any, next: any) {
  let role = req.headers['x-user-role'] || req.query.userRole;
  let org = req.headers['x-user-organization'] || req.query.userOrg;
  
  if (!role || !org) {
    if (req.headers.cookie) {
      const cookies = Object.fromEntries(req.headers.cookie.split('; ').map((c: string) => c.split('=')));
      if (!role && cookies.userRole) role = decodeURIComponent(cookies.userRole);
      if (!org && cookies.userOrg) org = decodeURIComponent(cookies.userOrg);
    }
  }
  
  req.auth = { role: role || 'Auditor', organization: org || '' };
  next();
}
`;

// Insert middleware before the routes
code = code.replace("app.get('/api/storage/download/:fileId'", middlewareBlock + "\n  app.get('/api/storage/download/:fileId'");


const oldDownload = `  app.get('/api/storage/download/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;
      const downloaded = await storageService.downloadFile(fileId);`;

const newDownload = `  app.get('/api/storage/download/:fileId', authenticateStorageRequest, async (req: any, res: any) => {
    try {
      const { fileId } = req.params;
      const client = getSupabaseServerClient();
      
      if (req.auth.role === 'Distributor') {
        let authorized = true;
        const { data: fileData } = await client
          .from('evidence_files')
          .select('distributor_name')
          .or(\`id.eq.\${fileId},google_drive_id.eq.\${fileId}\`)
          .maybeSingle();
          
        if (fileData) {
           if (fileData.distributor_name !== req.auth.organization) authorized = false;
        } else {
          const { data: logData } = await client
            .from('system_audit_logs')
            .select('details')
            .eq('event_type', 'EVIDENCE_FILE')
            .contains('details', { google_drive_file_id: fileId })
            .maybeSingle();
            
          if (logData && logData.details && logData.details.distributor_name !== req.auth.organization) {
             authorized = false;
          } else if (!logData) {
             authorized = false;
          }
        }
        
        if (!authorized) {
          return res.status(403).json({ error: 'Unauthorized to download this file.' });
        }
      }
      
      const downloaded = await storageService.downloadFile(fileId);`;

const oldPreview = `  app.get('/api/storage/preview/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;
      const downloaded = await storageService.downloadFile(fileId);`;

const newPreview = `  app.get('/api/storage/preview/:fileId', authenticateStorageRequest, async (req: any, res: any) => {
    try {
      const { fileId } = req.params;
      const client = getSupabaseServerClient();
      
      if (req.auth.role === 'Distributor') {
        let authorized = true;
        const { data: fileData } = await client
          .from('evidence_files')
          .select('distributor_name')
          .or(\`id.eq.\${fileId},google_drive_id.eq.\${fileId}\`)
          .maybeSingle();
          
        if (fileData) {
           if (fileData.distributor_name !== req.auth.organization) authorized = false;
        } else {
          const { data: logData } = await client
            .from('system_audit_logs')
            .select('details')
            .eq('event_type', 'EVIDENCE_FILE')
            .contains('details', { google_drive_file_id: fileId })
            .maybeSingle();
            
          if (logData && logData.details && logData.details.distributor_name !== req.auth.organization) {
             authorized = false;
          } else if (!logData) {
             authorized = false;
          }
        }
        
        if (!authorized) {
          return res.status(403).json({ error: 'Unauthorized to preview this file.' });
        }
      }
      
      const downloaded = await storageService.downloadFile(fileId);`;

code = code.replace(oldDownload, newDownload);
code = code.replace(oldPreview, newPreview);

fs.writeFileSync('server.ts', code);
