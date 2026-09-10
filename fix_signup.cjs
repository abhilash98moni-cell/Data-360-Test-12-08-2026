const fs = require('fs');

function patchFile(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  
  if (!code.includes("import bcrypt from 'bcryptjs'")) {
    // Add import
    code = code.replace(/import express from 'express';/m, "import express from 'express';\nimport bcrypt from 'bcryptjs';");
  }

  // Find the exact place where it inserts into pending_signup_requests
  const targetRegex = /const \{ data, error \} = await client\.from\('pending_signup_requests'\)\.insert\(\{\s*email,\s*password_hash:\s*password,/m;
  const replacement = `
      // Hash password securely
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const { data, error } = await client.from('pending_signup_requests').insert({
        email,
        password_hash: hashedPassword,`;

  if (targetRegex.test(code)) {
    code = code.replace(targetRegex, replacement);
  } else {
    console.warn(`Could not find target regex in ${filename}`);
  }
  
  fs.writeFileSync(filename, code);
  console.log(`Patched ${filename}`);
}

patchFile('server.ts');
patchFile('api/index.ts');

