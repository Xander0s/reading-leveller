/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#3b82f6',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        tier: {
          below: '#f59e0b',
          at: '#10b981',
          above: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
