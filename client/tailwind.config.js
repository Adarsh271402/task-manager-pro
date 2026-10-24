/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#0a0714',
          900: '#120d24',
          850: '#171130',
          800: '#1d1639',
          700: '#281e4d',
          600: '#372a66'
        },
        brand: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 10px 24px -12px rgba(0,0,0,0.55)',
        glow: '0 0 0 1px rgba(139,92,246,0.35), 0 8px 30px -6px rgba(124,58,237,0.45)'
      }
    }
  },
  plugins: []
}
