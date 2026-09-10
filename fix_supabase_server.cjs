const fs = require('fs');
const code = `import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

let serverClientInstance: SupabaseClient | null = null;

export function isSupabaseServerConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return Boolean(url && serviceKey && !url.includes('placeholder'));
}

export function getSupabaseServerClient(): SupabaseClient {
  if (!serverClientInstance) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || url.includes('placeholder')) {
      throw new Error('Supabase URL is not configured. Check environment variables.');
    }

    if (!serviceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is explicitly required for server operations. Check environment variables.');
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
