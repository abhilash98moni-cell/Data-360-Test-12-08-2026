const fs = require('fs');
let code = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf8');

if (code.trim().endsWith('</div>')) {
  code = code.trim() + '\n  );\n};';
  fs.writeFileSync('src/components/EvidenceManagementView.tsx', code);
}
