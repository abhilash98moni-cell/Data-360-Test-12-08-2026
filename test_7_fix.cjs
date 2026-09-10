const fs = require('fs');

let code = fs.readFileSync('api/index.ts', 'utf8');
code = code.replace(/maybeSingle\(\)/g, "limit(1).maybeSingle()");
fs.writeFileSync('api/index.ts', code);
