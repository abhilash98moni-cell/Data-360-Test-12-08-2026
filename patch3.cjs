const fs = require('fs');

let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

code = code.replace(
    "        {activeTab === '3PD' && renderTestingTab('3rd Party Disbursement')}\n        {activeTab === 'EMP' && renderTestingTab('Employee Disbursement & Reimbursement')}\n        {activeTab === 'SALES' && renderTestingTab('Sales Testing')}",
    "        {!isDistributor && activeTab === '3PD' && renderTestingTab('3rd Party Disbursement')}\n        {!isDistributor && activeTab === 'EMP' && renderTestingTab('Employee Disbursement & Reimbursement')}\n        {!isDistributor && activeTab === 'SALES' && renderTestingTab('Sales Testing')}"
);

// Also fix colSpan in empty row
code = code.replace(
    "<tr><td colSpan={8} className=\"py-12 text-center text-slate-400\">No records found.</td></tr>",
    "<tr><td colSpan={isDistributor ? 7 : 8} className=\"py-12 text-center text-slate-400\">No records found.</td></tr>"
);


fs.writeFileSync('src/components/SamplingView.tsx', code);
