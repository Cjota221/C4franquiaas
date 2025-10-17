import { createThemes } from 'tailwindcss-theme';

const cfg = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    createThemes({
      inline: {
        // custom theme variables can go here
      },
    }),
  ],
};

export default cfg;
