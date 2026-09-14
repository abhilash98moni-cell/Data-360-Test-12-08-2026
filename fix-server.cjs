const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/Failed to download file from Google Drive/g, 'Failed to download file from storage');
fs.writeFileSync('server.ts', code);
