const fs = require('fs');
const content = fs.readFileSync('src/lib/downloadHelper.ts', 'utf8');

const newContent = content.replace(
  "const response = await fetch(downloadUrl);",
  `
    const storageItem = localStorage.getItem('data360_user_session');
    let headers: HeadersInit = {};
    let distributorContext = '';
    if (storageItem) {
      try {
        const session = JSON.parse(storageItem);
        if (session.token) {
          headers['Authorization'] = \`Bearer \${session.token}\`;
        }
        headers['x-user-email'] = session.email || '';
        headers['x-user-role'] = session.role || '';
        headers['x-user-organization'] = session.organization || '';
      } catch (e) {}
    }
    // Also include currently selected distributor for Auditors
    const selectedDist = localStorage.getItem('data360_selected_distributor');
    if (selectedDist) {
       distributorContext = selectedDist;
    }
    
    const finalUrl = distributorContext ? \`\${downloadUrl}?distributor=\${encodeURIComponent(distributorContext)}\` : downloadUrl;
    
    const response = await fetch(finalUrl, { headers });
`
);

fs.writeFileSync('src/lib/downloadHelper.ts', newContent);
console.log('patched downloadHelper.ts');
