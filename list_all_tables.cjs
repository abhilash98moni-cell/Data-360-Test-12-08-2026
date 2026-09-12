const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('get_tables'); // Or just fetch from information_schema if we can
}
run();
