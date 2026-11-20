/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spice: {
          jahe: '#E69F00',
          kunyit: '#F0E442',
          kayu_manis: '#D55E00',
          cengkeh: '#CC79A7',
          pala: '#0072B2',
          lada: '#009E73',
        },
        table: {
          dark: '#1A130E',
          surface: '#261C14',
          border: '#3D2D20',
        },
        parchment: {
          DEFAULT: '#FAF8F5',
          dark: '#F0EBE1',
          border: '#E2DACD',
        }
      },
    },
  },
  plugins: [],
}
