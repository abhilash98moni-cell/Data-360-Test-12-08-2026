const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function run() {
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets.map(b => b.name));

  for (const b of buckets) {
    const { data: files } = await supabase.storage.from(b.name).list();
    console.log(`Files in ${b.name}:`, files.map(f => f.name));
  }
}
run();
