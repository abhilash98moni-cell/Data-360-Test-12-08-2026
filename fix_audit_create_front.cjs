const fs = require('fs');
let content = fs.readFileSync('src/components/NewAuditModal.tsx', 'utf8');

const search = `      // 1. Register new distributor in master tenant directory so it appears in all dropdowns
      registerNewDistributor(cleanClient, {`;

const replace = `      // Validate against the server
      const token = localStorage.getItem('supabase_token');
      if (token) {
        const res = await fetch('/api/audits/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
             title: title.trim(),
             code: cleanDistCode,
             distributorName: cleanDistributor
          })
        });
        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.error || 'Server rejected audit creation.');
        }
      }

      // 1. Register new distributor in master tenant directory so it appears in all dropdowns
      registerNewDistributor(cleanClient, {`;

content = content.replace(search, replace);
fs.writeFileSync('src/components/NewAuditModal.tsx', content);
