const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const newContent = content.replace(
  "selectedDistributor={selectedDistributor}",
  "selectedDistributor={selectedDistributor}\n              onDistributorChangeGlobal={setSelectedDistributor}"
);
fs.writeFileSync('src/App.tsx', newContent);
console.log('patched App.tsx');
