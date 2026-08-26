const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const cols = [
    'id', 'report_id', 'client_id', 'client_name', 'distributor_id', 'distributor_name', 
    'audit_id', 'report_type', 'template_id', 'template_version', 'report_version', 
    'status', 'created_by', 'created_by_email', 'data', 'is_latest'
  ];
  
  for (let c of cols) {
    const { error } = await sb.from('audit_reports').select(c).limit(1);
    if (error) console.log("Missing:", c, error.message);
    else console.log("Exists:", c);
  }
}
run();
