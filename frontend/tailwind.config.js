/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#073AB5',
        secondary: '#50C878',
        danger: '#FF6B6B',
        warning: '#FFB347',
        dark: {
          bg: '#0F1419',
          'bg-secondary': '#1A1F2E',
          'bg-tertiary': '#232B3C',
          text: '#FFFFFF',
          'text-secondary': '#E8EAED',
          'text-tertiary': '#9AA0A6',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}
