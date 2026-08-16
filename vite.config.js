import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6060,
    proxy: {
      '/api': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
      },
      '/generate': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
      },
      '/workspace': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
      },
      '/sync-spec': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
      },
      '/update-spec': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
