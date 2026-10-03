/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#090d16',      // Deep Obsidian Black
          card: '#111827',      // Dark Surface Gray/Black
          sidebar: '#0d1322',   // Deep Sidebar Dark
        },
        brand: {
          blue: '#0284C7',      // Deep Ocean Blue
          sky: '#38BDF8',       // Light Sky Blue Accent
          cyan: '#00b1d1ff',      // Electric Cyan
          dark: '#030712',      // Pitch Black
        },
        accent: {
          darkBorder: '#1f293d',
          darkHover: '#1a2336',
        }
      },
    },
  },
  plugins: [],
}
