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
  
  Array.from(latestStates.values()).forEach(state => {
     const requests = state.requests || [];
     requests.forEach((reqItem) => {
        let unifiedStatus = 'PENDING_REVIEW';
        if (reqItem.reviewerStatus === 'Accepted') unifiedStatus = 'ACCEPTED';
        else if (reqItem.reviewerStatus === 'Rejected') unifiedStatus = 'REJECTED';
        else if (reqItem.reviewerStatus === 'Clarification Required') unifiedStatus = 'CLARIFICATION_REQUIRED';

        const files = reqItem.uploadedFiles || reqItem.files || [];
        files.forEach((file) => {
           const gId = file.googleDriveFileId || file.storageId || file.id;
           if (!gId || existingFileIds.has(gId)) return;
           
           dbRecords.push({
                 id: file.evidenceId || file.id || gId,
                 clientName: state.client || 'Apex Electronics Corp',
                 auditId: state.auditId || 'eng-101',
                 auditCode: state.auditCode || 'AUD-2026-001',
                 distributorName: state.distributor,
                 status: unifiedStatus,
                 documentUsage: file.documentUsage || 'GENERAL_EVIDENCE',
           });
           existingFileIds.add(gId);
        });
     });
  });

  console.log("Before filters:", dbRecords.length);

  let targetDistributor = "Midwest Trading Co.";
  let client = "All Clients";
  let auditId = "All Audits";
  let status = "PENDING_REVIEW";
  let documentUsage = "EVIDENCE";

  if (targetDistributor) {
    dbRecords = dbRecords.filter(r => r.distributorName === targetDistributor);
  }
  console.log("After targetDistributor:", dbRecords.length);

  if (status && status !== 'All') {
    const allowedStatuses = status.toUpperCase().split(',').map(s => s.trim().replace(/\s+/g, '_'));
    dbRecords = dbRecords.filter(r => { 
       const rStat = (r.status || '').toUpperCase().replace(/\s+/g, '_');
       return allowedStatuses.includes(rStat);
    });
  }
  console.log("After status:", dbRecords.length);
  
  if (documentUsage) {
    dbRecords = dbRecords.filter(r => {
      if (Array.isArray(r.documentUsage)) { 
         return r.documentUsage.includes(documentUsage);
      }
      return r.documentUsage === documentUsage || (r.documentUsage || '').includes(documentUsage);
    });
  }
  console.log("After documentUsage:", dbRecords.length);
}
run();
