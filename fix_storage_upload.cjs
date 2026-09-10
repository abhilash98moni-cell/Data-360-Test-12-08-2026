const fs = require('fs');

let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

// I need to replace the entire try/catch block inside `uploadFile`
// starting at `try {` after `const requestParents`
// down to `if (!realDriveFileId) { realDriveFileId = \`file-\${Date.now()}\`; }`

const targetStartStr = `    const requestParents = validParents.length > 0 ? validParents : (this.rootFolderId && !this.rootFolderId.startsWith('fallback-') && !this.rootFolderId.startsWith('mock-') ? [this.rootFolderId] : undefined);`;

const startIdx = code.indexOf(targetStartStr);
if (startIdx === -1) {
  console.log("Could not find start index");
  process.exit(1);
}

const endStr = `    if (!realDriveFileId) {
      realDriveFileId = \`file-\${Date.now()}\`;
    }`;
const endIdx = code.indexOf(endStr, startIdx);
if (endIdx === -1) {
  console.log("Could not find end index");
  process.exit(1);
}

const newBlock = `    const requestParents = validParents.length > 0 ? validParents : (this.rootFolderId && !this.rootFolderId.startsWith('fallback-') && !this.rootFolderId.startsWith('mock-') ? [this.rootFolderId] : undefined);

    try {
      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);

      const media = {
        mimeType: mimeType || 'application/octet-stream',
        body: readableStream
      };

      const fileRes = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: requestParents
        },
        media: media,
        fields: 'id, name, webViewLink, webContentLink'
      });

      if (fileRes.data && fileRes.data.id) {
        realDriveFileId = fileRes.data.id;
        webViewLink = fileRes.data.webViewLink || '';
        webContentLink = fileRes.data.webContentLink || '';
        console.log(\`✅ File '\${fileName}' uploaded to Google Drive. Target folder: \${targetFolderId}, Real File ID: \${realDriveFileId}\`);
      } else {
        throw new Error('Google Drive API returned success but no file ID was provided.');
      }
    } catch (createErr: any) {
      console.error(\`Fatal Google Drive upload failure for '\${fileName}':\`, createErr.message);
      // If it's a specific API error, we can extract it
      if (createErr.response && createErr.response.data) {
         console.error('GDrive Response Details:', createErr.response.data);
      }
      throw new Error(\`Failed to upload to Google Drive: \${createErr.message}\`);
    }`;

code = code.substring(0, startIdx) + newBlock + code.substring(endIdx + endStr.length);
fs.writeFileSync('src/services/storageService.ts', code);
console.log("Upload block patched!");
