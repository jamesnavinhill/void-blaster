import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    fs: {
      allow: ['..'],
    },
  },
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/')) {
            return 'three'
          }

          return undefined
        },
      },
    },
  },
})
