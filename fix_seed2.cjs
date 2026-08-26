const fs = require('fs');
let code = fs.readFileSync('src/services/storageService.ts', 'utf8');
code = code.replace("googleDriveFileId.startsWith('file-') || ", "");
fs.writeFileSync('src/services/storageService.ts', code);
