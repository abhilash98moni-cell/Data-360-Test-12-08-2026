const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf-8');

code = code.replace(/function authenticateRequestSession[\s\S]*?return \{[\s\S]*?\};\n\}/, `
import { resolveAuthSession } from '../src/middleware/auth.js';
// authenticateRequestSession has been replaced by await resolveAuthSession
`);

code = code.replace(/const session = authenticateRequestSession\(req\);/g, 'const session = (await resolveAuthSession(req)) || { role: "Auditor", org: "Apex Audit Practice", email: "user@data360.io", name: "User", isDistributor: false, distributorInfo: null };');

fs.writeFileSync('api/index.ts', code);
