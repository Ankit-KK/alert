import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// three.js, R3F and the post-processing stack are only reachable through
// dynamic imports (StageLayer → Stage → Effects), so they land in lazy chunks
// and the hero's HTML/CSS paints before any WebGL code is fetched.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    // The lazy three.js chunk is intentionally large; it never blocks first paint.
    chunkSizeWarningLimit: 1100,
  },
})
