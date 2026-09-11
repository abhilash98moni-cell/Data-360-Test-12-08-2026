const fs = require('fs');
let content = fs.readFileSync('src/components/CommunicationView.tsx', 'utf8');

const headersSearch = `  const userHeaders = {
    'x-user-email': currentUser?.email || '',
    'x-user-role': currentUser?.role || '',
    'x-user-organization': currentUser?.organization || '',
    'x-user-name': currentUser?.name || ''
  };`;

const headersReplace = `  const userHeaders = {
    'x-user-email': currentUser?.email || '',
    'x-user-role': currentUser?.role || '',
    'x-user-organization': currentUser?.organization || '',
    'x-user-name': currentUser?.name || '',
    'Authorization': 'Bearer ' + (localStorage.getItem('supabase_token') || '')
  };`;

content = content.replace(headersSearch, headersReplace);
fs.writeFileSync('src/components/CommunicationView.tsx', content);
