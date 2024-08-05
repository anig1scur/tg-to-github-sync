/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  mode: 'jit',
  theme: {
    fontFamily: {
      wireone: ['wireone', 'serif'],
      mono: ['monospace'],
    },
    extend: {
      screens: {
        'xs': '480px',
        'xxs': '360px',
      },
      colors: {
        'bg': '#faf5f1',
        'bg-secondary': '#eadbce',
        'card-bg': '#997164',
        'text': '#483c38'
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};
