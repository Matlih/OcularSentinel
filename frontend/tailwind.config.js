/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ocular-dark': '#0f172a',    // obsidian
        'ocular-panel': '#1e293b',   // lighter obsidian
        'ocular-cyan': '#06b6d4',    // cyan accent
        'ocular-crimson': '#ef4444', // crimson alert
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
