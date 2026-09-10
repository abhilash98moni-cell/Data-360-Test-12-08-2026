const fs = require('fs');

let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

const targetStr = `this.saveBinaryBuffer(realDriveFileId, fileName, mimeType || 'application/octet-stream', fileBuffer, [fileMeta.id, fileMeta.evidenceId, fileName]);`;
code = code.replace(targetStr, `// Fallback local storage disabled\n    // ${targetStr}`);
fs.writeFileSync('src/services/storageService.ts', code);
console.log("Upload saveBinaryBuffer removed!");
