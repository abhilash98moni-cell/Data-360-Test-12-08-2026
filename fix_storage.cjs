const fs = require('fs');
let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

const regex = /if \(fileName\.toLowerCase\(\)\.endsWith\('\.xlsx'\) \|\| fileName\.toLowerCase\(\)\.endsWith\('\.xls'\)\) \{\n         const xlsxBuffer = this\.generateValidXlsxBuffer\(fileName\);\n         return \{\n           buffer: xlsxBuffer,\n           fileName,\n           mimeType: 'application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet'\n         \};\n      \} else \{/;

code = code.replace(regex, `// No longer falling back to dummy xlsx buffer
      if (false) {`);

fs.writeFileSync('src/services/storageService.ts', code);
