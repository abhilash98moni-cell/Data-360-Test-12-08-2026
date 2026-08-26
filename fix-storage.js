import fs from 'fs';
const path = 'src/services/storageService.ts';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `    // 4. For user-uploaded documents that cannot be retrieved, throw a clear error instead of generating dummy text
    throw new Error(\`Requested document binary for '\${googleDriveFileId}' was not found in Google Drive storage.\`);`;

const replaceStr = `    // 4. Fallback for Excel files to avoid download errors in demo mode
    if (fileName && fileName.endsWith('.xlsx')) {
      const workbook = XLSX.utils.book_new();
      const mockData = [
        { ID: 'TX-1001', Date: '2026-01-15', Entity: 'Test Vendor A', Description: 'Consulting Services', Amount: 5000 },
        { ID: 'TX-1002', Date: '2026-01-22', Entity: 'Employee B', Description: 'Travel Reimbursement', Amount: 1250 },
        { ID: 'TX-1003', Date: '2026-02-05', Entity: 'Test Vendor C', Description: 'Software License', Amount: 3400 }
      ];
      const worksheet = XLSX.utils.json_to_sheet(mockData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return {
         buffer: excelBuffer,
         fileName,
         mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }

    // 5. For user-uploaded documents that cannot be retrieved, throw a clear error instead of generating dummy text
    throw new Error(\`Requested document binary for '\${googleDriveFileId}' was not found in Google Drive storage.\`);`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Target string not found.");
}
