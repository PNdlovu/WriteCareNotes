import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  build: {
    outDir: '../dist/frontend',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'frontend/index.html'),
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'frontend/src'),
      '@components': resolve(__dirname, 'frontend/src/components'),
      '@hooks': resolve(__dirname, 'frontend/src/hooks'),
      '@utils': resolve(__dirname, 'frontend/src/utils'),
      '@types': resolve(__dirname, 'frontend/src/types'),
      '@services': resolve(__dirname, 'frontend/src/services'),
    },
  },
});