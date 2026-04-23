/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        ink: {
          DEFAULT: '#1a1a2e',
          50: '#f0f0f8',
          100: '#d8d8f0',
          200: '#b0b0e0',
          300: '#8888d0',
          400: '#6060c0',
          500: '#3838a0',
          600: '#1a1a2e',
          700: '#14142a',
          800: '#0e0e20',
          900: '#08081a',
        },
        saffron: {
          DEFAULT: '#f59e0b',
          light: '#fde68a',
          dark: '#d97706',
        },
        jade: {
          DEFAULT: '#10b981',
          light: '#a7f3d0',
          dark: '#059669',
        },
        rose: {
          DEFAULT: '#f43f5e',
          light: '#fecdd3',
          dark: '#e11d48',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          150: '#eaeff5',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.04)',
        lifted: '0 4px 16px -2px rgba(0,0,0,0.12), 0 2px 6px -2px rgba(0,0,0,0.08)',
        glow: '0 0 20px rgba(245,158,11,0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
