import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#F9F6F0',
        ink: '#1A1614',
        gold: {
          DEFAULT: '#D4A574',
          100: '#FEF3C7', // Sentence highlight
          200: '#F4E4C1', // Word selection
        },
        sepia: {
          50: '#FAF8F5',
          100: '#F5F1EB',
          200: '#E8DFD3',
          300: '#D4C4B0',
          400: '#B8A88F',
          500: '#8B7355',
          600: '#6F5C44',
          700: '#574634',
          800: '#3F3227',
          900: '#2B221B',
        },
        crimson: '#A4443E',
        // 🌅 Desert Sunset Gaming Palette
        desert: {
          sand: '#F5F1E8',      // Light sand dunes
          warm: '#E8DCC0',      // Warm afternoon sand
          amber: '#CC8A47',     // Deep amber rocks
          sage: '#7A8471',      // Desert sage accents
        },
        sunset: {
          gold: '#E6A853',      // Golden hour glow
          red: '#B85450',       // Striking red rocks
          blood: '#8B2635',     // Deep dramatic red
        },
        dusk: {
          purple: '#6B4E7D',    // Rare but striking purple skies
          shadow: '#4A2C54',    // Deep evening shadows
        },
        // shadcn/ui theme variables
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        // 🎮 Gaming Dashboard Animations
        'pulse-glow': {
          '0%, 100%': {
            transform: 'scale(1)',
            filter: 'brightness(1) drop-shadow(0 0 5px rgba(232, 168, 83, 0.3))'
          },
          '50%': {
            transform: 'scale(1.02)',
            filter: 'brightness(1.1) drop-shadow(0 0 15px rgba(232, 168, 83, 0.6))'
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'particle-drift': {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '0.8' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translate(-20px, -30px) rotate(180deg)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
        'slide-in-from-top-2': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
        'in': 'fade-in 0.3s ease-in-out',
        // 🎮 Gaming Animations
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'particle-drift': 'particle-drift 8s linear infinite',
      },
    },
  },
  plugins: [
    typography,
  ],
}
export default config
