/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: '#0b0f14',
        card: 'rgba(255,255,255,0.06)'
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.2)'
      }
    }
  },
  plugins: []
};


