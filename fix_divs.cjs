const fs = require('fs');
let code = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf8');

const badPattern = `      )}
      <div style={{ display: activeMainTab === 'list' ? 'block' : 'none' }}>
      {activeMainTab === 'upload' && (`;

if (code.includes(badPattern)) {
    console.log("Found bad pattern!");
} else {
    console.log("Not found bad pattern.");
}
