/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['Outfit', 'sans-serif'],
      },
      colors: {
        lake: {
          bg: '#020617',
          surface: '#06102B',
          solid: '#0F172A',
          card: 'rgba(15,23,42,0.4)',
        },
        gold: {
          DEFAULT: '#FDE047',
          light: '#FEF08A',
          muted: '#F59E0B',
        },
        silver: '#38BDF8',
        emerald: '#059669',
        emotion: {
          hopeful: '#FBBF24',
          sad: '#94A3B8',
          urgent: '#F87171',
          dreamy: '#F8FAFC',
          joyful: '#34D399',
          anxious: '#FB923C',
          grateful: '#A78BFA',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(251,191,36,0.4)',
        'glow-silver': '0 0 20px rgba(56,189,248,0.4)',
        'glow-hopeful': '0 0 15px rgba(251,191,36,0.5)',
        'glow-sad': '0 0 15px rgba(148,163,184,0.3)',
        'glow-urgent': '0 0 15px rgba(248,113,113,0.5)',
        'glow-dreamy': '0 0 15px rgba(248,250,252,0.6)',
        'glass': '0 8px 32px rgba(0,0,0,0.3)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'ripple': 'ripple 1.5s ease-out forwards',
        'coin-drop': 'coinDrop 1.2s ease-in forwards',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(253,224,71,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(253,224,71,0.8)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.6' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        coinDrop: {
          '0%': { transform: 'scale(0) translateY(-50px)', opacity: '0' },
          '30%': { transform: 'scale(1.2) translateY(0)', opacity: '1' },
          '60%': { transform: 'scale(1) translateY(0)', opacity: '1' },
          '100%': { transform: 'scale(0.5) translateY(200px)', opacity: '0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
