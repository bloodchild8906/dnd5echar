import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        name: 'Codex Arcanum',
        short_name: 'Codex',
        description: 'Local-first D&D 5e character management workspace',
        theme_color: '#091322',
        background_color: '#091322',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache static assets with CacheFirst; JS/CSS with StaleWhileRevalidate
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            },
          },
          {
            urlPattern: /^https:\/\/api\.open5e\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open5e-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
        // Precache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
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
