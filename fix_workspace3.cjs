const fs = require('fs');
let code = fs.readFileSync('src/components/EngagementWorkspaceView.tsx', 'utf8');

code = code.replace(
  "onDistributorChangeGlobal,\n  currencyMode?: (distributor: string) => void;",
  "onDistributorChangeGlobal?: (distributor: string) => void;"
);

// also let's just do it directly if the first replace failed
code = code.replace("onDistributorChangeGlobal,", "onDistributorChangeGlobal?: (distributor: string) => void;");
code = code.replace("currencyMode?: (distributor: string) => void;", "");

fs.writeFileSync('src/components/EngagementWorkspaceView.tsx', code);
