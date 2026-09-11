import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'media',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'royal-blue': '#1B3FA0',
        'royal-blue-deep': '#142E78',
        onyx: '#111014',
        ink: '#0A0A0C',
        ivory: '#F5F2EA',
        cream: '#EFEAE0',
        'champagne-gold': '#B08D3F',
        'champagne-gold-light': '#D4B876',
        charcoal: '#2B2A29',
        stone: '#8A8579',
        glass: 'rgba(255,255,255,0.12)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        hand: ['var(--font-hand)'],
        sans: ['var(--font-sans)'],
      },
      letterSpacing: {
        widest2: '0.35em',
      },
      backgroundImage: {
        checkerboard:
          'linear-gradient(45deg, #111014 25%, transparent 25%), linear-gradient(-45deg, #111014 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111014 75%), linear-gradient(-45deg, transparent 75%, #111014 75%)',
        'grain-fade': 'radial-gradient(120% 100% at 50% 0%, rgba(0,0,0,0) 40%, rgba(10,10,12,0.55) 100%)',
      },
      backgroundSize: { checker: '40px 40px' },
      keyframes: {
        'bounce-chevron': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.5' },
          '50%': { transform: 'translateY(8px)', opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        chevron: 'bounce-chevron 2s ease-in-out infinite',
        'fade-up': 'fade-up 0.8s cubic-bezier(0.16,1,0.3,1) both',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
