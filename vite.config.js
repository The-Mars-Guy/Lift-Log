import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "exercise-db": ["./src/data/exercisedb.js"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
