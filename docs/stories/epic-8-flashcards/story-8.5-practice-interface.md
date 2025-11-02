# Story 8.5: Practice Interface

**Epic**: 8 - Flashcard System
**Status**: 🚧 Not Started
**Priority**: P0
**Estimated Effort**: 3 hours
**Dependencies**: Story 8.3 (Flashcard API Routes)

---

## User Story

**As a** language learner
**I want** to practice flashcards with flip animation and quality ratings
**So that** I can review my vocabulary using spaced repetition

---

## Acceptance Criteria

- [ ] Practice page shows one card at a time
- [ ] Click to flip front → back
- [ ] Rate buttons: Again (0), Hard (1-2), Good (3-4), Easy (5)
- [ ] Progress indicator (3 of 10 cards)
- [ ] Completion summary at end
- [ ] Smooth flip animation
- [ ] Keyboard shortcuts (Space=flip, 1-4=rate)
- [ ] Mobile swipe gestures optional
- [ ] Works with empty deck gracefully

---

## Page Structure

```
/flashcards/[deckId]/practice
├── Progress (3 / 10 cards)
├── Card Display
│   ├── [Front shown initially]
│   ├── Click to flip
│   └── [Back after flip]
├── Rating Buttons (hidden until flip)
│   ├── Again (1 day)
│   ├── Hard (3 days)
│   ├── Good (7 days)
│   └── Easy (30 days)
└── Completion Screen
    ├── Cards reviewed: 10
    ├── Average quality: 3.5
    └── Back to Deck button
```

---

## Implementation

**File**: `app/flashcards/[deckId]/practice/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { FlashCard } from '@/components/flashcards/FlashCard'
import { RatingButtons } from '@/components/flashcards/RatingButtons'
import { CompletionSummary } from '@/components/flashcards/CompletionSummary'

export default function PracticePage({ params }) {
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    fetchDueCards()
  }, [])

  const fetchDueCards = async () => {
    const res = await fetch(`/api/flashcards?deckId=${params.deckId}&due=true`)
    const data = await res.json()
    setCards(data.flashcards)

    if (data.flashcards.length === 0) {
      setCompleted(true)
    }
  }

  const handleRate = async (quality: number) => {
    const card = cards[currentIndex]

    await fetch(`/api/flashcards/${card.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quality })
    })

    // Move to next card
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1)
      setFlipped(false)
    } else {
      setCompleted(true)
    }
  }

  if (completed) {
    return <CompletionSummary cardsReviewed={cards.length} />
  }

  const card = cards[currentIndex]

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-4 text-center text-sm text-gray-600">
        {currentIndex + 1} / {cards.length} cards
      </div>

      <FlashCard
        front={card.front}
        back={card.back}
        flipped={flipped}
        onFlip={() => setFlipped(!flipped)}
      />

      {flipped && (
        <RatingButtons onRate={handleRate} />
      )}
    </div>
  )
}
```

**File**: `components/flashcards/FlashCard.tsx`

```typescript
export function FlashCard({ front, back, flipped, onFlip }) {
  return (
    <div className="perspective-1000 mb-6">
      <div
        className={`relative w-full h-96 cursor-pointer transition-transform duration-500 transform-style-3d ${
          flipped ? 'rotate-y-180' : ''
        }`}
        onClick={onFlip}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-white rounded-lg shadow-lg p-8 flex items-center justify-center">
          <p className="text-2xl text-center">{front}</p>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden bg-blue-50 rounded-lg shadow-lg p-8 flex items-center justify-center rotate-y-180">
          <p className="text-2xl text-center">{back}</p>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-2">
        Click to flip
      </p>
    </div>
  )
}
```

---

## Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault()
      setFlipped(!flipped)
    }

    if (flipped) {
      if (e.key === '1') handleRate(0)  // Again
      if (e.key === '2') handleRate(2)  // Hard
      if (e.key === '3') handleRate(4)  // Good
      if (e.key === '4') handleRate(5)  // Easy
    }
  }

  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [flipped])
```

---

## Success Criteria

**Story Complete When**:
- ✅ Can practice cards with flip animation
- ✅ Rating updates next review date
- ✅ Progress indicator works
- ✅ Completion summary displays
- ✅ Keyboard shortcuts work
- ✅ Mobile responsive
- ✅ Code reviewed and merged

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
