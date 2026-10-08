import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // When watching is on, ignore files the *server* writes at runtime
      // (data/appdata.json on every admin save, uploads on portfolio save).
      // Without this, saving a lead status rewrites appdata.json, Vite detects
      // the change and forces a full-page reload — which aborts the in-flight
      // update, discards the optimistic UI/toast, and looks like the change
      // was never saved.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {
              // Regex (not globs) so this matches on Windows backslash paths too.
              ignored: [
                /[\\/]data[\\/]/,
                /[\\/]public[\\/]uploads[\\/]/,
                /[\\/]_chrome-profile\w*[\\/]/,
              ],
            },
    },
  };
});
