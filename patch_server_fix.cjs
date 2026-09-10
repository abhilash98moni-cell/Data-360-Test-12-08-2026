const fs = require('fs');
let code = fs.readFileSync('src/lib/supabaseServer.ts', 'utf8');

code = `import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

let serverClientInstance: SupabaseClient | null = null;

export function isSupabaseServerConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && serviceKey && !url.includes('placeholder'));
}

export function getSupabaseServerClient(): SupabaseClient {
  if (!serverClientInstance) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
      throw new Error('Configuration Error: Missing SUPABASE_URL');
    }
    if (!serviceKey) {
      throw new Error('Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    serverClientInstance = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
  }
  return serverClientInstance;
}
`;

fs.writeFileSync('src/lib/supabaseServer.ts', code);
