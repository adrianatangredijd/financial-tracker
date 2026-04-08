import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|react-router)/,
              priority: 20,
            },
            {
              name: 'vendor-mui',
              test: /node_modules[\\/](@mui[\\/]material|@mui[\\/]icons-material|@emotion)/,
              priority: 15,
            },
            {
              name: 'vendor-mui-x',
              test: /node_modules[\\/]@mui[\\/]x-/,
              priority: 15,
            },
            {
              name: 'vendor-charts',
              test: /node_modules[\\/](chart\.js|react-chartjs)/,
              priority: 15,
            },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
