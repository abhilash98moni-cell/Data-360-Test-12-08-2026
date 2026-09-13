const fs = require('fs');
let content = fs.readFileSync('src/services/questionnaireApiClient.ts', 'utf8');

content = content.replace(/if \(!res\.ok\) \{\s+const errJson = await res\.json\(\)\.catch\(\(\) => \(\{\}\)\);\s+throw new Error\(errJson\.error \|\| `HTTP \${res\.status}: Failed to ([^`]+)`\);\s+\}/g, 
`if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('supabase_token');
        localStorage.removeItem('data360_active_user');
        window.dispatchEvent(new Event('auth-expired'));
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || \`HTTP \${res.status}: Failed to $1\`);
    }`);

fs.writeFileSync('src/services/questionnaireApiClient.ts', content);
console.log("Updated all 401 handling");
