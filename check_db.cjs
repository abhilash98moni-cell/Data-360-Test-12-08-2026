const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const fileId = 'file-1789060829014-185';
  
  const { data: fileData, error: dbErr } = await supabase
    .from('evidence_files')
    .select('distributor_name')
    .or(`id.eq.${fileId},google_drive_id.eq.${fileId}`)
    .maybeSingle();
    
  console.log('fileData:', fileData, dbErr);
  
  const { data: logData, error: logErr } = await supabase
    .from('system_audit_logs')
    .select('details')
    .eq('event_type', 'EVIDENCE_FILE')
    .contains('details', { google_drive_file_id: fileId })
    .maybeSingle();
    
  console.log('logData:', logData, logErr);
}
run();
