const fs = require('fs');

function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  // Find the generic relaxed policies and replace them
  // "Allow all access to audit_reports"
  code = code.replace(/-- Allow all access to audit_reports\n\s*DROP POLICY IF EXISTS "Allow all access to audit_reports" ON public\.audit_reports;\n\s*CREATE POLICY "Allow all access to audit_reports" ON public\.audit_reports FOR ALL USING \(true\) WITH CHECK \(true\);/g, 
`-- Audit Reports RLS
    DROP POLICY IF EXISTS "Allow all access to audit_reports" ON public.audit_reports;
    DROP POLICY IF EXISTS "Audit Reports Read Access" ON public.audit_reports;
    CREATE POLICY "Audit Reports Read Access" ON public.audit_reports FOR SELECT USING (auth.uid() IS NOT NULL);
    DROP POLICY IF EXISTS "Audit Reports Write Access" ON public.audit_reports;
    CREATE POLICY "Audit Reports Write Access" ON public.audit_reports FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);`);

  // "Distributor Edit Requests Isolation Policy"
  code = code.replace(/-- Distributors Edit Requests\n\s*DROP POLICY IF EXISTS "Distributor Edit Requests Isolation Policy" ON public\.irl_edit_requests;\n\s*CREATE POLICY "Distributor Edit Requests Isolation Policy" ON public\.irl_edit_requests FOR ALL USING \(true\); -- Relaxed for testing/g, 
`-- Distributors Edit Requests
    DROP POLICY IF EXISTS "Distributor Edit Requests Isolation Policy" ON public.irl_edit_requests;
    CREATE POLICY "Distributor Edit Requests Isolation Policy" ON public.irl_edit_requests FOR ALL USING (auth.uid() IS NOT NULL);`);

  // "Distributor Evidence Isolation Policy"
  code = code.replace(/-- Evidence Files\n\s*DROP POLICY IF EXISTS "Distributor Evidence Isolation Policy" ON public\.evidence_files;\n\s*CREATE POLICY "Distributor Evidence Isolation Policy" ON public\.evidence_files FOR ALL USING \(true\); -- Relaxed for testing/g, 
`-- Evidence Files
    DROP POLICY IF EXISTS "Distributor Evidence Isolation Policy" ON public.evidence_files;
    CREATE POLICY "Distributor Evidence Isolation Policy" ON public.evidence_files FOR ALL USING (auth.uid() IS NOT NULL);`);

  // Update Public can submit signup requests to insert-only
  // Wait, it is already INSERT-only. But let's check it.
  
  fs.writeFileSync(filename, code);
  console.log(`Patched RLS in ${filename}`);
}

patch('supabase_schema.sql');
patch('src/db/supabase_schema.sql');

