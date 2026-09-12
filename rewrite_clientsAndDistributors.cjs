const fs = require('fs');

const content = fs.readFileSync('src/data/clientsAndDistributors.ts', 'utf8');

const newContent = content.replace(
  /export const BASE_CLIENT_TENANTS: ClientTenantInfo\[\] = \[([\s\S]*?)\];/,
  `export const BASE_CLIENT_TENANTS: ClientTenantInfo[] = [
  {
    id: 'client-1',
    name: 'Apex Electronics Corp',
    industry: 'Consumer Technology',
    distributors: [
      { id: 'dist-1', name: 'Midwest Trading Co.', code: 'MDT-8092', region: 'Midwest Region (USA)', status: 'Active Audit' }
    ]
  }
];`
);

fs.writeFileSync('src/data/clientsAndDistributors.ts', newContent);
console.log('Done rewriting clientsAndDistributors.ts');
