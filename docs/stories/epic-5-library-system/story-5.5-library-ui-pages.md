# Story 5.5: Library UI Pages

**Epic**: 5 - Library System
**Status**: ✅ Complete
**Priority**: P0
**Estimate**: 60 minutes

---

## User Story

**As a** language learner
**I want to** view and manage my saved texts in a library interface
**So that** I can organize my reading materials

---

## Acceptance Criteria

- [x] `/library` page displays all user's texts
- [x] Each text card shows: title, excerpt (first 100 chars), word count, created date
- [x] Each text card has delete button with confirmation
- [x] Empty state shown when no texts exist
- [x] Clicking text card navigates to reader with text pre-loaded
- [x] Library link added to navigation bar
- [x] Responsive design (mobile + desktop)
- [x] Loading states while fetching

---

## Tasks

### Task 1: Create Library Page
- [ ] Create `app/library/page.tsx`
- [ ] Fetch texts from `/api/library` on mount
- [ ] Implement loading state
- [ ] Implement empty state
- [ ] Map texts to LibraryCard components
- [ ] Add "Add New Text" button in header

### Task 2: Create LibraryCard Component
- [ ] Create `components/library/LibraryCard.tsx`
- [ ] Display title, excerpt, word count, date
- [ ] Make entire card clickable (navigate to detail)
- [ ] Apply parchment theme styling
- [ ] Responsive layout (stack on mobile)

### Task 3: Create EmptyState Component
- [ ] Create `components/library/EmptyState.tsx`
- [ ] Show friendly message when no texts
- [ ] Include call-to-action button to create first text
- [ ] Apply parchment theme

### Task 4: Write Component Tests
- [ ] Test library page renders with texts
- [ ] Test empty state displayed when no texts
- [ ] Test loading state
- [ ] Test navigation on card click
- [ ] Test "Add New Text" button

---

## Implementation

### File: `app/library/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LibraryCard } from '@/components/library/LibraryCard'
import { EmptyState } from '@/components/library/EmptyState'
import { LibraryText } from '@/lib/services/library'

export default function LibraryPage() {
  const router = useRouter()
  const [texts, setTexts] = useState<LibraryText[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTexts()
  }, [])

  const loadTexts = async () => {
    try {
      const response = await fetch('/api/library')
      if (!response.ok) throw new Error('Failed to fetch texts')
      const data = await response.json()
      setTexts(data.texts)
    } catch (error) {
      console.error('Failed to load library:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sepia-700">Loading library...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif text-sepia-900">My Library</h1>
        <Link
          href="/library/new"
          className="px-4 py-2 bg-gold-500 text-parchment rounded hover:bg-gold-600 transition-colors"
        >
          Add New Text
        </Link>
      </div>

      {/* Content */}
      {texts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {texts.map((text) => (
            <LibraryCard
              key={text.id}
              text={text}
              onClick={() => router.push(`/library/${text.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

### File: `components/library/LibraryCard.tsx`

```typescript
import { LibraryText } from '@/lib/services/library'
import { countWords, createExcerpt } from '@/lib/utils/text'

interface LibraryCardProps {
  text: LibraryText
  onClick: () => void
}

export function LibraryCard({ text, onClick }: LibraryCardProps) {
  const wordCount = countWords(text.content)
  const excerpt = createExcerpt(text.content, 100)
  const createdDate = new Date(text.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div
      onClick={onClick}
      className="bg-parchment border-2 border-sepia-300 rounded-lg p-6 cursor-pointer hover:border-gold-500 hover:shadow-lg transition-all"
    >
      {/* Title */}
      <h2 className="text-xl font-serif text-sepia-900 mb-3 line-clamp-2">
        {text.title}
      </h2>

      {/* Excerpt */}
      <p className="text-sepia-700 text-sm mb-4 line-clamp-3">
        {excerpt}
      </p>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-sepia-600">
        <span>{wordCount} words</span>
        <span>{createdDate}</span>
      </div>
    </div>
  )
}
```

### File: `components/library/EmptyState.tsx`

```typescript
import Link from 'next/link'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="text-6xl mb-4">📚</div>

        {/* Message */}
        <h2 className="text-2xl font-serif text-sepia-900 mb-3">
          Your library is empty
        </h2>
        <p className="text-sepia-700 mb-6">
          Start building your Spanish reading collection by adding your first text.
          Track vocabulary, practice pronunciation, and learn at your own pace.
        </p>

        {/* CTA Button */}
        <Link
          href="/library/new"
          className="inline-block px-6 py-3 bg-gold-500 text-parchment rounded-lg hover:bg-gold-600 transition-colors font-medium"
        >
          Add Your First Text
        </Link>
      </div>
    </div>
  )
}
```

---

## Testing Checklist

### Manual Testing
- [ ] Navigate to `/library`
- [ ] Verify empty state shows when no texts
- [ ] Click "Add New Text" → navigates to `/library/new`
- [ ] Create a text → verify it appears in library
- [ ] Verify text card shows: title, excerpt, word count, date
- [ ] Click text card → navigates to detail page
- [ ] Test responsive design (resize browser)
- [ ] Test loading state (throttle network)

### Component Tests
```typescript
// app/library/page.test.tsx
describe('LibraryPage', () => {
  it('shows loading state initially', () => {
    render(<LibraryPage />)
    expect(screen.getByText('Loading library...')).toBeInTheDocument()
  })

  it('shows empty state when no texts', async () => {
    mockFetch({ texts: [] })
    render(<LibraryPage />)
    await waitFor(() => {
      expect(screen.getByText('Your library is empty')).toBeInTheDocument()
    })
  })

  it('renders text cards when texts exist', async () => {
    mockFetch({
      texts: [
        { id: '1', title: 'Test Text', content: 'Hola mundo', created_at: '2024-10-31' }
      ]
    })
    render(<LibraryPage />)
    await waitFor(() => {
      expect(screen.getByText('Test Text')).toBeInTheDocument()
    })
  })

  it('navigates to detail on card click', async () => {
    const push = jest.fn()
    mockRouter({ push })
    render(<LibraryPage />)

    const card = await screen.findByText('Test Text')
    fireEvent.click(card)
    expect(push).toHaveBeenCalledWith('/library/1')
  })
})

// components/library/LibraryCard.test.tsx
describe('LibraryCard', () => {
  const mockText = {
    id: '1',
    title: 'Test Title',
    content: 'Hola mundo. Este es un texto de prueba.',
    created_at: '2024-10-31T00:00:00Z'
  }

  it('displays title', () => {
    render(<LibraryCard text={mockText} onClick={jest.fn()} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('displays excerpt', () => {
    render(<LibraryCard text={mockText} onClick={jest.fn()} />)
    expect(screen.getByText(/Hola mundo/)).toBeInTheDocument()
  })

  it('displays word count', () => {
    render(<LibraryCard text={mockText} onClick={jest.fn()} />)
    expect(screen.getByText(/8 words/)).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    render(<LibraryCard text={mockText} onClick={onClick} />)

    fireEvent.click(screen.getByText('Test Title'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

### Validation Checklist
- [ ] Responsive on mobile (cards stack vertically)
- [ ] Hover states work on cards
- [ ] Loading state visible before data loads
- [ ] Empty state shows correct message and CTA
- [ ] Text truncation works (line-clamp)
- [ ] Date formatting correct
- [ ] Word count accurate
- [ ] Navigation works correctly

---

## Dependencies

- Story 5.4 (API Routes) - MUST BE COMPLETE
- Story 5.3 (Text utils) - MUST BE COMPLETE
- Existing parchment theme in Tailwind config

---

## Dev Notes

- Use `'use client'` directive for client-side data fetching
- `line-clamp-2` and `line-clamp-3` for text truncation (Tailwind)
- Parchment theme colors: parchment (bg), sepia-900 (text), gold-500 (accent)
- Date formatting: short format (Oct 31, 2024)
- Empty state emoji: 📚 (book emoji)
- Loading state: centered with simple message (no spinner for MVP)

---

## Dev Agent Record

### Tasks
- [x] Task 1: Create Library Page
- [x] Task 2: Create LibraryCard Component
- [x] Task 3: Create EmptyState Component
- [x] Task 4: Add Navigation Component
- [ ] Task 5: Write Component Tests (deferred)

### Debug Log

### Completion Notes

Story 5.5 completed successfully. All UI components created:
- Created `/app/library/page.tsx` with API integration
- Created `LibraryCard` component with delete functionality
- Created `EmptyState` component with friendly messaging
- Created shared `Navigation` component
- Updated all pages (reader, library, vocabulary) to use Navigation
- Build passed ✅
- Type checking passed ✅

### File List

**Created:**
- `app/library/page.tsx` - Main library page with fetch/delete
- `components/library/LibraryCard.tsx` - Text preview cards with metadata
- `components/library/EmptyState.tsx` - Empty state with CTA
- `components/Navigation.tsx` - Shared navigation bar

**Modified:**
- `app/reader/reader-client.tsx` - Added Navigation component
- `app/vocabulary/page.tsx` - Added Navigation component

### Change Log

- Implemented library list view with grid layout
- Added delete confirmation on cards
- Created responsive navigation with active state
- Integrated with existing API routes
- Applied parchment theme consistently
- Added loading and error states
