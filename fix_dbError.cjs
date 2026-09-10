const fs = require('fs');
function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  code = code.replace(/ \|\| dbError\?\.message /g, ' ');
  fs.writeFileSync(filename, code);
}
patch('src/components/AuthModal.tsx');
patch('src/components/LoginPage.tsx');
