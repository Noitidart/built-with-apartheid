import type { Config } from 'tailwindcss';

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)'
      },
      animation: {
        shimmer: 'shimmer 5s ease-in-out infinite'
      },
      keyframes: {
        shimmer: {
          '0%': {
            'background-position': '200% 0'
          },
          '50%': {
            'background-position': '0% 0'
          },
          '100%': {
            'background-position': '-200% 0'
          }
        }
      }
    }
  },

  plugins: []
} satisfies Config;
