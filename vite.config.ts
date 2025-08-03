import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: 'JTiLms',
        short_name: 'JTiLms',
        description: 'A Learning Management System for JTi',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/theicon.png', // Path is relative to the public folder
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/theicon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon'
          },
          {
            src: '/theicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  }, // Remove 'tr' from here
  server: {
    host: true, // Expose to all network interfaces
    port: 5173, // Specify default port
    strictPort: true, // Don't try other ports if 5173 is taken
  },
  preview: {
    port: 5173,
    host: true,
  }
});