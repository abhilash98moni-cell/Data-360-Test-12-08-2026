const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function check() {
  const { count: countLogs } = await supabase.from('system_audit_logs').select('*', { count: 'exact', head: true });
  const { count: countReports } = await supabase.from('audit_reports').select('*', { count: 'exact', head: true });
  console.log(`Logs remaining: ${countLogs}, Reports remaining: ${countReports}`);
}
check();
