require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function check() {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );
  
  const { data, error } = await supabase.rpc('get_policies_debug');
  // if no rpc, we can use a direct postgres connection if we had one, 
  // but we only have supabase url and key.
  // Instead, let's just create a function to list policies if we can.
  console.log(data, error);
}
check();
