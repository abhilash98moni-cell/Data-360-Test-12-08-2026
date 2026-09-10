const fs = require('fs');

let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

const targetStartStr = `    // 2. Authoritative local/persistent storage resolution (disk uploads, metadata, audit logs)
    const resolvedBinary = await this.resolveBinary(targetDriveFileId, fileName) || await this.resolveBinary(googleDriveFileId, fallbackFileName);`;

const startIdx = code.indexOf(targetStartStr);
if (startIdx === -1) {
  console.log("Could not find start index");
  process.exit(1);
}

const endStr = `throw new Error(\`Requested document binary for '\${googleDriveFileId}' was not found in storage. fileName was: \${fileName}\`);`;
const endIdx = code.indexOf(endStr, startIdx);
if (endIdx === -1) {
  console.log("Could not find end index");
  process.exit(1);
}

const newBlock = `    // 2. Remove fallback logic, strictly require Google Drive
    throw new Error(\`Requested document binary for '\${googleDriveFileId}' was not found in storage. fileName was: \${fileName}\`);`;

code = code.substring(0, startIdx) + newBlock + code.substring(endIdx + endStr.length);
fs.writeFileSync('src/services/storageService.ts', code);
console.log("Download block patched!");
