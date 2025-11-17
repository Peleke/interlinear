import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Interlinear - Interactive Language Learning',
    short_name: 'Interlinear',
    description: 'Master languages through interactive reading and AI-powered conversations',
    start_url: '/',
    display: 'standalone',
    background_color: '#8b7355', // sepia-700 for splash consistency
    theme_color: '#8b7355', // sepia-700 for native app feel
    orientation: 'portrait',
    categories: ['education', 'productivity'],
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
    ]
  }
}