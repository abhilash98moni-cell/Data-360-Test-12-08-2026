const fs = require('fs');

let code = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf-8');

// The ternary is there.
// We want to change:
// {evidenceMode === 'Sampling' ? ( ... ) : ( <>
// to
// {evidenceMode === 'Sampling' && ( ... )}
// <div style={{ display: evidenceMode === 'All Evidence' ? 'block' : 'none' }}>

code = code.replace(
    /\{evidenceMode === 'Sampling' \? \([\s\S]*?\) : \(\s*<>/,
    `{evidenceMode === 'Sampling' && (
        <SamplingView
          currentUser={currentUser}
          selectedClient={selectedClient}
          selectedDistributor={selectedDistributor}
          selectedAuditFilter={selectedAuditFilter}
        />
      )}
      <div style={{ display: evidenceMode === 'All Evidence' ? 'block' : 'none' }}>`
);

// We also need to change the closing:
//       </>
//       )}
//       </div>
//
//       {/* Toast Notification */}

code = code.replace(
    /\s*<\/>\s*\)\}\s*<\/div>\s*\{\/\* Toast Notification \*\/\}/,
    `\n      </div>\n      </div>\n      {/* Toast Notification */}`
);

fs.writeFileSync('src/components/EvidenceManagementView.tsx', code);
