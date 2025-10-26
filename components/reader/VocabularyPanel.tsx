'use client'

export function VocabularyPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-serif text-sepia-900">Your Vocabulary</h2>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-sepia-200 min-h-96">
        <p className="text-sepia-600 text-center py-12">
          No vocabulary entries yet. Click on words while reading to add them to your vocabulary.
        </p>
      </div>
    </div>
  )
}
