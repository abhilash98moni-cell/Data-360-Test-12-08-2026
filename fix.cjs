const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/if \(search if \(search && search\.trim\(\)\.length > 0\)if \(search && search\.trim\(\)\.length > 0\) search\.trim\(\)\.length > 0\)/, 'if (search && search.trim().length > 0)');
fs.writeFileSync('server.ts', code);
