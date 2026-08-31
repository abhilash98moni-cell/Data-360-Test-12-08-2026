const fs = require('fs');

const code = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf-8');

// I will just parse and remove the extra `</>` and check the brackets.
// First, let's remove `</>` and `)}` from the end that was part of the old ternary.
let newCode = code.replace(
    /\s*<\/>\s*\)\}\s*<\/div>\s*\{\/\* Toast Notification \*\/\}/g,
    "\n      </div>\n      {/* Toast Notification */}"
);

// Actually, let's just see where the brackets are imbalanced.
// `activeMainTab === 'list'` is on line 708: `<div style={{ display: activeMainTab === 'list' ? 'block' : 'none' }}>`
// Then line 733: `<div style={{ display: evidenceMode === 'All Evidence' ? 'block' : 'none' }}>`

fs.writeFileSync('src/components/EvidenceManagementView.tsx', newCode);
