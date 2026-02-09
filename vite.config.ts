import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Force pre-bundle these CJS modules
    include: ['@dagrejs/dagre', '@dagrejs/graphlib'],
  },
  ssr: {
    // Don't externalize these during SSR (if used)
    noExternal: ['@dagrejs/dagre', '@dagrejs/graphlib'],
  },
})
