const fs = require('fs');

function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  code = code.replace(/\s*password_hash TEXT NOT NULL,?\n/g, '\n');
  fs.writeFileSync(filename, code);
  console.log(`Patched schema ${filename}`);
}

patch('supabase_schema.sql');
patch('src/db/supabase_schema.sql');
