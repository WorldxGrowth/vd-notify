import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4002,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: ['vdnotify.vdscan.io'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4001',
        changeOrigin: true,
      }
    }
  }
})
