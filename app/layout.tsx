import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from 'sonner'
import { PWALifecycle } from '@/components/pwa/PWALifecycle'

export const metadata: Metadata = {
  title: 'Interlinear - Interactive Language Learning',
  description: 'Master languages through interactive reading and AI-powered conversations',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Interlinear',
    startupImage: [
      '/icon-192x192.png',
      '/icon-512x512.png'
    ]
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Interlinear',
    title: 'Interlinear - Interactive Language Learning',
    description: 'Master languages through interactive reading and AI-powered conversations',
  },
  twitter: {
    card: 'summary',
    title: 'Interlinear - Interactive Language Learning',
    description: 'Master languages through interactive reading and AI-powered conversations',
  },
}

export const viewport: Viewport = {
  themeColor: '#8b7355',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" />
        <PWALifecycle />
      </body>
    </html>
  )
}
