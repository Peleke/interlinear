import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { TutorialProvider } from '@/components/tutorials/TutorialProvider'
import { Toaster } from 'sonner'
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner'

export const metadata: Metadata = {
  title: 'Interlinear - Spanish Reading Companion',
  description: 'Click-to-define Spanish reading application with TTS pronunciation',
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
        <AuthProvider>
          <TutorialProvider>
            {children}
          </TutorialProvider>
        </AuthProvider>
        <Toaster position="top-right" />
        <PWAInstallBanner />
      </body>
    </html>
  )
}
