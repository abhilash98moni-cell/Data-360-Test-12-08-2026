const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');

const fetchPatch = `
// Monkey-patch fetch to automatically include the Supabase auth token
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && resource.startsWith('/api/')) {
    config = config || {};
    config.headers = config.headers || {};
    
    // Convert Headers object to regular object if necessary
    const isHeadersObj = config.headers instanceof Headers;
    const token = localStorage.getItem('supabase.auth.token');
    
    if (token) {
      if (isHeadersObj) {
        if (!config.headers.has('Authorization')) {
          config.headers.set('Authorization', 'Bearer ' + token);
        }
      } else {
        const headersRecord = config.headers;
        const hasAuth = Object.keys(headersRecord).some(k => k.toLowerCase() === 'authorization');
        if (!hasAuth) {
          headersRecord['Authorization'] = 'Bearer ' + token;
        }
      }
    }
  }
  return originalFetch(resource, config);
};
`;

if (!code.includes('Monkey-patch fetch')) {
  // insert after imports
  code = code.replace(/import App from '\.\/App\.tsx';\n/, "import App from './App.tsx';\n\n" + fetchPatch + "\n");
  fs.writeFileSync('src/main.tsx', code);
}
