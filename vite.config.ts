import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` relativa: la app se sirve bajo /tools/armor-trim/ dentro de MineLite.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    // En desarrollo suelto, la búsqueda de skins por nick va contra MineLite.
    proxy: { '/api': 'http://localhost:3010' },
  },
})
