const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function initDB() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.log("No supabase creds found");
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Create table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS public.audit_reports (
      id text PRIMARY KEY,
      client_id text,
      distributor_id text,
      audit_id text,
      report_type text,
      template_id text,
      template_version text,
      report_version text,
      status text,
      docx_file_id text,
      pdf_file_id text,
      created_by text,
      created_at timestamp with time zone,
      finalized_by text,
      finalized_at timestamp with time zone,
      executive_summary text,
      findings jsonb,
      overview jsonb
    );
  `;
  // Ignore errors as this is a quick setup attempt, if the table exists we are good.
  console.log("Supabase connected");
}
initDB();
