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
      // colors: {
      //   'bg': '#faf5f1',
      //   'bg-secondary': '#eadbce',
      //   'card-bg': '#997164',
      //   'text': '#483c38'
      // },
      colors: {
        'bg': '#f8f8f8',
        'bg-secondary': '#e0e0e0',
        'card-bg': '#2a2a2a',
        'text': '#1a1a1a'
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};
