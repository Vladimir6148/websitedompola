import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // Local always `/`. GitHub Pages sets VITE_BASE=/websitedompola/ in CI.
  base: command === 'serve' ? '/' : process.env.VITE_BASE || '/',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
}));
