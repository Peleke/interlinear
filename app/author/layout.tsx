import { Navigation } from '@/components/Navigation'

export default function AuthorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-parchment">
      <div className="container mx-auto px-4 py-6">
        <Navigation />
        {/* Author Mode Indicator */}
        <div className="mb-4 px-4 py-2 bg-sepia-100 border-l-4 border-gold rounded-r-md">
          <p className="text-sm text-sepia-700 font-medium">
            ✍️ Author Mode
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
