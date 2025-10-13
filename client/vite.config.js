import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/auth/strava': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/auth/strava/callback': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // add other proxies (eg. /api) as needed
    },
  },
});
