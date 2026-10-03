import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/v1/auth': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/v1/provisioning': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/v1/helm': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
      '/api/v1/cost': {
        target: 'http://localhost:8004',
        changeOrigin: true,
      },
      '/api/v1/operator': {
        target: 'http://localhost:8005',
        changeOrigin: true,
      },
      '/api/v1/discovery': {
        target: 'http://localhost:8007',
        changeOrigin: true,
      },
      '/api/v1/catalog': {
        target: 'http://localhost:8008',
        changeOrigin: true,
      },
      '/api/v1/provider': {
        target: 'http://localhost:8009',
        changeOrigin: true,
      },
      '/api/v1/vault': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
