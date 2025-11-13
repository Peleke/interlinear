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
        {children}
      </div>
    </div>
  )
}
