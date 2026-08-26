const fs = require('fs');
let code = fs.readFileSync('src/components/EngagementWorkspaceView.tsx', 'utf8');

code = code.replace(
  "currentUser={currentUser}\n        />",
  "currentUser={currentUser}\n          currencyMode={currencyMode}\n        />"
);

fs.writeFileSync('src/components/EngagementWorkspaceView.tsx', code);
