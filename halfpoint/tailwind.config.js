/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAFA',
        surface: '#FFFFFF',
        border: '#E5E5E5',
        accent: '#007AFF',
        'accent-light': '#E8F2FF',
        'text-primary': '#1D1D1F',
        'text-secondary': '#86868B',
        warning: '#FF6B35',
        success: '#34C759',
      },
      fontFamily: {
        display: ['"SF Pro Display"', '"DM Serif Display"', 'system-ui', 'sans-serif'],
        sans: ['"SF Pro Text"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
        'soft': '0 2px 8px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
