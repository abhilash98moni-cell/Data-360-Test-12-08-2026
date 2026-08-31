const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false }});

async function run() {
  const { data, error } = await supabase.from('system_audit_logs').select('*').limit(1);
  if (error) console.error('Error:', error);
  else console.log('Data:', data);
}
run();
