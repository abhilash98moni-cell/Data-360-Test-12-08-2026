const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function run() {
  const { data, count } = await supabase.from('audit_reports').select('*', { count: 'exact' });
  console.log(`Table audit_reports: ${count} rows`);
  if (count > 0) console.log(data);
}
run();
