import type { Config } from 'tailwindcss'

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
    },
  },
  plugins: [],
}
export default config
