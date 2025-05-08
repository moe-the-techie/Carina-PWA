import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
          "name": "Carina-PWA",
          "short_name": "Carina",
          "start_url": "/?home=true",
          "icons": [
              {
              "src": "public/icons/manifest-icon-192.maskable.png",
              "sizes": "192x192",
              "type": "image/png",
              "purpose": "any"
              },
              {
              "src": "public/icons/manifest-icon-192.maskable.png",
              "sizes": "192x192",
              "type": "image/png",
              "purpose": "maskable"
              },
              {
              "src": "public/icons/manifest-icon-512.maskable.png",
              "sizes": "512x512",
              "type": "image/png",
              "purpose": "any"
              },
              {
              "src": "public/icons/manifest-icon-512.maskable.png",
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
