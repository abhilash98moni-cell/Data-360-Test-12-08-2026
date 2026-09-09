const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf-8');
code = code.replace(/'\/api\/supabase\/health',\s*/, "");
code = code.replace(/'\/api\/auth\/login',\s*/, "");
code = code.replace(/'\/api\/auth\/signup-request',\s*/, "");
code = code.replace(/'\/api\/admin\/approve-signup',\s*/, "");
fs.writeFileSync('src/app.ts', code);
