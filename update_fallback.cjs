const fs = require('fs');
const file = 'src/services/storageService.ts';
let code = fs.readFileSync(file, 'utf8');

const searchRegex = /\/\/ 4\. Fallback for Excel files to avoid download errors in demo mode\s*console\.log\('Fallback checking fileName:', fileName\); if \(fileName && fileName\.toLowerCase\(\)\.endsWith\('\.xlsx'\)\) \{.*?\n    \}/s;

const replacement = `// 4. Fallback for Excel files to avoid download errors in demo mode
    console.log('Fallback checking fileName:', fileName); 
    if (fileName && (fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls') || fileName.toLowerCase().endsWith('.csv'))) {
      const workbook = XLSX.utils.book_new();
      const mockData = [
        { ID: 'TX-1001', Date: '2026-01-15', Entity: 'Test Vendor A', Description: 'Consulting Services', Amount: 5000 },
        { ID: 'TX-1002', Date: '2026-01-22', Entity: 'Employee B', Description: 'Travel Reimbursement', Amount: 1250 },
        { ID: 'TX-1003', Date: '2026-02-05', Entity: 'Test Vendor C', Description: 'Software License', Amount: 3400 }
      ];
      const worksheet = XLSX.utils.json_to_sheet(mockData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      
      const isCsv = fileName.toLowerCase().endsWith('.csv');
      const outBuffer = isCsv 
          ? Buffer.from(XLSX.write(workbook, { type: 'string', bookType: 'csv' }))
          : XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
          
      return {
         buffer: outBuffer,
         fileName,
         mimeType: isCsv ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }`;

if (code.match(searchRegex)) {
    code = code.replace(searchRegex, replacement);
    fs.writeFileSync(file, code);
    console.log("Successfully updated storageService.ts");
} else {
    console.log("Could not match the regex");
}
