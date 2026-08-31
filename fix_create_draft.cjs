const fs = require('fs');
let code = fs.readFileSync('src/components/ReportingView.tsx', 'utf8');

const regex = /try \{\s*const \{ error \} = await supabase\.from\("audit_reports"\)\.insert\(\[\s*\{([\s\S]*?)\},\s*\]\);\s*if \(error\) \{\s*throw error;\s*\}\s*setReports\(\[newReport, \.\.\.reports\]\);\s*setIsCreating\(false\);\s*setActiveReport\(newReport\);\s*\} catch \(err: any\) \{/m;

const replacement = `try {
      const payload = {
$1
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

      setReports([newReport, ...reports]);
      setIsCreating(false);
      setActiveReport(newReport);
    } catch (err: any) {`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/ReportingView.tsx', code);
    console.log('Successfully updated create draft API call');
} else {
    console.log('Regex not found');
}
