import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#15803d',
          600: '#166534',
          700: '#14532d',
          900: '#052e16',
        },
        nepal: {
          crimson: '#DC143C',
          darkCrimson: '#9E0B28',
          blue: '#003893',
          darkBlue: '#00225E',
          gold: '#D97706',
        },
      },
    },
  },
  plugins: [],
};

export default config;
