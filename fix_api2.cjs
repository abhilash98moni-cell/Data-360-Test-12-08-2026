const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf-8');

code = code.replace(/const session = \(await resolveAuthSession\(req\)\) \|\| \{ role: "Auditor", org: "Apex Audit Practice", email: "user@data360.io", name: "User", isDistributor: false, distributorInfo: null \};/g, `const auth = await resolveAuthSession(req);
    const session = auth ? {
      role: auth.role,
      org: auth.organization,
      email: auth.email,
      name: auth.name,
      isDistributor: auth.role.toLowerCase().includes('distributor'),
      distributorInfo: auth.role.toLowerCase().includes('distributor') ? getDistributorByOrg(auth.organization) : null
    } : { role: 'Auditor', org: 'Apex Audit Practice', email: 'user@data360.io', name: 'User', isDistributor: false, distributorInfo: null };`);

fs.writeFileSync('api/index.ts', code);
