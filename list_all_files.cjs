const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('system_audit_logs').select('id, event_type, details').order('created_at', { ascending: false }).limit(20);
  
  let files = [];
  for (const sl of data) {
    if (sl.event_type === 'IRL_DISTRIBUTOR_STATE') {
      const reqs = sl.details?.requests || [];
      for (const rq of reqs) {
        const f = rq.uploadedFiles || rq.files || [];
        for (const file of f) {
          files.push(file.fileName || file.name);
        }
      }
    } else if (sl.details && sl.details.file_name) {
       files.push(sl.details.file_name);
    }
  }
  console.log("Files:", [...new Set(files)]);
}
run();
