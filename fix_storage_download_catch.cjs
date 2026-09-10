const fs = require('fs');

let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

const targetCatchStr = `      } catch (err: any) {
        console.error(\`Error downloading file '\${targetDriveFileId}' from Google Drive API:\`, err.message);
      }
    }`;

const newCatchStr = `      } catch (err: any) {
        console.error(\`Error downloading file '\${targetDriveFileId}' from Google Drive API:\`, err.message);
        throw new Error(\`Google Drive download failed: \${err.message}\`);
      }
    }`;

code = code.replace(targetCatchStr, newCatchStr);
fs.writeFileSync('src/services/storageService.ts', code);
console.log("Download catch block patched!");
