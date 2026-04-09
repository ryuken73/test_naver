import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'

const dir = path.dirname(fileURLToPath(import.meta.url))

// Tailwind v4: PostCSS(`@tailwindcss/postcss`) 사용 — Vercel/Git 빌드에서 @tailwindcss/vite 관련 이슈 회피
export default defineConfig({
  root: dir,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dir, './src'),
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
