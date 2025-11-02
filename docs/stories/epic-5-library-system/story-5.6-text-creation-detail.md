# Story 5.6: Text Creation & Detail Pages

**Epic**: 5 - Library System
**Status**: 🚧 Ready for Dev
**Priority**: P0
**Estimate**: 75 minutes

---

## User Story

**As a** language learner
**I want to** create new texts and view text details with associated vocabulary
**So that** I can build my personal reading library

---

## Acceptance Criteria

- [ ] REMOVED: `/library/new` page (auto-save from reader instead)
- [ ] REMOVED: `/library/[id]` detail page (cards link directly to reader)
- [ ] Reader displays title when viewing library text
- [ ] Reader hides "Save to Library" button when viewing library text
- [ ] Vocabulary filtered by current library text when applicable

---

## Tasks

### Task 1: Create Text Form Component
- [ ] Create `components/library/TextForm.tsx`
- [ ] Add controlled inputs for title and content
- [ ] Add language selector (default to 'es')
- [ ] Implement client-side validation
- [ ] Show character count for content
- [ ] Disable submit when invalid
- [ ] Handle loading state during save

### Task 2: Create New Text Page
- [ ] Create `app/library/new/page.tsx`
- [ ] Render TextForm component
- [ ] Handle form submission (POST to /api/library)
- [ ] Show success message on save
- [ ] Redirect to /library on success
- [ ] Handle error states

### Task 3: Create VocabListByText Component
- [ ] Create `components/library/VocabListByText.tsx`
- [ ] Fetch vocabulary from `/api/library/[id]/vocabulary`
- [ ] Display word, definition, click count
- [ ] Display original sentence in italics
- [ ] Show empty state if no vocab
- [ ] Make vocabulary items expandable for full definition

### Task 4: Create Text Detail Page
- [ ] Create `app/library/[id]/page.tsx`
- [ ] Fetch text from `/api/library/[id]`
- [ ] Display full title and content
- [ ] Render VocabListByText component
- [ ] Add "Open in Reader" button (navigate to `/reader?libraryId={id}`)
- [ ] Add "Delete Text" button
- [ ] Implement delete confirmation modal
- [ ] Handle loading and error states

### Task 5: Write Tests
- [ ] Test TextForm validation
- [ ] Test character limits enforced
- [ ] Test form submission
- [ ] Test text detail page renders
- [ ] Test vocabulary list displays
- [ ] Test delete confirmation flow
- [ ] Test "Open in Reader" navigation

---

## Implementation

### File: `components/library/TextForm.tsx`

```typescript
'use client'

import { useState } from 'react'

interface TextFormProps {
  onSubmit: (data: { title: string; content: string; language: string }) => Promise<void>
  initialData?: { title: string; content: string; language: string }
}

export function TextForm({ onSubmit, initialData }: TextFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [language, setLanguage] = useState(initialData?.language || 'es')
  const [loading, setLoading] = useState(false)

  const titleValid = title.trim().length > 0 && title.length <= 200
  const contentValid = content.trim().length > 0 && content.length <= 50000
  const formValid = titleValid && contentValid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValid) return

    setLoading(true)
    try {
      await onSubmit({ title: title.trim(), content: content.trim(), language })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Title Input */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-sepia-900 mb-2">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter text title..."
          maxLength={200}
          className="w-full px-4 py-2 border-2 border-sepia-300 rounded-lg focus:border-gold-500 focus:outline-none"
        />
        <div className="text-xs text-sepia-600 mt-1">
          {title.length}/200 characters
        </div>
      </div>

      {/* Language Selector */}
      <div>
        <label htmlFor="language" className="block text-sm font-medium text-sepia-900 mb-2">
          Language
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-4 py-2 border-2 border-sepia-300 rounded-lg focus:border-gold-500 focus:outline-none"
        >
          <option value="es">Spanish</option>
          <option value="en">English</option>
          <option value="fr">French</option>
        </select>
      </div>

      {/* Content Textarea */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-sepia-900 mb-2">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your Spanish text here..."
          rows={20}
          maxLength={50000}
          className="w-full px-4 py-2 border-2 border-sepia-300 rounded-lg focus:border-gold-500 focus:outline-none font-serif"
        />
        <div className="text-xs text-sepia-600 mt-1">
          {content.length}/50,000 characters
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={!formValid || loading}
          className="px-6 py-3 bg-gold-500 text-parchment rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Saving...' : 'Save Text'}
        </button>
      </div>
    </form>
  )
}
```

### File: `app/library/new/page.tsx`

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { TextForm } from '@/components/library/TextForm'

export default function NewTextPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: { title: string; content: string; language: string }) => {
    try {
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create text')
      }

      // Success - redirect to library
      router.push('/library')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif text-sepia-900 mb-8">Add New Text</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <TextForm onSubmit={handleSubmit} />
    </div>
  )
}
```

### File: `components/library/VocabListByText.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'

interface VocabEntry {
  id: string
  word: string
  definition: any
  click_count: number
  original_sentence?: string
}

interface VocabListByTextProps {
  textId: string
}

export function VocabListByText({ textId }: VocabListByTextProps) {
  const [vocabulary, setVocabulary] = useState<VocabEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadVocabulary()
  }, [textId])

  const loadVocabulary = async () => {
    try {
      const response = await fetch(`/api/library/${textId}/vocabulary`)
      if (!response.ok) throw new Error('Failed to fetch vocabulary')
      const data = await response.json()
      setVocabulary(data.vocabulary)
    } catch (error) {
      console.error('Failed to load vocabulary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-sepia-700">Loading vocabulary...</div>
  }

  if (vocabulary.length === 0) {
    return (
      <div className="text-center py-8 text-sepia-600">
        <p>No vocabulary saved from this text yet.</p>
        <p className="text-sm mt-2">Click words while reading to save them here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {vocabulary.map((entry) => (
        <div
          key={entry.id}
          className="bg-parchment border-2 border-sepia-300 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              className="text-lg font-serif text-sepia-900 hover:text-gold-600"
            >
              {entry.word}
            </button>
            <span className="text-xs text-sepia-600">
              Clicked {entry.click_count} {entry.click_count === 1 ? 'time' : 'times'}
            </span>
          </div>

          {/* Original Sentence */}
          {entry.original_sentence && (
            <p className="text-sm text-sepia-700 italic mb-2">
              "{entry.original_sentence}"
            </p>
          )}

          {/* Expanded Definition */}
          {expandedId === entry.id && entry.definition && (
            <div className="mt-3 pt-3 border-t border-sepia-200">
              <div className="text-sm text-sepia-800">
                <strong>Definition:</strong> {JSON.stringify(entry.definition, null, 2)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

### File: `app/library/[id]/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { VocabListByText } from '@/components/library/VocabListByText'
import { LibraryText } from '@/lib/services/library'

export default function TextDetailPage() {
  const router = useRouter()
  const params = useParams()
  const textId = params.id as string

  const [text, setText] = useState<LibraryText | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadText()
  }, [textId])

  const loadText = async () => {
    try {
      const response = await fetch(`/api/library/${textId}`)
      if (!response.ok) throw new Error('Text not found')
      const data = await response.json()
      setText(data.text)
    } catch (error) {
      console.error('Failed to load text:', error)
      router.push('/library')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/library/${textId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete')
      router.push('/library')
    } catch (error) {
      console.error('Failed to delete text:', error)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sepia-700">Loading text...</div>
      </div>
    )
  }

  if (!text) return null

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif text-sepia-900">{text.title}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/reader?libraryId=${textId}`)}
            className="px-4 py-2 bg-gold-500 text-parchment rounded hover:bg-gold-600 transition-colors"
          >
            Open in Reader
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Text Content */}
        <div className="lg:col-span-2 bg-parchment border-2 border-sepia-300 rounded-lg p-6">
          <div className="prose prose-sepia max-w-none font-serif whitespace-pre-wrap">
            {text.content}
          </div>
        </div>

        {/* Vocabulary Sidebar */}
        <div>
          <h2 className="text-xl font-serif text-sepia-900 mb-4">Vocabulary</h2>
          <VocabListByText textId={textId} />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-parchment border-2 border-sepia-300 rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-serif text-sepia-900 mb-3">
              Delete this text?
            </h3>
            <p className="text-sepia-700 mb-6">
              This will permanently delete "{text.title}". Your vocabulary will be preserved.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 border-2 border-sepia-300 rounded hover:bg-sepia-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Testing Checklist

### Manual Testing
- [ ] Navigate to `/library/new`
- [ ] Test form validation (empty fields)
- [ ] Test character limits (exceed 200 for title, 50k for content)
- [ ] Create a text and verify redirect to library
- [ ] Click text card → verify detail page loads
- [ ] Verify full text content displayed
- [ ] Verify vocabulary list shows (if vocab exists)
- [ ] Click "Open in Reader" → verify navigation
- [ ] Click "Delete" → verify modal appears
- [ ] Confirm delete → verify redirect to library
- [ ] Test responsive design

### Component Tests
```typescript
// Test form validation
// Test character counters
// Test submit button disabled when invalid
// Test vocabulary list rendering
// Test delete confirmation modal
```

### Validation Checklist
- [ ] Form validation prevents empty submissions
- [ ] Character limits enforced on client
- [ ] Success redirect works
- [ ] Error messages displayed
- [ ] Loading states visible
- [ ] Delete confirmation required
- [ ] Vocabulary empty state shown correctly
- [ ] "Open in Reader" navigation includes libraryId param

---

## Dependencies

- Story 5.4 (API Routes) - MUST BE COMPLETE
- Story 5.3 (Text utils) - MUST BE COMPLETE

---

## Dev Notes

- Use `'use client'` for all pages (data fetching)
- `whitespace-pre-wrap` preserves text formatting
- Delete modal: fixed overlay with z-50
- Vocabulary expandable: click word to see full definition
- "Open in Reader" passes `?libraryId={id}` query param (Reader will handle)
- Delete preserves vocabulary (ON DELETE SET NULL in migration)

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Create Text Form Component
- [ ] Task 2: Create New Text Page
- [ ] Task 3: Create VocabListByText Component
- [ ] Task 4: Create Text Detail Page
- [ ] Task 5: Write Tests

### Debug Log

### Completion Notes

### File List

### Change Log
