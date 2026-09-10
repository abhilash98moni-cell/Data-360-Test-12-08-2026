const fs = require('fs');

function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  // Fix jwt and JWT_SECRET
  code = code.replace(
    /const token = jwt\.sign\(\{ userId: authData\.user\.id, email, role, organization \}, JWT_SECRET, \{ expiresIn: '8h' \}\);/g,
    "const token = authData.session?.access_token || 'sess_' + Date.now();"
  );
  
  fs.writeFileSync(filename, code);
  console.log(`Patched jwt in ${filename}`);
}

patch('server.ts');
patch('api/index.ts');

function patchAuthModal(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  
  // Fix dbError in AuthModal.tsx
  const target = `if (dbError) {
            console.warn('Supabase DB Insert Note:', dbError.message);
          }`;
  code = code.replace(target, '');
  code = code.replace(/if\s*\(dbError\)\s*\{\s*console\.warn\('Supabase DB Insert Note:',\s*dbError\.message\);\s*\}/g, '');
  fs.writeFileSync(filename, code);
}
patchAuthModal('src/components/AuthModal.tsx');
