/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: '#F8F4E8',
        'pin-red': '#E8453C',
        'pin-red-dark': '#C83A32',
        'heart-pink': '#E87070',
        'navy-text': '#2D3748',
      },
    },
  },
  plugins: [],
};
