const fs = require('fs');
let code = fs.readFileSync('src/components/EngagementWorkspaceView.tsx', 'utf-8');

code = code.replace(
    /        <SamplingView\n          currentUser=\{currentUser\}\n          selectedClient=\{engagement\.clientName\}\n          selectedDistributor=\{engagement\.distributorName\}\n          selectedAuditFilter=\{engagement\.id\}\n        \/>/,
    "        <SamplingView\n          currentUser={currentUser}\n          selectedClient={engagement.clientName}\n          selectedDistributor={engagement.distributorName}\n          selectedAuditFilter={engagement.id}\n          isEvidenceManagementMode={true}\n        />"
);

fs.writeFileSync('src/components/EngagementWorkspaceView.tsx', code);
