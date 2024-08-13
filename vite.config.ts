import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // base: process.env.GITHUB_ACTIONS === '1' ? '/tg-to-github-sync/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "public/assets/"),
      "@": path.resolve(__dirname, "src/"),
    },
  },
})
