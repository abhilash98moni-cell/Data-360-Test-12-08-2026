const fs = require('fs');
let code = fs.readFileSync('src/components/EngagementWorkspaceView.tsx', 'utf8');

code = code.replace(
  "onDistributorChangeGlobal\n}) => {",
  "onDistributorChangeGlobal,\n  currencyMode\n}) => {"
);

fs.writeFileSync('src/components/EngagementWorkspaceView.tsx', code);
