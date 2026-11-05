import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ mode: modo }) => {
  const entorno = loadEnv(modo, process.cwd(), '')
  const anfitrion = entorno.DEV_SERVER_HOST
  const puerto = Number(entorno.PORT)

  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
      },
    },
    server: {
      host: anfitrion,
      port: puerto,
      strictPort: true,
    },
    preview: {
      host: anfitrion,
      port: puerto,
    },
  }
})
