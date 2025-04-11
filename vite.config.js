import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/Perfect-Hash-Visualiser/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  optimizeDeps: {
    include: ['three'] // Add this if using npm installation
  }
})