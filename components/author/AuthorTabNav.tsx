'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AuthorTabNav() {
  const pathname = usePathname()
  const isLessons = pathname?.startsWith('/author/lessons')
  const isCourses = pathname?.startsWith('/author/courses')

  return (
    <div className="border-b border-sepia-200 mb-6">
      <nav className="flex gap-1" aria-label="Author navigation">
        <Link
          href="/author/lessons"
          className={cn(
            'flex items-center gap-2 px-4 py-3 font-medium text-sm rounded-t-md transition-colors',
            isLessons
              ? 'bg-parchment text-sepia-900 border-b-2 border-gold'
              : 'text-sepia-600 hover:text-sepia-900 hover:bg-sepia-50'
          )}
        >
          <BookOpen className="h-4 w-4" />
          Lessons
        </Link>
        <Link
          href="/author/courses"
          className={cn(
            'flex items-center gap-2 px-4 py-3 font-medium text-sm rounded-t-md transition-colors',
            isCourses
              ? 'bg-parchment text-sepia-900 border-b-2 border-gold'
              : 'text-sepia-600 hover:text-sepia-900 hover:bg-sepia-50'
          )}
        >
          <GraduationCap className="h-4 w-4" />
          Courses
        </Link>
      </nav>
    </div>
  )
}
