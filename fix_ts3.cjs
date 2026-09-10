const fs = require('fs');
function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  code = code.replace(/status: 'Pending' as 'Pending' \| 'Approved' \| 'Rejected';/g, "status: 'Pending' | 'Approved' | 'Rejected';");
  code = code.replace(/status: 'Pending' as 'Pending' as const/g, "status: 'Pending' as 'Pending'");
  fs.writeFileSync(filename, code);
}
patch('server.ts');
patch('api/index.ts');
