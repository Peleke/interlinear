'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const links = [
    { href: '/dashboard', label: 'Home' },
    { href: '/reader', label: 'Reader' },
    { href: '/library', label: 'Library' },
    { href: '/flashcards', label: 'Flashcards' },
    { href: '/vocabulary', label: 'Vocabulary' },
    { href: '/courses', label: 'Courses' },
    { href: '/profile', label: 'Profile' },
  ]

  const authorLink = { href: '/author', label: '✍️ Author' }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      <nav className="flex items-center justify-between mb-6 relative">
        <Link href="/" className="text-3xl font-serif text-sepia-900 hover:text-crimson transition-colors">
          Interlinear
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-md transition-colors text-sm ${
                  isActive
                    ? 'bg-sepia-700 text-white dark:bg-neon-green dark:text-black glow-green'
                    : 'text-sepia-700 border border-sepia-700 hover:bg-sepia-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            )
          })}

          {/* Author Mode Link - Styled Differently */}
          <Link
            href={authorLink.href}
            className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              pathname.startsWith('/author')
                ? 'bg-gold text-sepia-900 shadow-sm dark:bg-neon-purple dark:text-black glow-purple'
                : 'bg-sepia-100 text-sepia-700 border border-sepia-300 hover:bg-sepia-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'
            }`}
          >
            {authorLink.label}
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-sepia-700 hover:bg-sepia-100 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/50 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeMobileMenu}
          />

          {/* Slide-out Drawer */}
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-parchment dark:bg-gray-900 shadow-2xl z-50 md:hidden animate-in slide-in-from-right duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-sepia-200 dark:border-gray-600">
                <h2 className="text-2xl font-serif text-sepia-900 dark:text-white">Menu</h2>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 text-sepia-700 dark:text-gray-300 hover:bg-sepia-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 flex flex-col gap-2 p-6">
                {links.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className={`px-4 py-3 rounded-md transition-colors text-lg ${
                        isActive
                          ? 'bg-sepia-700 text-white dark:bg-neon-green dark:text-black glow-green'
                          : 'text-sepia-700 dark:text-gray-200 hover:bg-sepia-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}

                {/* Author Mode Link - Mobile */}
                <div className="pt-4 mt-4 border-t border-sepia-200 dark:border-gray-600">
                  <Link
                    href={authorLink.href}
                    onClick={closeMobileMenu}
                    className={`px-4 py-3 rounded-md transition-colors text-lg font-medium ${
                      pathname.startsWith('/author')
                        ? 'bg-gold text-sepia-900 dark:bg-neon-purple dark:text-black glow-purple'
                        : 'bg-sepia-100 text-sepia-700 hover:bg-sepia-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {authorLink.label}
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-sepia-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-sepia-600 dark:text-gray-400">Theme</span>
                  <ThemeToggle />
                </div>
                <p className="text-xs text-sepia-500 dark:text-gray-500 text-center">
                  Interlinear Reader
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
