const fs = require('fs');

let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

// Move `const allDists = getDistributorsForClient(selectedClient);`
const allDistsDecl = "  const allDists = getDistributorsForClient(selectedClient);\\n";
content = content.replace(allDistsDecl, "");

// Find `useEffect` and insert above
content = content.replace("  useEffect(() => {", "  const allDists = getDistributorsForClient(selectedClient);\n\n  useEffect(() => {");

fs.writeFileSync('src/components/Header.tsx', content);
console.log("Moved allDists successfully");
