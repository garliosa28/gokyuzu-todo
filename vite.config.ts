import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Yayın alt yolda olabilir (GitHub Pages: /gokyuzu-todo/); yerelde kök.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      // Güncelleme kullanıcıya sorulur (bkz. src/ui/updates.ts); otomatik yenileme yazılan metni kaybettirebilir.
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Todo',
        short_name: 'Todo',
        lang: 'tr',
        // Uygulamanın yayınlandığı yola göre: başka bir alt yolda da kurulabilsin.
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#f6f5f2',
        theme_color: '#f6f5f2',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
  },
})
