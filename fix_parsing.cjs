const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const search = `                 source: (file.uploadedBy && file.uploadedBy.toLowerCase().includes('auditor')) ? 'Auditor Upload' : 'Distributor Upload',
                 samplingEnabled: false,
                 samplingStatus: undefined`;

const replace = `                 source: (file.uploadedBy && file.uploadedBy.toLowerCase().includes('auditor')) ? 'Auditor Upload' : 'Distributor Upload',
                 samplingEnabled: file.samplingEnabled || false,
                 samplingStatus: file.samplingStatus || undefined`;

code = code.replace(search, replace);
fs.writeFileSync('server.ts', code);
