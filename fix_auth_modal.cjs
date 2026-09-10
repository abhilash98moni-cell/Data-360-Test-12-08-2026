const fs = require('fs');

let code = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

// Replace the client-side insert
code = code.replace(/\/\/ Direct browser SDK insert into Supabase pending_signup_requests[\s\S]*?if\s*\(dbError\)\s*\{\s*console\.warn\('Supabase DB Insert Note:',\s*dbError\.message\);\s*\}/m, '');

// Also fix the conditional check further down: if ((res.ok && data.success) || !dbError) {
code = code.replace(/if \(\(res\.ok && data\.success\) \|\| !dbError\) \{/m, 'if (res.ok && data.success) {');

fs.writeFileSync('src/components/AuthModal.tsx', code);
