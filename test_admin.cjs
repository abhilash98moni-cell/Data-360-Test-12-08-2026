const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@data360.io',
    password: 'Password123!'
  });
  console.log("Admin Error:", error);
  console.log("Admin Data ID:", data.user ? data.user.id : null);
}
test();
