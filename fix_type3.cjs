const fs = require('fs');
function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  code = code.replace(/status: 'pending'/g, "status: 'Pending'");
  fs.writeFileSync(filename, code);
}
patch('server.ts');
patch('api/index.ts');
