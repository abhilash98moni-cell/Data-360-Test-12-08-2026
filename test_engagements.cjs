const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { error } = await supabase.from('engagements').select('*').limit(1);
  console.log(error);
}
test();
