import { defineConfig } from 'unocss'

export default defineConfig({
  shortcuts: {
    'text-gradient': 'bg-gradient-to-r from-blue-600 via-purple-600 to-sepia-700 bg-clip-text text-transparent',
    'card-hover': 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
    'btn-primary': 'bg-gradient-to-r from-blue-600 to-sepia-700 hover:from-blue-700 hover:to-sepia-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg',
    'stats-card': 'bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20',
    'demo-box': 'bg-gradient-to-r from-blue-50 to-sepia-50 p-4 rounded-lg border-2 border-blue-200 shadow-md',
    'metric-highlight': 'text-4xl font-bold bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent'
  },
  theme: {
    colors: {
      primary: {
        50: '#f0f9ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8'
      },
      sepia: {
        50: '#fefce8',
        100: '#fef9e7',
        200: '#fef3c7',
        300: '#fde68a',
        400: '#facc15',
        500: '#eab308',
        600: '#ca8a04',
        700: '#a16207',
        800: '#854d0e',
        900: '#713f12'
      }
    }
  }
})