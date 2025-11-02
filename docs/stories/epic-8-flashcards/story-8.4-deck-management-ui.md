# Story 8.4: Deck Management UI

**Epic**: 8 - Flashcard System
**Status**: 🚧 Not Started
**Priority**: P0
**Estimated Effort**: 3 hours
**Dependencies**: Story 8.3 (Flashcard API Routes)

---

## User Story

**As a** language learner
**I want** to create and organize flashcards into decks
**So that** I can manage my learning materials effectively

---

## Acceptance Criteria

- [ ] `/flashcards` page lists all decks
- [ ] Can create new deck with modal
- [ ] Can edit deck name/description
- [ ] Can delete deck (with confirmation)
- [ ] Can view cards in a deck
- [ ] Can add new card to deck
- [ ] Can edit/delete individual cards
- [ ] Shows statistics (total cards, due today)
- [ ] Mobile responsive layout
- [ ] Empty states with helpful messages

---

## Page Structure

```
/flashcards
├── Deck List (grid of cards)
├── Create Deck Button
└── For each deck:
    ├── Deck name + description
    ├── Card count (10 cards, 3 due)
    ├── "Practice" button
    ├── "View Cards" button
    └── Edit/Delete menu

/flashcards/[deckId]
├── Deck header (name, description, stats)
├── Add Card Button
└── Card List (table)
    ├── Front
    ├── Back
    ├── Next review
    └── Actions (Edit, Delete)
```

---

## Implementation

### Components

**File**: `app/flashcards/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { DeckCard } from '@/components/flashcards/DeckCard'
import { CreateDeckModal } from '@/components/flashcards/CreateDeckModal'
import { Button } from '@/components/ui/button'

export default function FlashcardsPage() {
  const [decks, setDecks] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchDecks()
  }, [])

  const fetchDecks = async () => {
    const res = await fetch('/api/flashcards/decks')
    const data = await res.json()
    setDecks(data.decks)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Flashcard Decks</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map(deck => (
            <DeckCard key={deck.id} deck={deck} onUpdate={fetchDecks} />
          ))}
        </div>
      )}

      <CreateDeckModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchDecks}
      />
    </div>
  )
}
```

**File**: `components/flashcards/DeckCard.tsx`

```typescript
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreVertical, Play, Eye } from 'lucide-react'
import Link from 'next/link'

export function DeckCard({ deck, onUpdate }) {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{deck.name}</h3>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {deck.description && (
        <p className="text-sm text-gray-600 mb-4">{deck.description}</p>
      )}

      <div className="flex gap-2 text-sm text-gray-500 mb-4">
        <span>10 cards</span>
        <span>•</span>
        <span className="text-orange-600">3 due</span>
      </div>

      <div className="flex gap-2">
        <Button variant="default" size="sm" className="flex-1">
          <Play className="mr-2 h-4 w-4" />
          Practice
        </Button>
        <Link href={`/flashcards/${deck.id}`}>
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
        </Link>
      </div>
    </Card>
  )
}
```

---

## Success Criteria

**Story Complete When**:
- ✅ Can create, edit, delete decks
- ✅ Can add, edit, delete cards
- ✅ Statistics display correctly
- ✅ Mobile responsive
- ✅ Empty states helpful
- ✅ All CRUD operations working
- ✅ Code reviewed and merged

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
