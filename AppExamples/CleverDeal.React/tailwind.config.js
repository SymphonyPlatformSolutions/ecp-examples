/** @type {import('tailwindcss').Config} */

const plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    './src/Components/ContentDistribution/*.js',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({});
    })
  ],
}
