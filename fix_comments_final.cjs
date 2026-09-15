const fs = require('fs');
let code = fs.readFileSync('src/components/ExecutiveAuditTimelineDashboard.tsx', 'utf-8');

code = code.replace('{/* PORTFOLIO OVERVIEW */}', '');
code = code.replace('{/* DETAILED DISTRIBUTOR VIEW */}', '');
code = code.replace('/* PORTFOLIO OVERVIEW */', '');
code = code.replace('/* DETAILED DISTRIBUTOR VIEW */', '');

fs.writeFileSync('src/components/ExecutiveAuditTimelineDashboard.tsx', code);
