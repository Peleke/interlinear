import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/reader', label: 'Reader' },
    { href: '/library', label: 'Library' },
    { href: '/flashcards', label: 'Flashcards' },
    { href: '/vocabulary', label: 'Vocabulary' },
    { href: '/profile', label: 'Profile' },
  ]

  return (
    <nav className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-serif text-sepia-900">Interlinear</h1>

      <div className="flex items-center gap-4">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-sepia-700 text-white'
                  : 'text-sepia-700 border border-sepia-700 hover:bg-sepia-50'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
