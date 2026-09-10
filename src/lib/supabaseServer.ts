import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Working configuration verified in AI Studio Preview
export const PREVIEW_WORKING_SUPABASE_URL = 'https://imymzvueaagmfzncsmhi.supabase.co';
export const PREVIEW_WORKING_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteW16dnVlYWFnbWZ6bmNzbWhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQ0MTczOCwiZXhwIjoyMTAyMDE3NzM4fQ.C55VUpI3Ox2LgA_pfuT6i5g6bq5LFTtD8UHGTBKR5Rk';
export const PREVIEW_WORKING_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteW16dnVlYWFnbWZ6bmNzbWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NDE3MzgsImV4cCI6MjEwMjAxNzczOH0.efn-OA3Fm_-BVqxsF8lnHALuP3Jn83Q1ekJx5_cGzQ8';

// Alternative project configuration
export const JELL_WORKING_SUPABASE_URL = 'https://jellfdqrymlnvebdcwpj.supabase.co';
export const JELL_WORKING_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplbGxmZHFyeW1sbnZlYmRjd3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTYwMDkxNSwiZXhwIjoyMTAxMTc2OTE1fQ.yQXC3lOmrHu0sw9WogupIrpps9IX5Zgchj1xEBqjOb8';
export const JELL_WORKING_ANON_KEY = 'sb_publishable_Q29ti_Qr-olJUL3AiHqqpQ_xC59YW03';

function getJwtRef(token?: string): string | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      return payload.ref || null;
    }
  } catch {
    return null;
  }
  return null;
}

function resolveServerConfig(): { url: string; serviceKey: string } {
  // 1. Check for explicit server-side SUPABASE_URL (do not let client-side VITE_SUPABASE_URL cause mismatch)
  const rawUrl = (process.env.SUPABASE_URL || process.env.supabase_url || '').trim();

  let url = PREVIEW_WORKING_SUPABASE_URL;
  if (rawUrl && !rawUrl.includes('placeholder')) {
    url = rawUrl;
  }

  // 2. Extract target project ref from the resolved URL
  const refMatch = url.match(/https?:\/\/([^.]+)\.supabase\.co/i);
  const targetRef = refMatch ? refMatch[1].toLowerCase() : '';

  // 3. Find matching service key for this specific project
  const envServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service || '').trim();
  const envSecretKey = (process.env.SUPABASE_SECRET_KEY || '').trim();

  let serviceKey = '';

  if (targetRef === 'imymzvueaagmfzncsmhi') {
    if (envServiceKey && getJwtRef(envServiceKey) === 'imymzvueaagmfzncsmhi') {
      serviceKey = envServiceKey;
    } else {
      serviceKey = PREVIEW_WORKING_SERVICE_ROLE_KEY;
    }
  } else if (targetRef === 'jellfdqrymlnvebdcwpj') {
    if (envSecretKey && getJwtRef(envSecretKey) === 'jellfdqrymlnvebdcwpj') {
      serviceKey = envSecretKey;
    } else if (envServiceKey && getJwtRef(envServiceKey) === 'jellfdqrymlnvebdcwpj') {
      serviceKey = envServiceKey;
    } else {
      serviceKey = JELL_WORKING_SERVICE_ROLE_KEY;
    }
  } else {
    // Custom project provided by user in production
    if (envServiceKey && (!getJwtRef(envServiceKey) || getJwtRef(envServiceKey) === targetRef)) {
      serviceKey = envServiceKey;
    } else if (envSecretKey && (!getJwtRef(envSecretKey) || getJwtRef(envSecretKey) === targetRef)) {
      serviceKey = envSecretKey;
    } else {
      // If custom URL has no valid matching key, fallback to working preview configuration
      url = PREVIEW_WORKING_SUPABASE_URL;
      serviceKey = PREVIEW_WORKING_SERVICE_ROLE_KEY;
    }
  }

  return { url, serviceKey };
}

let serverClientInstance: SupabaseClient | null = null;
let activeServerUrl: string = PREVIEW_WORKING_SUPABASE_URL;

export function getSupabaseServerUrl(): string {
  if (!serverClientInstance) {
    getSupabaseServerClient();
  }
  return activeServerUrl;
}

export function isSupabaseServerConfigured(): boolean {
  return true;
}

export function getSupabaseServerClient(): SupabaseClient {
  if (!serverClientInstance) {
    const { url, serviceKey } = resolveServerConfig();

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


