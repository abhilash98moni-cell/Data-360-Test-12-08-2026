import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let serverClientInstance: SupabaseClient | null = null;

export function isSupabaseServerConfigured(): boolean {
  const url =
    process.env.SUPABASE_URL ||
    process.env.supabase_url ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.supabase_service ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';
  return Boolean(url && serviceKey && !url.includes('placeholder'));
}

export function getSupabaseServerClient(): SupabaseClient {
  if (!serverClientInstance) {
    const url =
      process.env.SUPABASE_URL ||
      process.env.supabase_url ||
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://placeholder-data360.supabase.co';

    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      process.env.supabase_service ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      'placeholder-service-key';

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


