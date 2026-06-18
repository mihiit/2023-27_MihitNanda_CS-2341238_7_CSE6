/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sail: {
          DEFAULT: '#1B2A6B',
          hover:   '#142059',
          deep:    '#0D1A45',
          light:   '#EEF0FA',
          mid:     '#3D50A0',
          gold:    '#C9A84C',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', '"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
