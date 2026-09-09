const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');

const fetchPatch = `
// Intercept fetch to automatically inject the Supabase session token dynamically
import { supabase } from './lib/supabaseClient.ts';

const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  configurable: true,
  writable: true,
  value: async (...args: any[]) => {
    let [resource, config] = args;
    
    if (typeof resource === 'string' && resource.startsWith('/api/')) {
      config = config || {};
      config.headers = config.headers || {};
      
      // Get the freshest token directly from Supabase client
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      
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

// Replace the previous patch
const regex = /\/\/ Intercept fetch to automatically inject the Supabase session token[\s\S]*?\}\);/;
if (code.match(regex)) {
  code = code.replace(regex, fetchPatch.trim());
  fs.writeFileSync('src/main.tsx', code);
  console.log('Patched main.tsx for dynamic token');
} else {
  console.log('Regex failed');
}
