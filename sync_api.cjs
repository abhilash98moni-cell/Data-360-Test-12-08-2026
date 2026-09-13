const fs = require('fs');

const serverContent = fs.readFileSync('server.ts', 'utf8');
let apiContent = fs.readFileSync('api/index.ts', 'utf8');

// 1. Extract the Auditor routes from server.ts
const auditorApiBlockMatch = serverContent.match(/  \/\/ ====================================================================\n  \/\/ Auditor Distributor Access API\n  \/\/ ====================================================================[\s\S]+?  \/\/ Safe 404 handler/);

if (!auditorApiBlockMatch) {
  console.log("Could not find the Auditor block in server.ts");
  process.exit(1);
}

// Remove the "  // Safe 404 handler" part from the match
let auditorBlock = auditorApiBlockMatch[0].replace('  // Safe 404 handler', '').trimEnd() + '\n\n';

// Remove the 2-space indentation since api/index.ts is not wrapped in startServer()
auditorBlock = auditorBlock.split('\n').map(line => line.startsWith('  ') ? line.substring(2) : line).join('\n');

// 2. Inject into api/index.ts before the 404 handler
const handlerMarkerApi = '// Catch-all API 404 handler to prevent returning HTML';

if (apiContent.includes('// Auditor Distributor Access API')) {
    console.log('Auditor block already in api/index.ts. Replacing it...');
    const existingBlock = apiContent.match(/\/\/ ====================================================================\n\/\/ Auditor Distributor Access API\n\/\/ ====================================================================[\s\S]+?\/\/ Catch-all API 404 handler/);
    if (existingBlock) {
        apiContent = apiContent.replace(existingBlock[0], auditorBlock + handlerMarkerApi);
    } else {
        console.log("Could not replace existing block.");
    }
} else {
    apiContent = apiContent.replace(handlerMarkerApi, auditorBlock + handlerMarkerApi);
}

fs.writeFileSync('api/index.ts', apiContent);
console.log("Synced Auditor API block to api/index.ts successfully.");
