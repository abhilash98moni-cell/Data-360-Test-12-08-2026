const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('system_audit_logs').select('id, event_type, details');
  
  let found = [];
  for (const sl of data) {
    const s = JSON.stringify(sl);
    if (s.includes('Disbursement') || s.includes('Sales Testing') || s.includes('Testing template')) {
       found.push(sl);
    }
  }
  console.log("Found raw rows:", found.length);
  if (found.length > 0) {
     console.log(JSON.stringify(found, null, 2));
  }
}
run();
