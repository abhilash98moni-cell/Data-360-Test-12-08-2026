const fs = require('fs');
function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  code = code.replace(/password: '',/g, '');
  code = code.replace(/role: validRole,/g, "role: validRole as 'Admin' | 'Auditor' | 'Distributor',");
  fs.writeFileSync(filename, code);
}
patch('server.ts');
patch('api/index.ts');
