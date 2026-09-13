const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        const res = await fetch('/api/audits', {
          headers: token ? { 'Authorization': \`Bearer \${token}\` } : {}
        });
        const data = await res.json();`;

const replacement = `        const res = await fetch('/api/audits', {
          headers: token ? { 'Authorization': \`Bearer \${token}\` } : {}
        });
        if (res.status === 401) {
          window.dispatchEvent(new Event('auth-expired'));
          return;
        }
        const data = await res.json();`;

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content);
console.log("Updated App.tsx fetch");
