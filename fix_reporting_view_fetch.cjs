const fs = require('fs');
let code = fs.readFileSync('src/components/ReportingView.tsx', 'utf8');

const targetFetch = `  const fetchReports = async () => {
    try {
      let query = supabase
        .from("audit_reports")
        .select("*")
        .order("created_at", { ascending: false });

      // Distributor portal filtering
      if (currentUser?.role === "Distributor" || currentUser?.role?.includes("Distributor")) {
        query = query.eq("status", "FINAL").eq("distributor_name", currentUser.organization || selectedDistributor);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      } else if (data) {
        const formattedReports = data.map((row: any) => ({
          id: row.id,
          reportId: row.report_id,
          clientId: row.client_id,
          auditId: row.audit_id,
          reportType: row.report_type,
          templateId: row.template_id,
          templateVersion: row.template_version,
          reportVersion: row.report_version,
          status: row.status,
          createdBy: row.created_by,
          createdByEmail: row.created_by_email,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          finalizedAt: row.finalized_at,
          finalizedBy: row.finalized_by,
          overview: {
            ...row.overview,
            documentData: row.report_content || row.overview?.documentData || {}
          }
        })) as ReportMetadata[];
        setReports(formattedReports);
      }
    } catch (err: any) {
      if (err?.code === "PGRST205" || err?.code === "42P01" || err?.code === "42703") {
        console.warn("Expected Database Setup Error: 'audit_reports' table missing. User needs to run SQL.");
        setDbError("Database Persistence Error: The 'audit_reports' table or columns are missing. You must execute the SQL in src/db/supabase_schema.sql to enable persistence.");
      } else {
        console.error("Failed to fetch reports", err);
        setDbError("Database error: " + (err.message || String(err)));
      }
    }
  };`;

const replacementFetch = `  const fetchReports = async () => {
    try {
      const params = new URLSearchParams({
         distributor: selectedDistributor
      });
      const res = await fetch(\`/api/reports?\${params.toString()}\`, {
         headers: {
            'x-user-email': currentUser?.email || '',
            'x-user-role': currentUser?.role || '',
            'x-user-organization': currentUser?.organization || ''
         }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (data.reports) {
        const formattedReports = data.reports.map((row: any) => ({
          id: row.id,
          reportId: row.report_id,
          clientId: row.client_id,
          auditId: row.audit_id,
          reportType: row.report_type,
          templateId: row.template_id,
          templateVersion: row.template_version,
          reportVersion: row.report_version,
          status: row.status,
          createdBy: row.created_by,
          createdByEmail: row.created_by_email,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          finalizedAt: row.finalized_at,
          finalizedBy: row.finalized_by,
          overview: {
            ...row.overview,
            documentData: row.report_content || row.overview?.documentData || {}
          }
        })) as ReportMetadata[];
        setReports(formattedReports);
      }
    } catch (err: any) {
      console.error("Failed to fetch reports", err);
      setDbError("Database error: " + (err.message || String(err)));
    }
  };`;

if (code.includes(targetFetch)) {
  code = code.replace(targetFetch, replacementFetch);
  fs.writeFileSync('src/components/ReportingView.tsx', code);
  console.log('Updated fetchReports in ReportingView');
} else {
  console.log('fetchReports not found');
}
