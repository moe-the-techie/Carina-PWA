import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      "date-fns",
      "date-fns/addDays",
      "date-fns/addSeconds"
    ]
  },
  esbuild: {
    // Remove console.log/debug in production (keep errors/warnings)
    drop: [],
    pure: ['console.log', 'console.debug'],
  },
  build: {
    // Enable source maps for debugging in production
    sourcemap: false,
    // Increase chunk size warning limit (MUI is large)
    chunkSizeWarningLimit: 1000,
    // Rollup options for better code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal caching
        manualChunks: (id) => {
          // Vendor chunks - cached separately and rarely change
          if (id.includes('node_modules')) {
            // React ecosystem - core runtime
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Emotion - CSS-in-JS runtime (must be its own chunk, loaded before MUI)
            if (id.includes('@emotion')) {
              return 'emotion-vendor';
            }
            // MUI - large UI framework, separate chunk
            if (id.includes('@mui')) {
              return 'mui-vendor';
            }
            // Animation library
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            // Real-time communication
            if (id.includes('ably')) {
              return 'realtime-vendor';
            }
            // Date utilities
            if (id.includes('date-fns') || id.includes('dayjs')) {
              return 'date-vendor';
            }
            // Other vendor code
            return 'vendor';
          }
          // Admin pages - only loaded by admins
          if (id.includes('/pages/Admin')) {
            return 'admin';
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId;
          if (facadeModuleId && facadeModuleId.includes('/pages/')) {
            // Page chunks get content hash for cache busting
            return 'pages/[name]-[hash].js';
          }
          return 'chunks/[name]-[hash].js';
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Minification settings - use esbuild (Vite default, faster, avoids TDZ issues with terser multi-pass)
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'es2020',
  },
  plugins: [
    react({
      // Enable React Fast Refresh in development
      fastRefresh: true,
    }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
          "name": "Carina-PWA",
          "short_name": "Carina",
          "start_url": "/?home=true",
          "icons": [
              {
              "src": "/icons/manifest-icon-192.maskable.png",
              "sizes": "192x192",
              "type": "image/png",
              "purpose": "any"
              },
              {
              "src": "/icons/manifest-icon-192.maskable.png",
              "sizes": "192x192",
              "type": "image/png",
              "purpose": "maskable"
              },
              {
              "src": "/icons/manifest-icon-512.maskable.png",
              "sizes": "512x512",
              "type": "image/png",
              "purpose": "any"
              },
              {
              "src": "/icons/manifest-icon-512.maskable.png",
              "sizes": "512x512",
              "type": "image/png",
              "purpose": "maskable"
              }
          ],
          "theme_color": "#000000",
          "background_color": "#FFFFFF",
          "display": "fullscreen",
          "orientation": "portrait"
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
