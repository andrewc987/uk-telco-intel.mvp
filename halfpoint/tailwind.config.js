/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        surface: '#141414',
        border: '#2A2A2A',
        accent: '#E8FF00',
        'text-primary': '#F5F5F5',
        'text-secondary': '#888888',
        warning: '#FF6B35',
        success: '#00D084',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
