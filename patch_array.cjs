const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf-8');
code = code.replace("  '/api/supabase/health', ", "");
fs.writeFileSync('src/app.ts', code);
