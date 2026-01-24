import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      // 方案1: Meting API代理 (网易云)
      '/api/meting': {
        target: 'https://meting.qjqq.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/meting/, ''),
        secure: false,
        headers: {
          'Referer': 'https://meting.qjqq.cn/',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    }
  }
})
