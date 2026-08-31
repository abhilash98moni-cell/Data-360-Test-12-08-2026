const fs = require('fs');

let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

code = code.replace(
    /\{\[\s*\{\s*id: 'GL',\s*label: 'General Ledger - Sample'\s*\},[\s\S]*?\{\s*id: 'SALES',\s*label: 'Sales Testing'\s*\}\s*\]\.map/,
    `{[
            { id: 'GL', label: 'General Ledger - Sample' },
            ...(!isDistributor ? [
              { id: '3PD', label: '3rd Party Disbursement' },
              { id: 'EMP', label: 'Employee Disbursement & Reimbursement' },
              { id: 'SALES', label: 'Sales Testing' }
            ] : [])
          ].map`
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
