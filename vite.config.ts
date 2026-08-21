import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 使用相对路径，让构建产物在 GitHub Pages（用户名.github.io/仓库名/）子路径下也能正确加载资源
  base: './',
})
