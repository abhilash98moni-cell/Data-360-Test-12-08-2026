const fs = require('fs');
let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

const strStart = `    // 3. Fallback for pre-seeded demo/mock files`;
const strEnd = `// 4. For user-uploaded documents that cannot be retrieved`;

if (code.includes(strStart) && code.includes(strEnd)) {
    const p1 = code.indexOf(strStart);
    const p2 = code.indexOf(strEnd);
    
    const newBlock = `    // 3. Fallback for pre-seeded demo/mock files
    const isSeedFile = googleDriveFileId === 'ev-101' || googleDriveFileId === 'ev-102';
    
    if (isSeedFile) {
      const pdfBuffer = this.generateValidPdfBuffer(
         \`DATA360 DEMO DOCUMENT: \${fileName}\`,
         \`File Name: \${fileName} | ID: \${googleDriveFileId} | Pre-seeded Reference Stream\`
      );
      return {
         buffer: pdfBuffer,
         fileName,
         mimeType: mimeType.includes('pdf') || mimeType === 'application/octet-stream' ? 'application/pdf' : mimeType
      };
    }
    
    `;
    
    code = code.substring(0, p1) + newBlock + code.substring(p2);
    fs.writeFileSync('src/services/storageService.ts', code);
}
