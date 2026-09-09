const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');

const fetchPatch = `
// Intercept fetch to automatically inject the Supabase session token
const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  configurable: true,
  writable: true,
  value: async (...args: any[]) => {
    let [resource, config] = args;
    
    if (typeof resource === 'string' && resource.startsWith('/api/')) {
      config = config || {};
      config.headers = config.headers || {};
      
      const token = localStorage.getItem('supabase.auth.token');
      if (token) {
        if (config.headers instanceof Headers) {
          if (!config.headers.has('Authorization')) {
            config.headers.set('Authorization', 'Bearer ' + token);
          }
        } else {
          const hasAuth = Object.keys(config.headers).some(k => k.toLowerCase() === 'authorization');
          if (!hasAuth) {
            config.headers['Authorization'] = 'Bearer ' + token;
          }
        }
      }
    }
    return originalFetch(resource, config);
  }
});
`;

if (!code.includes('Intercept fetch')) {
  code = code.replace(/import App from '\.\/App\.tsx';\n/, "import App from './App.tsx';\n\n" + fetchPatch + "\n");
  fs.writeFileSync('src/main.tsx', code);
}
