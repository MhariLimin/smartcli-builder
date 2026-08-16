import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Proxy the backend's API surface AND the springdoc endpoints so dev links to
// /v3/api-docs or /swagger-ui.html resolve same-origin from :5173.
// `/swagger-ui` (no trailing slash) covers the webjar assets the UI loads.
const BACKEND = 'http://localhost:8080';

export default defineConfig(({ command, mode }) => {
  const demoBuild = command === 'serve' || mode === 'demo';
  const demoRuntime = fileURLToPath(new URL('./src/demo/runtime.demo.ts', import.meta.url));
  const unavailablePage = fileURLToPath(new URL('./src/demo/UnavailableDemoPage.tsx', import.meta.url));
  const noopSwitcher = fileURLToPath(new URL('./src/demo/NoopDemoSwitcher.tsx', import.meta.url));

  return {
    plugins: [react()],
    resolve: {
      alias: demoBuild
        ? [{ find: /^\.\.\/demo\/runtime$/, replacement: demoRuntime }]
        : [
            { find: /^\.\/components\/features\/DevScenarioSwitcher$/, replacement: noopSwitcher },
            {
              find: /^\.\/pages\/(AIGenerate|BillingReturn|Kubernetes|Login|SSHWorkflows|WorkspaceMembers|WorkspaceSettings)$/,
              replacement: unavailablePage,
            },
          ],
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: BACKEND, changeOrigin: true },
        '/v3/api-docs': { target: BACKEND, changeOrigin: true },
        '/swagger-ui': { target: BACKEND, changeOrigin: true },
        '/swagger-ui.html': { target: BACKEND, changeOrigin: true }
      }
    }
  };
});
