import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // Las llamadas a /api van al servidor que guarda los JSON
    proxy: { '/api': 'http://127.0.0.1:3001' },
    // Evita que Vite recargue la página cuando se escriben los JSON
    watch: { ignored: ['**/src/data/*.json'] },
  },
})
