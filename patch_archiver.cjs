const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "import archiver = require('archiver');",
  "// @ts-ignore\nimport archiver from 'archiver';"
);

fs.writeFileSync('server.ts', content);
console.log('patched server.ts');
