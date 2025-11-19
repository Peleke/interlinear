import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Interlinear - Interactive Language Learning',
    short_name: 'Interlinear',
    description: 'Master languages through interactive reading, daily vocabulary, and AI-powered conversations',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f5f1eb', // sepia-50 for clean splash
    theme_color: '#7c2d12', // red-900 for brand consistency
    orientation: 'portrait',
    scope: '/',
    lang: 'en',
    categories: ['education', 'reference', 'productivity'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    shortcuts: [
      {
        name: 'Word of the Day',
        short_name: 'Word',
        description: 'View today\'s featured word',
        url: '/word-of-day',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      },
      {
        name: 'Dashboard',
        short_name: 'Learn',
        description: 'Continue your learning journey',
        url: '/dashboard',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    ]
  }
}