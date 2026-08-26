const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const oldMap = `          auditPeriod: r.audit_period || 'FY 2025-26'
        };
      });`;

const newMap = `          auditPeriod: r.audit_period || 'FY 2025-26',
          source: r.source || 'Distributor Upload'
        };
      });`;

code = code.replace(oldMap, newMap);
fs.writeFileSync('server.ts', code);
