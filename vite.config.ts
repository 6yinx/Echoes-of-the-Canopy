import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Use placeholder during build if API_KEY is not set (e.g., on Vercel)
      // The actual API_KEY should be set in Vercel's environment variables
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '__VERCEL_ENV_PLACEHOLDER__'),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || '__PLACEHOLDER__'),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || '__PLACEHOLDER__')
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});