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
        // Strict 3-Colour Dark Luxury Palette: Black (60%), Gold (15%), White (25%)
        black: {
          DEFAULT: '#101010',
          pure: '#101010',
        },
        gold: {
          DEFAULT: '#C2A964',
          full: '#C2A964',
          10: 'rgba(194, 169, 100, 0.10)',
          20: 'rgba(194, 169, 100, 0.20)',
          30: 'rgba(194, 169, 100, 0.30)',
          60: 'rgba(194, 169, 100, 0.60)',
          80: 'rgba(194, 169, 100, 0.80)',
          90: 'rgba(194, 169, 100, 0.90)',
        },
        white: {
          DEFAULT: '#FFFFFF',
          90: 'rgba(255, 255, 255, 0.90)',
          80: 'rgba(255, 255, 255, 0.80)',
          70: 'rgba(255, 255, 255, 0.70)',
          60: 'rgba(255, 255, 255, 0.60)',
          20: 'rgba(255, 255, 255, 0.20)',
          12: 'rgba(255, 255, 255, 0.12)',
          10: 'rgba(255, 255, 255, 0.10)',
          8: 'rgba(255, 255, 255, 0.08)',
          6: 'rgba(255, 255, 255, 0.06)',
          5: 'rgba(255, 255, 255, 0.05)',
        },
        // Semantic Token Mappings
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)', // Charcoal #1A1A1A appearance
          raised: 'rgba(255, 255, 255, 0.09)',
        },
        accent: {
          DEFAULT: '#C2A964',
          hover: 'rgba(194, 169, 100, 0.90)',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Noto Sans Devanagari"',
          'sans-serif',
        ],
        display: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Noto Sans Devanagari"',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      transitionTimingFunction: {
        'out-custom': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.6)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.6)',
        cardHover: '0 12px 32px -4px rgba(0, 0, 0, 0.8)',
        glowGold: '0 0 0 3px rgba(194, 169, 100, 0.35)',
        glowGoldLg: '0 0 24px rgba(194, 169, 100, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
