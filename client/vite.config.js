import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // Allow sharing the dev server publicly (e.g. via ngrok). Vite blocks
    // unknown Host headers by default; ngrok URLs change on every restart,
    // so all hosts are allowed here. Never use this for production.
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  preview: {
    port: 5173
  }
});
