const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Global replacements for spoofable headers in server.ts
content = content.replace(/req\.headers\['x-user-role'\]\s*\|\|\s*/g, '');
content = content.replace(/\(req\.headers\['x-user-role'\] as string\)\s*\|\|\s*/g, '');
content = content.replace(/req\.headers\['x-user-organization'\]\s*\|\|\s*/g, '');
content = content.replace(/req\.headers\['x-user-org'\]\s*\|\|\s*/g, '');
content = content.replace(/req\.headers\['x-user-email'\]\s*\|\|\s*/g, '');
content = content.replace(/req\.query\.role\s*\|\|\s*/g, '');

fs.writeFileSync('server.ts', content);
