const fs = require('fs');
let code = fs.readFileSync('src/components/ReportingView.tsx', 'utf8');

const regex = /const handleDeleteConfirm = async \(\) => \{[\s\S]*?\}\;\n\n  const handleDownload/m;

const replacement = `const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(\`/api/reports/\${deleteTargetId}\`, {
         method: 'DELETE',
         headers: {
            'x-user-email': currentUser?.email || ''
         }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setReports(reports.filter((r) => r.id !== deleteTargetId));
      if (activeReport?.id === deleteTargetId) {
        setActiveReport(null);
      }
      setDeleteTargetId(null);
      setSuccessMessage("Report deleted successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Error deleting report");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/ReportingView.tsx', code);
    console.log('Successfully updated handleDeleteConfirm');
} else {
    console.log('Regex not found');
}
