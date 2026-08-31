const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

code = code.replace(
    /'Content-Type': 'application\/json',\s*'x-user-email': currentUser\?\.email \|\| ''/g,
    `'Content-Type': 'application/json',\n          'x-user-email': currentUser?.email || '',\n          'x-user-role': currentUser?.role || ''`
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
