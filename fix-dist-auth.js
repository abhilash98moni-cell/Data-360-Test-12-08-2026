import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');
// Fix global distributor check to use req.auth.id when req.auth.sub is undefined
content = content.replace(
  /.eq\('auditor_user_id', userAuth\.sub\)/g,
  `.eq('auditor_user_id', userAuth.sub || userAuth.id)`
);

fs.writeFileSync('server.ts', content);
