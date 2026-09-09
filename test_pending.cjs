const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data, error } = await supabase.from('pending_signup_requests').select('*').eq('email', 'test@sss.com');
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
