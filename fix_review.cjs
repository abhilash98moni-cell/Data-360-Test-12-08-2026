const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const search = `      // Fetch target record from Supabase
      const { data: existingLog, error: fetchErr } = await supabase.from('system_audit_logs').select('*').eq('id', id).maybeSingle();
      if (fetchErr || !existingLog) {
        return res.status(404).json({ success: false, error: 'Evidence record not found in database' });
      }`;

const replace = `      // Fetch target record from Supabase
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
           const reviewerName = req.auth.name || 'Sarah Jenkins (Auditor)';
           const nowIso = new Date().toISOString();
           
           foundFile.status = formattedStatus;
           foundFile.review_status = formattedStatus;
           foundFile.reviewer_comment = trimmedComment;
           foundFile.reviewed_by = reviewerName;
           foundFile.reviewed_at = nowIso;
           
           const { error: updateErr } = await supabase.from('system_audit_logs').update({ details: foundStateLog.details }).eq('id', foundStateLog.id);
           if (updateErr) {
             return res.status(500).json({ success: false, error: updateErr.message });
           }
           return res.json({ success: true, message: 'Document review updated successfully within state log' });
        }
        
        return res.status(404).json({ success: false, error: 'Evidence record not found in database' });
      }`;

code = code.replace(search, replace);
fs.writeFileSync('server.ts', code);
