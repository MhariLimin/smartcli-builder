import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy the backend's API surface AND the springdoc endpoints so dev links to
// /v3/api-docs or /swagger-ui.html resolve same-origin from :5173.
// `/swagger-ui` (no trailing slash) covers the webjar assets the UI loads.
const BACKEND = 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/v3/api-docs': { target: BACKEND, changeOrigin: true },
      '/swagger-ui': { target: BACKEND, changeOrigin: true },
      '/swagger-ui.html': { target: BACKEND, changeOrigin: true }
    }
  }
});
