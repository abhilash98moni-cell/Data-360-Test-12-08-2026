const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

// Hide the tabs container completely if in evidence management mode or distributor
code = code.replace(
    /        \{\/\* Sub-Tabs \*\/\}\n        <div className="flex gap-2 border-b border-slate-800">\n          \{\[\n            \{ id: 'GL', label: 'General Ledger - Sample' \},\n            \.\.\.\(\!isDistributor && \!isEvidenceManagementMode \? \[\n              \{ id: '3PD', label: '3rd Party Disbursement' \},\n              \{ id: 'EMP', label: 'Employee Disbursement & Reimbursement' \},\n              \{ id: 'SALES', label: 'Sales Testing' \}\n            \] : \[\]\)\n          \]\.map/,
    `        {/* Sub-Tabs */}
        {(!isDistributor && !isEvidenceManagementMode) && (
        <div className="flex gap-2 border-b border-slate-800">
          {[
            { id: 'GL', label: 'General Ledger - Sample' },
            ...(!isDistributor && !isEvidenceManagementMode ? [
              { id: '3PD', label: '3rd Party Disbursement' },
              { id: 'EMP', label: 'Employee Disbursement & Reimbursement' },
              { id: 'SALES', label: 'Sales Testing' }
            ] : [])
          ].map`
);

// We need to close the added block `)}` after the closing `</div>` of the map.
// The structure is:
//          ].map(tab => (
//            <button ... > ... </button>
//          ))}
//        </div>

code = code.replace(
    /            <\/button>\n          \)\)}\n        <\/div>/,
    `            </button>
          ))}
        </div>
        )}`
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
