const fs = require('fs');
let code = fs.readFileSync('src/components/ReportingView.tsx', 'utf8');

const regex = /const handleCreateNewReport = async \(\) => \{[\s\S]*?\}\;\n\n  const saveReport/m;

const replacement = `const handleCreateNewReport = async () => {
    if (!currentUser) return;
    setIsSaving(true);

    const newId = crypto.randomUUID();
    const newReport: ReportMetadata = {
      id: newId,
      clientId: selectedClient,
      distributorId: selectedDistributor,
      auditId: newReportAuditId,
      reportType: "Distributor Audit Report",
      templateId: newReportTemplate,
      templateVersion: "1.0",
      reportVersion: "draft",
      status: "DRAFT",
      createdBy: currentUser.id,
      createdByEmail: currentUser.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      overview: {
        documentData: {},
        background: "",
        executiveSummary: "",
        overallRating: "Needs Improvement",
        keyFindings: [],
        cashDisbursements: "",
        generalLedger: "",
        internalControls: "",
        accountsReceivable: "",
      },
    };

    try {
      const payload = {
          id: newId,
          report_id: \`rep-\${Date.now()}\`,
          client_id: newReport.clientId,
          client_name: newReport.clientId,
          distributor_id: newReport.distributorId,
          distributor_name: selectedDistributor,
          audit_id: newReport.auditId,
          report_type: newReport.reportType,
          template_id: newReport.templateId,
          template_version: newReport.templateVersion,
          report_version: newReport.reportVersion,
          status: newReport.status,
          created_by: currentUser.id,
          created_by_email: currentUser.email,
          created_at: newReport.createdAt,
          updated_at: newReport.updatedAt,
          overview: newReport.overview,
      };

      const res = await fetch('/api/reports', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'x-user-email': currentUser?.email || ''
         },
         body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setReports((prev) => [newReport, ...prev]);
      setIsCreating(false);
      setActiveReport(newReport);
    } catch (err: any) {
      console.error("Failed to create report", err);
      setDbError("Failed to create report: " + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const saveReport`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/ReportingView.tsx', code);
    console.log('Successfully updated handleCreateNewReport');
} else {
    console.log('Regex not found');
}
