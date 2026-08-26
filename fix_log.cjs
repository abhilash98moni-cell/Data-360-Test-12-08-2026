const fs = require('fs');
let code = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf8');

const search = `      if (res.ok) {
        setToastMessage(\`✓ \${samplingModalRecord.fileName} is now available in Sampling.\`);`;

const replace = `      const resData = await res.json().catch(() => ({}));
      if (res.ok) {
        setToastMessage(\`✓ \${samplingModalRecord.fileName} is now available in Sampling.\`);`;

const search2 = `      } else {
        setToastMessage(\`❌ Failed to add document to Sampling. Please try again.\`);
        setTimeout(() => setToastMessage(null), 4000);
      }`;

const replace2 = `      } else {
        console.error("ADD TO SAMPLING ERROR:", resData);
        setToastMessage(\`❌ Failed to add document to Sampling. \${resData.error || ''}\`);
        setTimeout(() => setToastMessage(null), 4000);
      }`;

code = code.replace(search, replace).replace(search2, replace2);
fs.writeFileSync('src/components/EvidenceManagementView.tsx', code);
