const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await supabase.from('system_audit_logs').select('details').in('event_type', ['IRL_DISTRIBUTOR_STATE', 'IRL_STATE']).order('created_at', { ascending: false });
  const latestStates = new Map();
  (data || []).forEach(row => {
     const state = row.details;
     if (state && state.client && state.distributor) {
        const key = `${state.client}::${state.distributor}`;
        if (!latestStates.has(key)) {
           latestStates.set(key, state);
        }
     }
  });

  const dists = Array.from(latestStates.values()).map(s => ({
    client: s.client,
    dist: s.distributor,
    auditId: s.auditId,
    auditPeriod: s.auditPeriod,
    reqs: (s.requests || []).length,
    files: (s.requests || []).reduce((acc, reqItem) => acc + (reqItem.uploadedFiles || reqItem.files || []).length, 0)
  }));
  console.log(JSON.stringify(dists, null, 2));
}
run();
