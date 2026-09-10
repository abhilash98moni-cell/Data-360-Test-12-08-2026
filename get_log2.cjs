const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('system_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log("Data:", JSON.stringify(data, null, 2));
}
run();
