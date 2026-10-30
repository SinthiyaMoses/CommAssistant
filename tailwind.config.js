/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          deep: '#06090f',
          primary: '#0b0f19',
          secondary: '#111827',
          card: '#141d2e',
          cyan: '#00f2fe',
          blue: '#4facfe',
          violet: '#8a2be2',
          purple: '#c084fc',
          emerald: '#00f5a0',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        indic: ['Noto Sans Tamil', 'Noto Sans Devanagari', 'Noto Sans Telugu', 'Noto Sans Malayalam', 'Noto Sans Kannada', 'Noto Sans Bengali', 'sans-serif'],
      },
      boxShadow: {
        glowCyan: '0 0 25px -5px rgba(0, 242, 254, 0.35)',
        glowViolet: '0 0 25px -5px rgba(138, 43, 226, 0.35)',
        glowMic: '0 0 45px 8px rgba(0, 242, 254, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
