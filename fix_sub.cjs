const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Fix 1: userAuth.sub -> userAuth.id in middleware
content = content.replace(/userAuth\.sub/g, 'userAuth.id');

// Fix 2: req.auth?.sub -> req.auth?.id in /api/users/me/distributors
content = content.replace(/req\.auth\?\.sub/g, 'req.auth?.id');

fs.writeFileSync('server.ts', content);
