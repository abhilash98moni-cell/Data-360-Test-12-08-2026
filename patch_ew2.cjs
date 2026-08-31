const fs = require('fs');
let code = fs.readFileSync('src/components/EngagementWorkspaceView.tsx', 'utf-8');

code = code.replace(
    /        <SamplingView\n          selectedClient=\{selectedClient\}\n          selectedDistributor=\{distributorProp\}\n          selectedAuditFilter=\{selectedAuditFilter\}\n          currentUser=\{currentUser\}\n          currencyMode=\{currencyMode\}\n        \/>/,
    "        <SamplingView\n          selectedClient={selectedClient}\n          selectedDistributor={distributorProp}\n          selectedAuditFilter={selectedAuditFilter}\n          currentUser={currentUser}\n          currencyMode={currencyMode}\n          isEvidenceManagementMode={true}\n        />"
);

fs.writeFileSync('src/components/EngagementWorkspaceView.tsx', code);
