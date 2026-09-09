const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.log("Error:", error);
  } else {
    console.log("Users:", data.users.length);
    data.users.forEach(u => console.log(u.email));
  }
}
check();
