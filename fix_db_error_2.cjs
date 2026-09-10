const fs = require('fs');
function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  code = code.replace(/if\s*\(dbError\)\s*\{\s*console\.warn\([\s\S]*?\);\s*\}/g, '');
  code = code.replace(/console\.warn\('Supabase DB Insert Note:',\s*dbError\.message\);/g, '');
  // Also any mention of dbError
  code = code.replace(/console\.log\('Supabase Note:',\s*dbError\?.message\);/g, '');
  code = code.replace(/,\s*dbError/g, '');
  
  fs.writeFileSync(filename, code);
}
patch('src/components/AuthModal.tsx');
patch('src/components/LoginPage.tsx');
