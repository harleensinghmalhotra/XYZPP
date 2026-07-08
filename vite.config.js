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
  },
  server: { host: true, port: 5173 },
  assetsInclude: ['**/*.mp4'],
})
