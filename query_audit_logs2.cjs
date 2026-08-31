const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false }});

async function run() {
  const { data, error } = await supabase.from('system_audit_logs').select('*').eq('event_type', 'CREATED_CUSTOM_QUESTION');
  if (error) console.error('Error:', error);
  else console.log('Data count:', data.length, data);
}
run();
