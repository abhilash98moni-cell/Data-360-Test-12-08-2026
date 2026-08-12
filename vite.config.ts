import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Use the Supabase variables configured in Vercel or local env.
  const projectUrl =
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    '';

  const projectAnon =
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    '';

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
