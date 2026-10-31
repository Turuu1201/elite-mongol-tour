import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Хөгжүүлэлтийн үед /api хүсэлтийг Express сервер рүү дамжуулна
    proxy: { '/api': process.env.API_PROXY ?? 'http://localhost:4000' },
  },
})
