import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let createThemes;
try {
  const themePkg = require('tailwindcss-theme');
  createThemes = themePkg?.createThemes ?? themePkg?.default?.createThemes ?? themePkg;
} catch {
  // package not installed or failed to load; leave createThemes undefined
  createThemes = undefined;
}

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: createThemes
    ? [
        createThemes({
          inline: {},
        }),
      ]
    : [],
};

export default config;
