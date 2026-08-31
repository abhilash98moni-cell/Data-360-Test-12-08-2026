const fs = require('fs');
let code = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf-8');

// The `activeMainTab === 'list'` div is closed before `{/* Toast Notification */}` or similar.
// Let's find `      {/* Toast Notification */}` and insert `      </>\n      )}\n      </div>\n` before it!

if (code.includes('{/* Toast Notification */}')) {
    code = code.replace(
        '      {/* Toast Notification */}',
        '      </>\n      )}\n      </div>\n\n      {/* Toast Notification */}'
    );
}

fs.writeFileSync('src/components/EvidenceManagementView.tsx', code);
console.log('Fixed EvidenceManagementView tags');
