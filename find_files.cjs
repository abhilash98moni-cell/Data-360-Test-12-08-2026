const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('system_audit_logs').select('id, event_type, details').in('event_type', ['EVIDENCE_FILE', 'IRL_DISTRIBUTOR_STATE']);
  
  let found = [];
  for (const sl of data) {
    if (sl.event_type === 'EVIDENCE_FILE') {
       if (sl.details && sl.details.file_name && sl.details.file_name.includes('Testing')) {
         found.push(sl.details);
       }
    } else {
      const reqs = sl.details?.requests || [];
      for (const rq of reqs) {
        const files = rq.uploadedFiles || rq.files || [];
        for (const f of files) {
          if (f.fileName && (f.fileName.includes('Testing') || f.fileName.includes('Disbursement'))) {
             found.push(f);
          }
        }
      }
    }
  }
  console.log("Found files matching keywords:", JSON.stringify(found, null, 2));
}
run();
