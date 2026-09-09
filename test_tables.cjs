const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const tables = ['audits', 'engagements', 'audit_engagements', 'questionnaires', 'evidence', 'audit_reports'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*').limit(1);
    console.log(t, error ? error.message : "Exists");
  }
}
test();
