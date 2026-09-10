const fs = require('fs');

function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  // Replace fetch
  code = code.replace(
    /const res = await fetch\('\/api\/supabase\/health'\);/g,
    "const res = await fetch('/api/supabase/health', { cache: 'no-store' });"
  );

  // Replace error checking block
  const oldErrorCheck = /if \(!res\.ok && !data\.error\) \{\s*data\.error = `HTTP Error \$\{res\.status\}`;\s*\}/g;
  const newErrorCheck = `if (data.connected === true) {
        // Force success
      } else if (!res.ok && !data.error) {
        data.error = \`HTTP Error \$\{res.status\}\`;
      }`;
  code = code.replace(oldErrorCheck, newErrorCheck);

  if (filename.includes('Header.tsx')) {
    // Replace hardcoded URL
    const hardcodedURL = /jellfdqrymlnvebdcwpj\.supabase\.co/g;
    code = code.replace(hardcodedURL, '{status?.url ? status.url.replace(/^https?:\\/\\//, "") : "Checking DB Status..."}');
  }

  fs.writeFileSync(filename, code);
  console.log(`Patched ${filename}`);
}

patch('src/components/Header.tsx');
patch('src/components/GoogleDriveStorageCard.tsx');

