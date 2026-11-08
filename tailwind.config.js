/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        // Obsidian backgrounds
        obsidian: {
          950: '#09090B',
          900: '#0C0C0F',
          800: '#121215',
          700: '#18181C',
          600: '#1E1E24',
        },
        // Surface cards
        surface: {
          DEFAULT: '#121215',
          raised: '#18181C',
          overlay: '#1E1E24',
        },
      },
      borderColor: {
        DEFAULT: 'rgba(63, 63, 70, 0.8)', // zinc-700/80
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'number-tick': 'numberTick 0.1s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        numberTick: {
          '0%': { transform: 'translateY(-2px)', opacity: '0.7' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
