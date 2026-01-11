import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#fbbf24',
        'primary-dark': '#d97706',
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          900: '#111827',
          950: '#030712',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(15,23,42,1))',
      },
    },
  },
  plugins: [],
};

export default config;
