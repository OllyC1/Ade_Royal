/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Ade-Royal School Brand Colors - Separate Blue and Wine Themes
        'royal-blue': {
          50: '#f0f8ff',
          100: '#e1f2fe',
          200: '#b3e0fd',
          300: '#6bc2fb',
          400: '#1ba3f6',
          500: '#0284c7', // Primary blue
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#0f3a5a',
          950: '#0a2847',
        },
        'royal-wine': {
          50: '#fdf4f5',
          100: '#fce7eb',
          200: '#f9cdd6', 
          300: '#f4a3b4',
          400: '#ec7894',
          500: '#dc143c', // Deep wine/burgundy
          600: '#be123a',
          700: '#9f1239',
          800: '#881337',
          900: '#6f1732',
          950: '#5a0f26',
        },
        // Existing colors for compatibility
        primary: {
          50: '#f0f8ff',
          100: '#e1f2fe',
          200: '#b3e0fd',
          300: '#6bc2fb',
          400: '#1ba3f6',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#0f3a5a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Academic-friendly neutral grays
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(2, 132, 199, 0.07), 0 10px 20px -2px rgba(2, 132, 199, 0.04)',
        'medium': '0 4px 25px -5px rgba(2, 132, 199, 0.1), 0 10px 10px -5px rgba(2, 132, 199, 0.04)',
        'large': '0 10px 40px -10px rgba(2, 132, 199, 0.15), 0 20px 25px -5px rgba(2, 132, 199, 0.1)',
        'blue': '0 4px 20px -2px rgba(2, 132, 199, 0.2), 0 8px 16px -4px rgba(2, 132, 199, 0.1)',
        'wine': '0 4px 20px -2px rgba(220, 20, 60, 0.2), 0 8px 16px -4px rgba(220, 20, 60, 0.1)',
        'royal': '0 8px 30px -6px rgba(2, 132, 199, 0.3), 0 20px 25px -5px rgba(220, 20, 60, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'subtle-float': 'subtle-float 20s ease-in-out infinite',
        'royal-spin': 'royal-spin 1.2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'subtle-float': {
          '0%, 100%': { 
            backgroundPosition: '0% 0%, 100% 100%, 0% 0%' 
          },
          '50%': { 
            backgroundPosition: '10% 10%, 90% 90%, 0% 0%' 
          },
        },
        'royal-spin': {
          '0%': { 
            transform: 'rotate(0deg)',
            borderTopColor: '#0284c7',
          },
          '50%': { 
            borderTopColor: '#dc143c',
          },
          '100%': { 
            transform: 'rotate(360deg)',
            borderTopColor: '#0284c7',
          },
        },
      },
      backgroundImage: {
        'gradient-royal-blue': 'linear-gradient(135deg, #0284c7 0%, #075985 100%)',
        'gradient-royal-wine': 'linear-gradient(135deg, #dc143c 0%, #9f1239 100%)',
        'gradient-light-blue': 'linear-gradient(135deg, #f0f8ff 0%, #e1f2fe 100%)',
        'gradient-light-wine': 'linear-gradient(135deg, #fdf4f5 0%, #fce7eb 100%)',
        'royal-pattern': `
          radial-gradient(circle at 25% 25%, #0284c7 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, #dc143c 0%, transparent 50%),
          linear-gradient(135deg, #f0f8ff 0%, #fdf4f5 100%)
        `,
        'dots-blue': 'radial-gradient(circle, rgba(2, 132, 199, 0.2) 1px, transparent 1px)',
        'dots-wine': 'radial-gradient(circle, rgba(220, 20, 60, 0.2) 1px, transparent 1px)',
        'grid-blue': `
          linear-gradient(rgba(2, 132, 199, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(2, 132, 199, 0.1) 1px, transparent 1px)
        `,
        'grid-wine': `
          linear-gradient(rgba(220, 20, 60, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(220, 20, 60, 0.1) 1px, transparent 1px)
        `,
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
} 