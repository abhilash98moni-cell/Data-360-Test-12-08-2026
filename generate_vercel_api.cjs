const fs = require('fs');
const serverContent = fs.readFileSync('server.ts', 'utf8');

const startIndex = serverContent.indexOf('async function startServer() {');
if (startIndex === -1) {
    console.error("Could not find startServer");
    process.exit(1);
}

const beforeStartServer = serverContent.slice(0, startIndex);
let insideStartServer = serverContent.slice(startIndex + 'async function startServer() {'.length);

// Remove the trailing `\n}\nstartServer();\n`
const endIndex = insideStartServer.lastIndexOf('}\nstartServer();');
if (endIndex !== -1) {
    insideStartServer = insideStartServer.slice(0, endIndex);
} else {
    // try different spacing
    const match = insideStartServer.match(/\}([\s\n]*)startServer\(\);([\s\n]*)$/);
    if (match) {
        insideStartServer = insideStartServer.slice(0, match.index);
    }
}

// Remove the 2-space indentation
insideStartServer = insideStartServer.split('\n').map(line => line.startsWith('  ') ? line.substring(2) : line).join('\n');

// Replace the Vite middleware and app.listen with export
const viteRegex = /\/\/ Vite middleware for development or static file serving for production[\s\S]+?app\.listen\(PORT, '0\.0\.0\.0', \(\) => \{[\s\S]+?\}\);/;
insideStartServer = insideStartServer.replace(viteRegex, '// Vercel serverless entry point\nexport default app;\n');

// Build final
let finalContent = beforeStartServer + insideStartServer;

// Remove Vite import
finalContent = finalContent.replace(/import \{ createServer as createViteServer \} from 'vite';\n?/, '');

fs.writeFileSync('api/index.ts', finalContent);
console.log("Successfully rebuilt api/index.ts!");
