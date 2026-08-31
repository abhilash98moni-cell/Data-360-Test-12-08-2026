const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false }});

async function run() {
  const { data, error } = await supabase.from('system_audit_logs').insert({
    event_type: 'TEST',
    target_user_email: 'test@example.com',
    details: '{}'
  }).select();
  console.log('Error:', error);
  console.log('Data:', data);
}
run();
