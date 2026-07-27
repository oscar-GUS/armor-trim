/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta MineLite
        fondo:   '#0D0D0F',
        panel:   '#161618',
        panel2:  '#1C1C1F',
        borde:   '#2A2A2E',
        texto:   '#F5F5F0',
        texto2:  '#A1A1AA',
        texto3:  '#71717A',
        naranja: '#F4811F',
        ambar:   '#F2AF0D',
      },
    },
  },
  plugins: [],
}
