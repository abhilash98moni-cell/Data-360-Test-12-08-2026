const fs = require('fs');

function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  code = code.replace(/status: 'pending'/g, "status: 'Pending'");
  // Also check if `status` is just being inferred as string in the newRequest object.
  // Wait, let's see what line 2144 is in api/index.ts
  fs.writeFileSync(filename, code);
}
patch('server.ts');
patch('api/index.ts');

