import { createThemes } from 'tailwindcss-theme'

/** @type {import('tailwindcss').Config} */
const config = {
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
        // custom CSS variables for theme 'inline' can go here
      },
    }),
  ],
}

export default config
