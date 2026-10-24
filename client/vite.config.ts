import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build output goes into the API's wwwroot so `dotnet run` serves the SPA directly.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../server/TaskManagerPro.Api/wwwroot',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/hubs': { target: 'ws://localhost:5000', ws: true, changeOrigin: true }
    }
  }
})
