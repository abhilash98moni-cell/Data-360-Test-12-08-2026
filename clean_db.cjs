const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function clean() {
  const { data: logs } = await supabase.from('system_audit_logs').select('*');
  let deletedLogs = 0;
  for (const log of logs || []) {
    if (log.details && log.details.audit_id && log.details.audit_id !== 'eng-101' && !log.details.distributor_name?.includes('Midwest')) {
      await supabase.from('system_audit_logs').delete().eq('id', log.id);
      deletedLogs++;
    } else if (log.organization && !log.organization.includes('Midwest') && log.organization !== 'Data360 Platform') {
      await supabase.from('system_audit_logs').delete().eq('id', log.id);
      deletedLogs++;
    }
  }
  console.log('Deleted logs:', deletedLogs);

  const { data: reports } = await supabase.from('audit_reports').select('*');
  let deletedReports = 0;
  for (const rep of reports || []) {
    if (rep.audit_id !== 'eng-101' && !rep.distributor_name.includes('Midwest')) {
      await supabase.from('audit_reports').delete().eq('id', rep.id);
      deletedReports++;
    }
  }
  console.log('Deleted reports:', deletedReports);
}
clean();
