const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const searchPatch = `      const supabase = getSupabaseServerClient();
      const { data: existingLog, error: fetchErr } = await supabase.from('system_audit_logs').select('*').eq('id', id).maybeSingle();
      if (fetchErr) {
        return res.status(500).json({ success: false, error: fetchErr.message });
      }`;

const replacePatch = `      const supabase = getSupabaseServerClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      let existingLog = null;
      if (isUuid) {
        const { data: log, error: fetchErr } = await supabase.from('system_audit_logs').select('*').eq('id', id).maybeSingle();
        if (fetchErr) {
          console.error("fetch standalone evidence error:", fetchErr);
        } else {
          existingLog = log;
        }
      }`;

const searchReview = `      const supabase = getSupabaseServerClient();
      
      // Fetch target record from Supabase
      const { data: existingLog, error: fetchErr } = await supabase.from('system_audit_logs').select('*').eq('id', id).maybeSingle();
      
      if (fetchErr) {
         return res.status(500).json({ success: false, error: fetchErr.message });
      }`;

const replaceReview = `      const supabase = getSupabaseServerClient();
      
      // Fetch target record from Supabase
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      let existingLog = null;
      if (isUuid) {
        const { data: log, error: fetchErr } = await supabase.from('system_audit_logs').select('*').eq('id', id).maybeSingle();
        if (fetchErr) {
           console.error("fetch standalone evidence error:", fetchErr);
        } else {
           existingLog = log;
        }
      }`;

code = code.replace(searchPatch, replacePatch).replace(searchReview, replaceReview);
fs.writeFileSync('server.ts', code);
