const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf-8');

// Add import
code = code.replace(
  "import { INITIAL_IIR_REQUESTS } from '../data/iirData';",
  "import { INITIAL_IIR_REQUESTS } from '../data/iirData';\nimport { ExecutiveAuditTimelineDashboard } from './ExecutiveAuditTimelineDashboard';"
);

// Replace from line 311 to end
const lines = code.split('\n');
let returnIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'return (' && lines[i+1] && lines[i+1].includes('w-full p-4')) {
    returnIndex = i;
    break;
  }
}

if (returnIndex !== -1) {
  const newEnd = `  return (
    <ExecutiveAuditTimelineDashboard engagements={engagements} currentUser={currentUser} />
  );
};`;
  code = lines.slice(0, returnIndex).join('\n') + '\n' + newEnd;
  fs.writeFileSync('src/components/DashboardView.tsx', code);
  console.log('Patched successfully');
} else {
  console.log('Return index not found');
}
