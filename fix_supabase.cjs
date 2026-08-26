const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace("const { error } = await supabase.from('system_audit_logs').insert({", "const supabase = getSupabaseServerClient();\n      const { error } = await supabase.from('system_audit_logs').insert({");
fs.writeFileSync('server.ts', code);
