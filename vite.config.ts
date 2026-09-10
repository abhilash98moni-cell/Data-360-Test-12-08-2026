import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Default to the working preview configuration
  const projectUrl =
    env.SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://imymzvueaagmfzncsmhi.supabase.co';

  const projectAnon =
    env.SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteW16dnVlYWFnbWZ6bmNzbWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NDE3MzgsImV4cCI6MjEwMjAxNzczOH0.efn-OA3Fm_-BVqxsF8lnHALuP3Jn83Q1ekJx5_cGzQ8';

  if (!projectUrl) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  }

  if (!projectAnon) {
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY / PUBLISHABLE_KEY is not configured.');
  }

  return {
    envPrefix: ['VITE_'],

    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(projectUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(projectAnon),
    },

    plugins: [
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
