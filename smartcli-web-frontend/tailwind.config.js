/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030405',
          900: '#07090C',
          850: '#0C1016',
          800: '#1A222D',
          750: '#202A36',
          700: '#303D4D',
          600: '#405064',
          500: '#52647A',
          400: '#52647D',
        },
        cyan: {
          400: '#63B7C5',
          500: '#3298AA',
          600: '#267A8A',
        },
        'electric-blue': {
          400: '#70A9D0',
          500: '#3D83B5',
          600: '#306A93',
        },
        violet: {
          400: '#8B85FF',
          500: '#635BFF',
          600: '#4F48CC',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'glow-cyan': '0 0 12px rgba(50, 152, 170, 0.16)',
        'glow-blue': '0 0 12px rgba(61, 131, 181, 0.16)',
        'inner-highlight': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
