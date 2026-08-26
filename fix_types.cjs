const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  "  aiAnalysisTimestamp?: string;",
  "  aiAnalysisTimestamp?: string;\n  documentUsage?: string;\n  auditPeriod?: string;"
);

fs.writeFileSync('src/types.ts', code);
