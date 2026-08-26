const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const search = `      const { data: existingLog, error: fetchErr } = await supabase.from('system_audit_logs').select('*').eq('id', id).maybeSingle();
      if (fetchErr || !existingLog) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }`;

const replace = `      const { data: existingLog, error: fetchErr } = await supabase.from('system_audit_logs').select('*').eq('id', id).maybeSingle();
      if (fetchErr) {
        console.error("fetchErr in patch/usage:", fetchErr);
        return res.status(500).json({ success: false, error: fetchErr.message });
      }
      if (!existingLog) {
        // Let's try to find it inside IRL_DISTRIBUTOR_STATE if it's there
        return res.status(404).json({ success: false, error: 'Record not found for ID: ' + id });
      }`;

code = code.replace(search, replace);
fs.writeFileSync('server.ts', code);
