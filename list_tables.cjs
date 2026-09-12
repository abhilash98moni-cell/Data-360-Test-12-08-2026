const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function run() {
  const { data: tables, error } = await supabase.rpc('get_tables'); // Or just fetch known tables
  // Let's just list known tables based on supabase_schema.sql
  const knownTables = [
    'profiles', 'pending_signup_requests', 'auditor_distributor_access', 'audit_logs',
    'document_storage', 'evidence_history', 'evidence_comments', 
    'questionnaire_sections', 'questionnaire_questions', 'questionnaire_responses'
  ];
  for (const t of knownTables) {
    const { data, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`Table ${t}: ${count} rows`);
  }
}
run();
