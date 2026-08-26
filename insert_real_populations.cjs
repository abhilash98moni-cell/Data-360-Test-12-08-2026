const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const files = [
    {
      name: 'Sales Testing Template.xlsx',
      title: 'Sales Testing',
      records: 1, // Only 1 example row in the provided CSV
      value: 25279, // Transaction Amount USD from the CSV
    },
    {
      name: 'Employee Disbursement & Reimbursement Testing.xlsx',
      title: 'Employee Disbursements & Reimbursements',
      records: 1,
      value: 2967,
    },
    {
      name: '3rd Party Disbursements Testing template.xlsx',
      title: '3rd Party Disbursements',
      records: 1,
      value: 0,
    }
  ];

  for (const f of files) {
    // Delete existing to avoid duplicates
    const { data: existing } = await supabase
      .from('system_audit_logs')
      .select('id, details')
      .eq('event_type', 'EVIDENCE_FILE');
      
    if (existing) {
       for (const ex of existing) {
         if (ex.details && ex.details.file_name === f.name) {
            await supabase.from('system_audit_logs').delete().eq('id', ex.id);
         }
       }
    }

    const newEvidenceRow = {
      client_name: 'Apex Electronics Corp',
      audit_id: 'eng-101',
      audit_code: 'AUD-2026-001',
      distributor_name: 'Midwest Trading Co.',
      requirement_ref: 'SAMPLING',
      requirement_title: f.title,
      section: 'Sampling',
      file_name: f.name,
      file_size_mb: 0.1,
      file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      google_drive_file_id: `file-uuid-${f.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`,
      version: 1,
      uploaded_by: 'Auditor User',
      uploaded_at: new Date().toISOString(),
      status: 'AVAILABLE',
      review_status: 'ACCEPTED',
      uploader_role: 'Auditor',
      audit_period: 'FY 2025-26',
      document_type: 'SAMPLING_POPULATION',
      document_usage: ['SAMPLING_POPULATION'],
      samplingEnabled: true,
      samplingStatus: 'ADDED',
      source: 'Auditor Upload',
      recordCount: f.records,
      totalValue: f.value
    };

    const { data, error } = await supabase.from('system_audit_logs').insert({
      event_type: 'EVIDENCE_FILE',
      target_user_email: `Apex Electronics Corp::Midwest Trading Co.`,
      details: newEvidenceRow,
      created_at: new Date().toISOString()
    });
    console.log(f.name, error ? error : 'inserted');
  }
}
run();
