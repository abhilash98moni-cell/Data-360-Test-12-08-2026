const fs = require('fs');

let code = fs.readFileSync('api/index.ts', 'utf8');

const authBlockOld = `
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
`;

const authBlockNew = `
    // Verify Authorization
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
        // Fallback check in system_audit_logs if evidence_files not found
        const { data: logData } = await client
          .from('system_audit_logs')
          .select('details')
          .eq('event_type', 'EVIDENCE_FILE')
          .contains('details', { google_drive_file_id: fileId })
          .maybeSingle();
          
        if (logData && logData.details && logData.details.distributor_name !== req.auth.organization) {
           authorized = false;
        } else if (!logData) {
           // If it's not even in the DB, it's safer to reject distributors for unknown files
           authorized = false;
        }
      }
      
      if (!authorized) {
        return res.status(403).json({ error: 'Unauthorized to download this file.' });
      }
    }
`;

const authBlockPreviewOld = `
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
`;

const authBlockPreviewNew = `
    // Verify Authorization
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
        // Fallback check in system_audit_logs if evidence_files not found
        const { data: logData } = await client
          .from('system_audit_logs')
          .select('details')
          .eq('event_type', 'EVIDENCE_FILE')
          .contains('details', { google_drive_file_id: fileId })
          .maybeSingle();
          
        if (logData && logData.details && logData.details.distributor_name !== req.auth.organization) {
           authorized = false;
        } else if (!logData) {
           // If it's not even in the DB, it's safer to reject distributors for unknown files
           authorized = false;
        }
      }
      
      if (!authorized) {
        return res.status(403).json({ error: 'Unauthorized to preview this file.' });
      }
    }
`;


code = code.replace(authBlockOld, authBlockNew);
code = code.replace(authBlockPreviewOld, authBlockPreviewNew);

fs.writeFileSync('api/index.ts', code);
