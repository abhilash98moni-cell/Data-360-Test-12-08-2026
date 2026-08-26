const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const cols = [
    'created_by_name', 'created_at', 'findings', 'overview', 'report_content'
  ];
  
  for (let c of cols) {
    const { error } = await sb.from('audit_reports').select(c).limit(1);
    if (error) console.log("Missing:", c, error.message);
    else console.log("Exists:", c);
  }
}
run();
