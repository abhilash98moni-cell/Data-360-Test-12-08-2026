const fs = require('fs');
let code = fs.readFileSync('src/components/ReportingView.tsx', 'utf8');

const regex = /const fetchReports = async \(\) => \{[\s\S]*?\}\;\n\n  useEffect/m;

const replacement = `const fetchReports = async () => {
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
  };

  useEffect`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/ReportingView.tsx', code);
    console.log('Successfully updated fetchReports');
} else {
    console.log('Regex not found');
}
