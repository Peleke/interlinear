import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Interlinear - Spanish Reading Companion',
  description: 'Click-to-define Spanish reading application with TTS pronunciation',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
