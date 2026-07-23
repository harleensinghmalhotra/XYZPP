import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // react-i18next resolves React through its own path; dedupe so the app and the
    // library share a single React instance (otherwise "Invalid hook call").
    dedupe: ['react', 'react-dom'],
  },
  server: { host: true, port: 5173 },
  // Pre-bundle the i18n libs so Vite externalizes React from them (avoids the
  // duplicate-React "Invalid hook call" under pnpm's linked node_modules).
  // maplibre-gl is added too: it's dynamic-imported (globe section), so Vite would
  // otherwise discover it mid-session on first load and force a full page reload.
  // Pre-bundling keeps that lazy chunk stable.
  optimizeDeps: { include: ['react-i18next', 'i18next', 'maplibre-gl'] },
  assetsInclude: ['**/*.mp4'],
})
