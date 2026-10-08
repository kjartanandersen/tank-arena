import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import netlify from '@netlify/vite-plugin';

export default defineConfig({
  plugins: [react(), netlify({ edgeFunctions: { enabled: false } }) as PluginOption], // netlify(): Functions and redirects inside `vite dev`
  server: {
    port: 8080,
    strictPort: true,
  },
});
