const fs = require('fs');

let code = fs.readFileSync('api/index.ts', 'utf8');

const queryBlock = `      let authorized = true;
      const { data: fileData } = await client
        .from('evidence_files')
        .select('distributor_name')
        .or(\`id.eq.\${fileId},google_drive_id.eq.\${fileId}\`)
        .maybeSingle();`;

const newQueryBlock = `      let authorized = true;
      console.log('--- TEST 7 DEBUG ---');
      console.log('File ID:', fileId);
      console.log('req.auth:', req.auth);
      const { data: fileData, error: dbErr } = await client
        .from('evidence_files')
        .select('distributor_name')
        .or(\`id.eq.\${fileId},google_drive_id.eq.\${fileId}\`)
        .maybeSingle();
      console.log('fileData:', fileData);
      console.log('dbErr:', dbErr);`;

code = code.replace(queryBlock, newQueryBlock);

const logBlock = `        const { data: logData } = await client
          .from('system_audit_logs')
          .select('details')
          .eq('event_type', 'EVIDENCE_FILE')
          .contains('details', { google_drive_file_id: fileId })
          .maybeSingle();`;

const newLogBlock = `        const { data: logData, error: logErr } = await client
          .from('system_audit_logs')
          .select('details')
          .eq('event_type', 'EVIDENCE_FILE')
          .contains('details', { google_drive_file_id: fileId })
          .maybeSingle();
        console.log('logData:', logData);
        console.log('logErr:', logErr);`;

code = code.replace(logBlock, newLogBlock);

fs.writeFileSync('api/index.ts', code);
