const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/const \[engagements, setEngagements\] = useState<AuditEngagement\[\]>\(\(\) => \{[\s\S]*?\}\);/m, `
const [engagements, setEngagements] = useState<AuditEngagement[]>([]);
React.useEffect(() => {
  fetch('/api/engagements', { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('supabase.auth.token') || '') } })
  .then(res => res.json())
  .then(data => {
    if (data.success && data.engagements && data.engagements.length > 0) {
      setEngagements(data.engagements);
    }
  }).catch(e => console.error(e));
}, []);
`);

fs.writeFileSync('src/App.tsx', code);
