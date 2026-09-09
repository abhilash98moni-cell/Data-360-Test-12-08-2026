const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf-8');

// replace `async function startServer() { const app = express(); ... `
code = code.replace(/async function startServer\(\) \{[\s\S]*?const app = express\(\);/, 'const app = express();');

// remove vite and listen from the bottom
const removeTailRegex = /if \(process\.env\.NODE_ENV !== 'production'\) \{[\s\S]*?startServer\(\);/m;
code = code.replace(removeTailRegex, 'export default app;');

fs.writeFileSync('src/app.ts', code);
