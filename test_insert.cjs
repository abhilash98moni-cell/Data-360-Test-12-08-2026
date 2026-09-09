const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('pending_signup_requests').insert({
    email: 'test@sss.com',
    status: 'approved',
    role: 'Admin',
    organization_name: 'Data360'
  });
  console.log("Insert Error:", error);
}
test();
