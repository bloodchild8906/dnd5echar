import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  build: {
    target: 'esnext',
  },
  define: {
    'process.env': {
      NODE_ENV: 'development',
      VITE_SUPABASE_ANON_KEY: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
      VITE_SUPABASE_URL: JSON.stringify(process.env.VITE_SUPABASE_URL),
      VITE_SUPABASE_SERVICE_KEY: JSON.stringify(process.env.VITE_SUPABASE_SERVICE_KEY),
      VITE_OPEN5E_API_KEY: JSON.stringify(process.env.VITE_OPEN5E_API_KEY),
      VITE_OPEN5E_API_URL: JSON.stringify(process.env.VITE_OPEN5E_API_URL),
      VITE_OPEN5E_API_TOKEN: JSON.stringify(process.env.VITE_OPEN5E_API_TOKEN),
      VITE_OPEN5E_API_BASE_URL: JSON.stringify(process.env.VITE_OPEN5E_API_BASE_URL),
    },
  },
});
