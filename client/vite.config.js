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
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-ui': ['recharts', 'lucide-react', 'react-icons', 'framer-motion', 'swiper']
        }
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