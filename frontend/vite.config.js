// frontend/vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const port = parseInt(process.env.FRONTEND_PORT || '5173', 10)

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port,
    // Make file changes visible across Docker/WSL/macOS
    watch: { usePolling: true, interval: 100 },
    // Ensure the browser connects to WS on localhost:<port>
    hmr: {
      host: 'localhost',
      clientPort: port,
      protocol: 'ws'
    }
  }
})
