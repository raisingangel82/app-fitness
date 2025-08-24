// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <-- MODIFICA CRUCIALE

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}