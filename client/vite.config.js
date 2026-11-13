import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,                     // bind 0.0.0.0 instead of localhost
    allowedHosts: ['blogapp.com'],  // vite 6+ rejects unknown Host headers
  },
})
