const fs = require('fs');
let code = fs.readFileSync('src/components/EngagementWorkspaceView.tsx', 'utf8');

code = code.replace(
  "onDistributorChangeGlobal,\n  currencyMode?: (distributor: string) => void;",
  "onDistributorChangeGlobal?: (distributor: string) => void;"
);

code = code.replace(
  "onToggleIIRFullScreen,\n  onDistributorChangeGlobal\n}) => {",
  "onToggleIIRFullScreen,\n  onDistributorChangeGlobal,\n  currencyMode\n}) => {"
);

fs.writeFileSync('src/components/EngagementWorkspaceView.tsx', code);
