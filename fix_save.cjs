const fs = require('fs');
let code = fs.readFileSync('src/components/ReportingView.tsx', 'utf8');

const regex = /const saveReport = async \(asFinal = false\) => \{[\s\S]*?\}\;\n\n  const handleFinalizeConfirm/m;

const replacement = `const saveReport = async (asFinal = false) => {
    if (!activeReport || !currentUser) return;
    setIsSaving(!asFinal);

    const updatedOverview = {
      ...activeReport.overview,
      documentData: documentData,
      ...(asFinal && { finalizedAt: new Date().toISOString() }),
    };

    const status = asFinal ? "FINAL" : activeReport.status;
    const version = asFinal ? "1.0" : activeReport.reportVersion;

    try {
      const payload = {
          overview: updatedOverview,
          report_content: documentData,
          status: status,
          report_version: version,
          updated_at: new Date().toISOString(),
          ...(asFinal && { 
            finalized_at: new Date().toISOString(),
            finalized_by: currentUser.id 
          })
      };

      const res = await fetch(\`/api/reports/\${activeReport.id}\`, {
         method: 'PUT',
         headers: {
            'Content-Type': 'application/json',
            'x-user-email': currentUser?.email || ''
         },
         body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSuccessMessage(asFinal ? "Report finalized!" : "Draft saved successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);

      const updatedReport = {
        ...activeReport,
        overview: updatedOverview,
        status,
        reportVersion: version,
        ...(asFinal && { finalizedAt: new Date().toISOString() }),
      };

      setActiveReport(updatedReport);
      setReports((prev) =>
        prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
      );
      return updatedReport;
    } catch (err: any) {
      console.error("Failed to save report", err);
      setDbError("Failed to save report: " + (err.message || String(err)));
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalizeConfirm`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/ReportingView.tsx', code);
    console.log('Successfully updated saveReport');
} else {
    console.log('Regex not found');
}
