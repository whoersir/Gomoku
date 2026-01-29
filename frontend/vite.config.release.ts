import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(backendUrl)
  },
  server: {
    host: '0.0.0.0',
    port: 5174,  // Release 环境使用 5174 端口
    allowedHosts: true,
    proxy: {
      // 后端 API 代理 (本地后端服务)
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
        ws: true,
        logLevel: 'debug'
      }
    }
  }
})
