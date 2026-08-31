const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false }});

async function run() {
  const { error } = await supabase.from('sampling_custom_questions').select('*').limit(1);
  console.log(error);
}
run();
