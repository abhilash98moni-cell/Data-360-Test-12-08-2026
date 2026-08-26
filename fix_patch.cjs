const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const search = `      const supabase = getSupabaseServerClient();
      const { data: existingLog, error: fetchErr } = await supabase.from('system_audit_logs').select('*').eq('id', id).maybeSingle();
      if (fetchErr) {
        console.error("fetchErr in patch/usage:", fetchErr);
        return res.status(500).json({ success: false, error: fetchErr.message });
      }
      if (!existingLog) {
        // Let's try to find it inside IRL_DISTRIBUTOR_STATE if it's there
        return res.status(404).json({ success: false, error: 'Record not found for ID: ' + id });
      }`;

const replace = `      const supabase = getSupabaseServerClient();
      const { data: existingLog, error: fetchErr } = await supabase.from('system_audit_logs').select('*').eq('id', id).maybeSingle();
      if (fetchErr) {
        return res.status(500).json({ success: false, error: fetchErr.message });
      }

      if (!existingLog) {
        // Try to update it inside IRL_DISTRIBUTOR_STATE
        const { data: stateLogs } = await supabase.from('system_audit_logs').select('*').eq('event_type', 'IRL_DISTRIBUTOR_STATE');
        let foundStateLog = null;
        let foundFile = null;
        if (stateLogs) {
          for (const sl of stateLogs) {
            const reqs = sl.details?.requests || [];
            for (const rq of reqs) {
              const files = rq.uploadedFiles || rq.files || [];
              for (const f of files) {
                const fId = f.evidenceId || f.id || f.googleDriveFileId || f.storageId;
                if (fId === id) {
                  foundStateLog = sl;
                  foundFile = f;
                  break;
                }
              }
              if (foundStateLog) break;
            }
            if (foundStateLog) break;
          }
        }
        
        if (foundStateLog && foundFile) {
           if (documentUsage) foundFile.documentUsage = documentUsage;
           if (samplingEnabled !== undefined) {
             foundFile.samplingEnabled = samplingEnabled;
             if (samplingEnabled) {
               foundFile.samplingAddedAt = new Date().toISOString();
               foundFile.samplingAddedBy = req.auth.email;
               foundFile.samplingSourceDocumentId = id;
               foundFile.samplingStatus = 'ADDED';
             } else {
               delete foundFile.samplingAddedAt;
               delete foundFile.samplingAddedBy;
               delete foundFile.samplingSourceDocumentId;
               delete foundFile.samplingStatus;
             }
           }
           const { error: updateErr } = await supabase.from('system_audit_logs').update({ details: foundStateLog.details }).eq('id', foundStateLog.id);
           if (updateErr) {
             return res.status(500).json({ success: false, error: updateErr.message });
           }
           return res.json({ success: true, message: 'Document usage updated successfully within state log' });
        }
        
        return res.status(404).json({ success: false, error: 'Record not found for ID: ' + id });
      }`;

code = code.replace(search, replace);
fs.writeFileSync('server.ts', code);
