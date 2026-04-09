import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Tailwind v4: PostCSS(`@tailwindcss/postcss`) 사용 — @tailwindcss/vite 플러그인 미사용
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
