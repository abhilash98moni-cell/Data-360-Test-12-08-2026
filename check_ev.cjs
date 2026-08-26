const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await sb.from('system_audit_logs').select('details').eq('event_type', 'EVIDENCE_FILE').limit(5);
  console.log(JSON.stringify(data, null, 2));
}
run();
