import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Idaraya',
        short_name: 'Idaraya',
        description: 'A 30-minute daily movement practice',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Music is deliberately NOT precached (17MB of ambience must not gate
        // install); it streams on demand and sticks via the runtime cache below.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
        runtimeCaching: [
          {
            urlPattern: /\/motion\/[^/]+\.mp4$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'motion-clips',
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\/(music|voice)\/[^/]+\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'session-audio',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
