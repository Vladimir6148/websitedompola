import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function buildIdPlugin(buildId: string, base: string): Plugin {
  return {
    name: 'dompola-build-id',
    transformIndexHtml(html) {
      const normalizedBase = base.endsWith('/') ? base : `${base}/`;
      return html
        .replaceAll('__DOMPOLA_BUILD_ID__', buildId)
        .replaceAll('__DOMPOLA_BASE_URL__', normalizedBase);
    },
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'build-id.txt'), `${buildId}\n`, 'utf8');
    },
  };
}

export default defineConfig(({ command }) => {
  const base = command === 'serve' ? '/' : process.env.VITE_BASE || '/';
  const buildId =
    process.env.VITE_BUILD_ID ||
    (command === 'serve' ? 'dev' : `local-${Date.now()}`);

  return {
    plugins: [react(), tailwindcss(), buildIdPlugin(buildId, base)],
    // Local always `/`. GitHub Pages sets VITE_BASE=/websitedompola/ in CI.
    base,
    define: {
      'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': 'http://localhost:4000',
        '/uploads': 'http://localhost:4000',
      },
    },
  };
});
