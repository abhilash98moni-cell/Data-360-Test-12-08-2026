const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

// Add isEvidenceManagementMode to props
code = code.replace(
    /interface SamplingViewProps \{/,
    "interface SamplingViewProps {\n  isEvidenceManagementMode?: boolean;"
);

code = code.replace(
    /export const SamplingView: React\.FC<SamplingViewProps> = \(\{/,
    "export const SamplingView: React.FC<SamplingViewProps> = ({\n  isEvidenceManagementMode = false,"
);

// In rendering tabs
code = code.replace(
    /            \.\.\.\(\!isDistributor \? \[/,
    "            ...(!isDistributor && !isEvidenceManagementMode ? ["
);

code = code.replace(
    /        \{\!isDistributor && activeTab === '3PD' && renderTestingTab\('3rd Party Disbursement'\)\}/,
    "        {!isDistributor && !isEvidenceManagementMode && activeTab === '3PD' && renderTestingTab('3rd Party Disbursement')}"
);
code = code.replace(
    /        \{\!isDistributor && activeTab === 'EMP' && renderTestingTab\('Employee Disbursement & Reimbursement'\)\}/,
    "        {!isDistributor && !isEvidenceManagementMode && activeTab === 'EMP' && renderTestingTab('Employee Disbursement & Reimbursement')}"
);
code = code.replace(
    /        \{\!isDistributor && activeTab === 'SALES' && renderTestingTab\('Sales Testing'\)\}/,
    "        {!isDistributor && !isEvidenceManagementMode && activeTab === 'SALES' && renderTestingTab('Sales Testing')}"
);

// In GL Tab rendering
code = code.replace(
    /\{\!isDistributor && <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-\[10px\] bg-slate-900">Testing Classification<\/th>\}/,
    "{!isDistributor && !isEvidenceManagementMode && <th className=\"py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] bg-slate-900\">Testing Classification</th>}"
);

code = code.replace(
    /<tr><td colSpan=\{isDistributor \? 7 : 8\} className="py-12 text-center text-slate-400">No records found\.<\/td><\/tr>/,
    "<tr><td colSpan={isDistributor || isEvidenceManagementMode ? 7 : 8} className=\"py-12 text-center text-slate-400\">No records found.</td></tr>"
);

code = code.replace(
    /\{\!isDistributor && \(/,
    "{!isDistributor && !isEvidenceManagementMode && ("
);

// Hide Auditor controls in GL tab
code = code.replace(
    /      \{\!isDistributor && renderReviewModal\(\)\}/,
    "      {!isDistributor && !isEvidenceManagementMode && renderReviewModal()}"
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
