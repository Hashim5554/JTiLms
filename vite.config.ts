import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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