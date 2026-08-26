const fs = require('fs');
let code = fs.readFileSync('src/services/storageService.ts', 'utf8');
code = code.replace(
  "const isSeedFile = googleDriveFileId.startsWith('gdrive-mock') || \\n                       googleDriveFileId.startsWith('file-') || ",
  "const isSeedFile = googleDriveFileId.startsWith('gdrive-mock') || \\n                       "
);
fs.writeFileSync('src/services/storageService.ts', code);
