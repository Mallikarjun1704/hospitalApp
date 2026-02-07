module.exports = {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}', // Adjust paths accordingly
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
