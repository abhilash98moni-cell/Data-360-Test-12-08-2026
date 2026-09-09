const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/const stored = localStorage\.getItem\('data360_engagements'\);[\s\S]*?if \(!stored\)/, `
fetch('/api/engagements', { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('supabase.auth.token') || '') } })
  .then(res => res.json())
  .then(data => {
    if (data.success && data.engagements) {
      setEngagements(data.engagements);
    }
  }).catch(e => console.error(e));
const stored = null; if (!stored)
`);

code = code.replace(/localStorage\.setItem\('data360_engagements', JSON\.stringify\(updated\)\);/, `
fetch('/api/engagements', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('supabase.auth.token') || '') },
  body: JSON.stringify({ engagements: updated })
});
`);

fs.writeFileSync('src/App.tsx', code);
