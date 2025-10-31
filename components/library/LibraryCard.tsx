import Link from 'next/link'

interface LibraryText {
  id: string
  title: string
  content: string
  language: string
  wordCount: number
  createdAt: string
  updatedAt: string
}

interface LibraryCardProps {
  text: LibraryText
  onDelete: (id: string) => void
}

export function LibraryCard({ text, onDelete }: LibraryCardProps) {
  // Get first 100 characters for excerpt
  const excerpt = text.content.length > 100
    ? text.content.substring(0, 100) + '...'
    : text.content

  // Format date
  const date = new Date(text.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="bg-white border border-sepia-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/reader?libraryId=${text.id}`} className="block p-6">
        {/* Title */}
        <h2 className="text-xl font-serif text-sepia-900 mb-2 line-clamp-2">
          {text.title}
        </h2>

        {/* Excerpt */}
        <p className="text-sepia-600 text-sm mb-4 line-clamp-3">
          {excerpt}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-sepia-500">
          <span>{text.wordCount} words</span>
          <span>•</span>
          <span>{date}</span>
          <span>•</span>
          <span className="uppercase">{text.language}</span>
        </div>
      </Link>

      {/* Delete Button */}
      <div className="border-t border-sepia-100 px-6 py-3">
        <button
          onClick={(e) => {
            e.preventDefault()
            onDelete(text.id)
          }}
          className="text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
