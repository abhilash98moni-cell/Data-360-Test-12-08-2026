const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('system_audit_logs').select('id, event_type, details, created_at').eq('event_type', 'IRL_DISTRIBUTOR_STATE').order('created_at', { ascending: false });
  for (const sl of data) {
    const reqs = sl.details?.requests || [];
    for (const rq of reqs) {
      const files = rq.uploadedFiles || rq.files || [];
      for (const f of files) {
        const fId = f.evidenceId || f.id || f.googleDriveFileId || f.storageId;
        if (fId === 'EVD-102-AGR') {
           console.log(sl.created_at, f.samplingEnabled, f.samplingStatus, f.documentUsage);
        }
      }
    }
  }
}
run();
