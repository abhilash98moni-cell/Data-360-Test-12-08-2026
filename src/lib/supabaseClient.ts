import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://imymzvueaagmfzncsmhi.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteW16dnVlYWFnbWZ6bmNzbWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NDE3MzgsImV4cCI6MjEwMjAxNzczOH0.efn-OA3Fm_-BVqxsF8lnHALuP3Jn83Q1ekJx5_cGzQ8';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
);

export const supabase = createClient(
  supabaseUrl.trim(),
  supabaseAnonKey.trim(),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

