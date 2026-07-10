import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Root-level `assets/` is the durable home for placeholder + real media.
// Files are replaced in place later with ZERO code changes — paths never move.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@assets': fileURLToPath(new URL('./assets', import.meta.url)),
    },
    // react-i18next resolves React through its own path; dedupe so the app and the
    // library share a single React instance (otherwise "Invalid hook call").
    dedupe: ['react', 'react-dom'],
  },
  server: { host: true, port: 5173 },
  // Pre-bundle the i18n libs so Vite externalizes React from them (avoids the
  // duplicate-React "Invalid hook call" under pnpm's linked node_modules).
  optimizeDeps: { include: ['react-i18next', 'i18next'] },
  assetsInclude: ['**/*.mp4'],
})
