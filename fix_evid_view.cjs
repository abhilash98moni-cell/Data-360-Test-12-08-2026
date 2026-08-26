const fs = require('fs');
let code = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf8');

code = code.replace(
  /filteredRecords\.map\(\(item\) => \{/,
  "filteredRecords.map((item, idx) => {"
);
code = code.replace(
  /<tr key=\{item\.id\}/,
  "<tr key={`evd-${item.id}-${idx}`}"
);

fs.writeFileSync('src/components/EvidenceManagementView.tsx', code);
