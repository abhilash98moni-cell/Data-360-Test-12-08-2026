const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const search = `        // Try to update it inside IRL_DISTRIBUTOR_STATE
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
        }`;

const replace = `        // Try to update it inside IRL_DISTRIBUTOR_STATE
        const { data: stateLogs } = await supabase.from('system_audit_logs')
            .select('*')
            .eq('event_type', 'IRL_DISTRIBUTOR_STATE')
            .order('created_at', { ascending: false });
            
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
        }`;

code = code.replace(search, replace);
fs.writeFileSync('server.ts', code);
