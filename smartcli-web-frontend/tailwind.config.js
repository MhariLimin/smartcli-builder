/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#071426',
          900: '#0D1B32',
          850: '#111D35',
          800: '#162236',
          750: '#1A2840',
          700: '#1E2D4A',
          600: '#243552',
          500: '#2E4268',
          400: '#3A5280'
        },
        cyan: {
          400: '#22E5FF',
          500: '#00D9F5',
          600: '#00B8D1'
        },
        electric: {
          400: '#60B8FF',
          500: '#18A8FF',
          600: '#1088CC'
        },
        violet: {
          400: '#8B85FF',
          500: '#635BFF',
          600: '#4F48CC'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }]
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(0, 217, 245, 0.18)',
        'glow-blue': '0 0 24px rgba(24, 168, 255, 0.16)',
        'inner-highlight': 'inset 0 1px 0 rgba(255,255,255,0.06)'
      }
    }
  },
  plugins: []
};
