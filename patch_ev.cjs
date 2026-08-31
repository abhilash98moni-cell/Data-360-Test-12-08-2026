const fs = require('fs');
let code = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf-8');

code = code.replace(
    /        <SamplingView\n          currentUser=\{currentUser\}\n          selectedClient=\{selectedClient\}\n          selectedDistributor=\{selectedDistributor\}\n          selectedAuditFilter=\{selectedAuditFilter\}\n        \/>/,
    "        <SamplingView\n          currentUser={currentUser}\n          selectedClient={selectedClient}\n          selectedDistributor={selectedDistributor}\n          selectedAuditFilter={selectedAuditFilter}\n          isEvidenceManagementMode={true}\n        />"
);

fs.writeFileSync('src/components/EvidenceManagementView.tsx', code);
