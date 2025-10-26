'use client'

interface TextRenderPanelProps {
  text: string
  onEditClick: () => void
}

export function TextRenderPanel({ text, onEditClick }: TextRenderPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-serif text-sepia-900">Interactive Reading</h2>
        <button
          onClick={onEditClick}
          className="px-4 py-2 text-sepia-700 border border-sepia-700 rounded-md hover:bg-sepia-50 transition-colors"
        >
          ← Edit Text
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-sepia-200 min-h-96">
        <p className="text-lg font-serif text-ink leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  )
}
