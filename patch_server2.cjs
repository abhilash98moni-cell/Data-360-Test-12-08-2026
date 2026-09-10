const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\('\/api\/storage\/download\/:fileId'[\s\S]*?res\.status\(500\)\.json\({ error: 'Failed to preview file from Google Drive' }\);\s*}\s*}\);/m;

const replacement = `app.get('/api/storage/download/:fileId', authenticateStorageRequest, async (req: any, res: any) => {
    try {
      const { fileId } = req.params;
      const fallbackFileName = req.query.fileName as string;
      const client = getSupabaseServerClient();
      
      if (req.auth.role === 'Distributor') {
        let authorized = true;
        
        // Fix: Use limit(1) to avoid PGRST116 (multiple rows) on system_audit_logs!
        const { data: logData, error: logErr } = await client
            .from('system_audit_logs')
            .select('details')
            .eq('event_type', 'EVIDENCE_FILE')
            .contains('details', { google_drive_file_id: fileId })
            .limit(1)
            .maybeSingle();

        if (logData && logData.details && logData.details.distributor_name !== req.auth.organization) {
             authorized = false;
        } else if (!logData) {
             authorized = false;
        }
        
        if (!authorized) {
          return res.status(403).json({ error: 'Unauthorized to download this file.' });
        }
      }
      
      const downloaded = await storageService.downloadFile(fileId, fallbackFileName);
      res.setHeader('Content-Type', downloaded.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', \`attachment; filename="\${encodeURIComponent(downloaded.fileName)}"\`);
      res.send(downloaded.buffer);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to download file from Google Drive', details: err.message, stack: err.stack });
    }
  });

  app.get('/api/storage/preview/:fileId', authenticateStorageRequest, async (req: any, res: any) => {
    try {
      const { fileId } = req.params;
      const fallbackFileName = req.query.fileName as string;
      const client = getSupabaseServerClient();
      
      if (req.auth.role === 'Distributor') {
        let authorized = true;
        
        const { data: logData } = await client
            .from('system_audit_logs')
            .select('details')
            .eq('event_type', 'EVIDENCE_FILE')
            .contains('details', { google_drive_file_id: fileId })
            .limit(1)
            .maybeSingle();

        if (logData && logData.details && logData.details.distributor_name !== req.auth.organization) {
             authorized = false;
        } else if (!logData) {
             authorized = false;
        }
        
        if (!authorized) {
          return res.status(403).json({ error: 'Unauthorized to preview this file.' });
        }
      }
      
      const downloaded = await storageService.downloadFile(fileId, fallbackFileName);
      res.setHeader('Content-Type', downloaded.mimeType || 'text/plain');
      res.setHeader('Content-Disposition', \`inline; filename="\${encodeURIComponent(downloaded.fileName)}"\`);
      res.send(downloaded.buffer);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to preview file from Google Drive' });
    }
  });`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
