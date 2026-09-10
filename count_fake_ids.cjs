const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('system_audit_logs')
    .select('details')
    .eq('event_type', 'EVIDENCE_FILE');
    
  if (error) {
    console.error("DB Error:", error);
    return;
  }
  
  let fakeCount = 0;
  for (const row of data) {
    if (row.details && row.details.google_drive_file_id && row.details.google_drive_file_id.startsWith('file-')) {
      fakeCount++;
    }
  }
  console.log("Fake 'file-' IDs found:", fakeCount);
  console.log("Total evidence logs:", data.length);
}
run();
