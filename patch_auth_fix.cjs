const fs = require('fs');
let code = fs.readFileSync('src/middleware/auth.ts', 'utf-8');
code = code.replace(/Bearers\+/g, "Bearer\\\\s+"); // Actually just replace it with what I want
fs.writeFileSync('src/middleware/auth.ts', code);
