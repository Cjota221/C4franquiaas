import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let createThemes;
try {
  const themePkg = require('tailwindcss-theme');
  // support multiple export shapes:
  // - module.exports = createThemes (function)
  // - exports.createThemes = createThemes
  // - export default createThemes
  // - export default { createThemes }
  if (typeof themePkg === 'function') {
    createThemes = themePkg;
  } else if (themePkg && typeof themePkg.createThemes === 'function') {
    createThemes = themePkg.createThemes;
  } else if (themePkg && themePkg.default) {
    const d = themePkg.default;
    if (typeof d === 'function') createThemes = d;
    else if (d && typeof d.createThemes === 'function') createThemes = d.createThemes;
    else createThemes = undefined;
  } else {
    createThemes = undefined;
  }
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
