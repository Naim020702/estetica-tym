/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rosebrand: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#f8d2da',
          300: '#f2adbc',
          400: '#e97d97',
          500: '#dc5375',
          600: '#c7355c',
          700: '#a7274b',
          800: '#8c2342',
          900: '#77213c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
