const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const search = `                 auditPeriod: state.auditPeriod || 'FY 2025-26',
                 // Inherited source classification based on uploader identity
                 source: (file.uploadedBy && file.uploadedBy.toLowerCase().includes('auditor')) ? 'Auditor Upload' : 'Distributor Upload'
               });`;

const replace = `                 auditPeriod: state.auditPeriod || 'FY 2025-26',
                 // Inherited source classification based on uploader identity
                 source: (file.uploadedBy && file.uploadedBy.toLowerCase().includes('auditor')) ? 'Auditor Upload' : 'Distributor Upload',
                 samplingEnabled: false,
                 samplingStatus: undefined
               });`;

code = code.replace(search, replace);
fs.writeFileSync('server.ts', code);
