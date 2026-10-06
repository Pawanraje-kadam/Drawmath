import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    // Bind on all interfaces and accept proxied/preview hostnames
    // (e.g. when the dev server is reached through a tunnel or a container preview URL).
    host: true,
    allowedHosts: true
  },
  preview: {
    host: true,
    allowedHosts: true
  }
});
