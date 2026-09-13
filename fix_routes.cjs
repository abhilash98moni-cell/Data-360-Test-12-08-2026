const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// The block to extract
const auditorApiBlockMatch = content.match(/  \/\/ ====================================================================\n  \/\/ Auditor Distributor Access API\n  \/\/ ====================================================================[\s\S]+?  \/\/ Vite middleware for development or static file serving for production/);

if (!auditorApiBlockMatch) {
  console.log("Could not find the Auditor block");
  process.exit(1);
}

// Keep the Vite comment part
const blockToExtract = auditorApiBlockMatch[0].replace('  // Vite middleware for development or static file serving for production', '').trimEnd() + '\n\n';

// Remove the extracted block from its current location
content = content.replace(blockToExtract, '');

// Insert it BEFORE the 404 handler
const handlerMarker = '  // Safe 404 handler for all unmatched API routes to prevent returning HTML index.html';
content = content.replace(handlerMarker, blockToExtract + handlerMarker);

fs.writeFileSync('server.ts', content);
console.log("Moved Auditor API block successfully.");
