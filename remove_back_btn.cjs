const fs = require('fs');
let code = fs.readFileSync('src/components/ExecutiveAuditTimelineDashboard.tsx', 'utf-8');

code = code.replace(/<button\s+onClick=\{\(\) => setSelectedEngId\(null\)\}[\s\S]*?<ArrowRight className="h-4 w-4 rotate-180" \/> Back to Portfolio\s*<\/button>/, '');

fs.writeFileSync('src/components/ExecutiveAuditTimelineDashboard.tsx', code);
