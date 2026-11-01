/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // A deliberately distinct pairing: Inter's humanist, highly-legible
        // letterforms for body copy and dense data (tables, forms), and
        // Space Grotesk's geometric, slightly technical character for
        // headings/display - the two should read as clearly different
        // typefaces at a glance, not just different weights of one font.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce8ff',
          200: '#b9d1ff',
          300: '#8bb0ff',
          400: '#5586ff',
          500: '#2863f0',
          600: '#1c4ed8',
          700: '#193fb0',
          800: '#1a358c',
          900: '#192f71',
        },
        accent: {
          400: '#22d3c5',
          500: '#0fb8ab',
          600: '#0a9689',
        },
        // Soft pastel fills for icon badges in stat cards / mini info cards,
        // matching the reference screenshots' rounded icon-circle look.
        pastel: {
          blue: '#eaf0ff',
          green: '#e4f9ef',
          amber: '#fff3df',
          purple: '#f1ebff',
          rose: '#ffe9ed',
        },
        canvas: '#f4f6fb',
        // Deep navy scale for dark mode - matches the reference design's
        // near-black blue background (not plain slate/gray).
        ink: {
          900: '#0b1220',
          950: '#060a15',
          1000: '#030611',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)',
        floating: '0 8px 24px rgba(16,24,40,0.12)',
        soft: '0 2px 10px rgba(30,41,59,0.06)',
        glow: '0 0 0 1px rgba(85,134,255,0.25), 0 8px 40px rgba(40,99,240,0.35)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(60% 50% at 50% 0%, rgba(40,99,240,0.35) 0%, rgba(6,10,21,0) 70%)',
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0, transform: 'translateY(4px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
        glowPulse: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        skeletonSweep: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
        popIn: { '0%': { opacity: 0, transform: 'scale(0.94)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out',
        float: 'float 3.5s ease-in-out infinite',
        glowPulse: 'glowPulse 2.2s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'skeleton-sweep': 'skeletonSweep 1.6s ease-in-out infinite',
        popIn: 'popIn 0.18s ease-out',
      },
    },
  },
  plugins: [],
};
