const fs = require('fs');
let content = fs.readFileSync('src/services/questionnaireApiClient.ts', 'utf8');

// Replace the throw new Error block with one that handles 401s
const target = `    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || \`HTTP \${res.status}: Failed to sync questionnaire state\`);
    }`;

const replacement = `    if (!res.ok) {
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase_token');
          localStorage.removeItem('data360_active_user');
          window.dispatchEvent(new Event('auth-expired'));
        }
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || \`HTTP \${res.status}: Failed to sync questionnaire state\`);
    }`;

content = content.replace(target, replacement);

fs.writeFileSync('src/services/questionnaireApiClient.ts', content);
console.log("Updated fetchQuestionnaireState");
