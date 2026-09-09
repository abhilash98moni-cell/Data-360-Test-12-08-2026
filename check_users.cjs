const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.log("Error fetching users:", error);
  } else {
    console.log("Total Users in Auth:", users.users.length);
    users.users.forEach(u => console.log(`User: ${u.email}`));
  }
}
check();
