import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Lift-Log/',
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
