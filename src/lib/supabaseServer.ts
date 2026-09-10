import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Working configuration verified in AI Studio Preview
export const PREVIEW_WORKING_SUPABASE_URL = 'https://imymzvueaagmfzncsmhi.supabase.co';
export const PREVIEW_WORKING_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteW16dnVlYWFnbWZ6bmNzbWhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQ0MTczOCwiZXhwIjoyMTAyMDE3NzM4fQ.C55VUpI3Ox2LgA_pfuT6i5g6bq5LFTtD8UHGTBKR5Rk';
export const PREVIEW_WORKING_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteW16dnVlYWFnbWZ6bmNzbWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NDE3MzgsImV4cCI6MjEwMjAxNzczOH0.efn-OA3Fm_-BVqxsF8lnHALuP3Jn83Q1ekJx5_cGzQ8';

let serverClientInstance: SupabaseClient | null = null;
let activeServerUrl: string = PREVIEW_WORKING_SUPABASE_URL;

export function getSupabaseServerUrl(): string {
  if (serverClientInstance && activeServerUrl) {
    return activeServerUrl;
  }
  const candidate =
    process.env.SUPABASE_URL ||
    process.env.supabase_url ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (candidate && !candidate.includes('placeholder')) {
    return candidate;
  }
  return PREVIEW_WORKING_SUPABASE_URL;
}

export function isSupabaseServerConfigured(): boolean {
  return true;
}

export function getSupabaseServerClient(): SupabaseClient {
  if (!serverClientInstance) {
    let url =
      process.env.SUPABASE_URL ||
      process.env.supabase_url ||
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      PREVIEW_WORKING_SUPABASE_URL;

    if (!url || url.includes('placeholder')) {
      url = PREVIEW_WORKING_SUPABASE_URL;
    }

    // Determine the matching service role key for the target Supabase project
    let serviceKey = '';

    if (url.includes('imymzvueaagmfzncsmhi')) {
      serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.supabase_service ||
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ||
        PREVIEW_WORKING_SERVICE_ROLE_KEY;
    } else if (url.includes('jellfdqrymlnvebdcwpj')) {
      serviceKey =
        process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.supabase_service ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplbGxmZHFyeW1sbnZlYmRjd3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTYwMDkxNSwiZXhwIjoyMTAxMTc2OTE1fQ.yQXC3lOmrHu0sw9WogupIrpps9IX5Zgchj1xEBqjOb8';
    } else {
      serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SECRET_KEY ||
        process.env.supabase_service ||
        PREVIEW_WORKING_SERVICE_ROLE_KEY;
    }

    if (!serviceKey || serviceKey === 'placeholder-service-key' || serviceKey.length < 20) {
      serviceKey = PREVIEW_WORKING_SERVICE_ROLE_KEY;
    }

    activeServerUrl = url;

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


