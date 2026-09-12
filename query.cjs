const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function run() {
  console.log("=== DISTRIBUTORS ===");
  const { data: dists } = await supabase.from('distributors').select('*');
  console.log(dists);

  console.log("=== AUDITS ===");
  const { data: audits } = await supabase.from('audits').select('*');
  console.log(audits);
}

run();
