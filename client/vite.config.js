import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ command }) => ({
  plugins: [react()],

  // LOCAL DEVELOPMENT ONLY
  server: {
    port: 5173,

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: 'dist',

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {

            // React Core
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
              return 'vendor-core'
            }

            // UI Libraries
            if (
              id.includes('recharts') ||
              id.includes('lucide-react') ||
              id.includes('react-icons')
            ) {
              return 'vendor-ui'
            }

            // Animation Libraries
            if (
              id.includes('framer-motion') ||
              id.includes('swiper')
            ) {
              return 'vendor-animation'
            }

            return 'vendor-libs'
          }
        },
      },
    },

    chunkSizeWarningLimit: 1000,
  },

  esbuild:
    command === 'build'
      ? {
        // drop: ['console', 'debugger']
      }
      : undefined,
}))