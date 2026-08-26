const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: stateData } = await supabase.from('system_audit_logs').select('*').in('event_type', ['IRL_DISTRIBUTOR_STATE', 'IRL_STATE']).order('created_at', { ascending: false });
  const latestStates = new Map();
  (stateData || []).forEach(row => {
     const state = row.details;
     if (state && state.client && state.distributor) {
        const key = `${state.client}::${state.distributor}`;
        if (!latestStates.has(key)) {
           latestStates.set(key, state);
        }
     }
  });

  let dbRecords = [];
  const existingFileIds = new Set();
  
  let targetDistributor = undefined; // auditor
  let client = "All Clients";
  let auditId = "eng-101";

  Array.from(latestStates.values()).forEach(state => {
     if (targetDistributor && state.distributor !== targetDistributor) return;
     if (client && client !== 'All Clients' && state.client !== client) return;
     if (auditId && auditId !== 'All Audits' && state.auditId !== auditId) return;

     const requests = state.requests || [];
     requests.forEach((reqItem) => {
        const files = reqItem.uploadedFiles || reqItem.files || [];
        files.forEach((file) => {
           const gId = file.googleDriveFileId || file.storageId || file.id;
           if (!gId || existingFileIds.has(gId)) return;
           
           dbRecords.push({ id: gId, distributor: state.distributor });
           existingFileIds.add(gId);
        });
     });
  });
  console.log("Found:", dbRecords.length);
}
run();
