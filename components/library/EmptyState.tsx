import Link from 'next/link'

export function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="mb-6">
        <svg
          className="mx-auto h-24 w-24 text-sepia-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-serif text-sepia-900 mb-2">
        Your library is empty
      </h2>

      <p className="text-sepia-600 mb-8 max-w-md mx-auto">
        Start building your Spanish reading collection. Paste any text in the reader
        and click "Render to Clickable" to save it to your library.
      </p>

      <Link
        href="/reader"
        className="inline-flex items-center gap-2 px-6 py-3 bg-sepia-700 text-white rounded-lg hover:bg-sepia-800 transition-colors"
      >
        <span>Go to Reader</span>
        <span>→</span>
      </Link>
    </div>
  )
}
