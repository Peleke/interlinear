import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Interlinear - Interactive Language Learning',
    short_name: 'Interlinear',
    description: 'Master languages through interactive reading and AI-powered conversations',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#8b7355', // sepia-700 for splash consistency
    theme_color: '#8b7355', // sepia-700 for native app feel
    orientation: 'portrait',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ],
    screenshots: [
      {
        src: '/screenshot-wide.svg',
        sizes: '1280x720',
        type: 'image/svg+xml',
        form_factor: 'wide',
        label: 'Interactive Spanish Reading Experience'
      },
      {
        src: '/screenshot-mobile.svg',
        sizes: '390x844',
        type: 'image/svg+xml',
        form_factor: 'narrow',
        label: 'Mobile Language Learning'
      }
    ]
  }
}