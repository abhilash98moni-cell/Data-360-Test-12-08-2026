const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

code = code.replace(
    /          'x-user-role': currentUser\?\.role \|\| '',\n             'x-user-role': currentUser\?\.role \|\| '',/g,
    `          'x-user-role': currentUser?.role || '',`
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
