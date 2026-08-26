const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const seedBlock = `
    const xlsxBuffer = fs.readFileSync('test_upload.xlsx');
    storageService.saveBinaryBuffer('file-1787556487877', 'Tanvis-Sales-Tracker.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xlsxBuffer, ['file-1787556487877']);
    storageService.saveBinaryBuffer('EVD-461-UP', 'Tanvis-Sales-Tracker.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xlsxBuffer, ['EVD-461-UP']);
`;

if (!code.includes("storageService.saveBinaryBuffer('file-1787556487877'")) {
    code = code.replace("app.listen(PORT", seedBlock + "\n  app.listen(PORT");
    fs.writeFileSync('server.ts', code);
}
