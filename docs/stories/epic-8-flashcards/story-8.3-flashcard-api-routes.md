# Story 8.3: Flashcard API Routes

**Epic**: 8 - Flashcard System
**Status**: 🚧 Not Started
**Priority**: P0
**Estimated Effort**: 2 hours
**Dependencies**: Story 8.2 (Flashcard Service)

---

## User Story

**As a** frontend developer
**I want** REST API endpoints for flashcard operations
**So that** I can build the UI without direct database access

---

## Acceptance Criteria

- [ ] POST `/api/flashcards/decks` - Create deck
- [ ] GET `/api/flashcards/decks` - List decks
- [ ] GET `/api/flashcards/decks/[id]` - Get deck
- [ ] PUT `/api/flashcards/decks/[id]` - Update deck
- [ ] DELETE `/api/flashcards/decks/[id]` - Delete deck
- [ ] POST `/api/flashcards` - Create flashcard
- [ ] GET `/api/flashcards` - List flashcards (with deck filter)
- [ ] GET `/api/flashcards/[id]` - Get flashcard
- [ ] PUT `/api/flashcards/[id]` - Update flashcard
- [ ] DELETE `/api/flashcards/[id]` - Delete flashcard
- [ ] GET `/api/flashcards/due` - Get due cards
- [ ] POST `/api/flashcards/[id]/review` - Record review
- [ ] GET `/api/flashcards/stats` - Get statistics
- [ ] All endpoints return consistent error format
- [ ] Rate limiting applied (10 req/min)

---

## API Specification

### Deck Routes

**POST `/api/flashcards/decks`**
```typescript
Request: { name: string, description?: string }
Response: { deck: FlashcardDeck }
```

**GET `/api/flashcards/decks`**
```typescript
Response: { decks: FlashcardDeck[] }
```

**GET `/api/flashcards/decks/[id]`**
```typescript
Response: { deck: FlashcardDeck }
```

**PUT `/api/flashcards/decks/[id]`**
```typescript
Request: { name?: string, description?: string }
Response: { deck: FlashcardDeck }
```

**DELETE `/api/flashcards/decks/[id]`**
```typescript
Response: { success: true }
```

### Flashcard Routes

**POST `/api/flashcards`**
```typescript
Request: CreateFlashcardInput
Response: { flashcard: Flashcard }
```

**GET `/api/flashcards?deckId=uuid`**
```typescript
Response: { flashcards: Flashcard[] }
```

**GET `/api/flashcards/due?limit=20`**
```typescript
Response: { flashcards: Flashcard[], count: number }
```

**POST `/api/flashcards/[id]/review`**
```typescript
Request: { quality: 0-5 }
Response: { flashcard: Flashcard }
```

**GET `/api/flashcards/stats`**
```typescript
Response: {
  totalCards: number
  dueToday: number
  reviewedToday: number
  averageQuality: number
}
```

---

## Implementation

### File Structure
```
app/api/flashcards/
├── decks/
│   ├── route.ts              # GET, POST
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE
├── due/
│   └── route.ts              # GET
├── stats/
│   └── route.ts              # GET
├── [id]/
│   ├── route.ts              # GET, PUT, DELETE
│   └── review/
│       └── route.ts          # POST
└── route.ts                  # GET, POST
```

### Example Implementation

**File**: `app/api/flashcards/decks/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { flashcardService } from '@/lib/flashcards/service'

export async function GET() {
  try {
    const decks = await flashcardService.getDecks()
    return NextResponse.json({ decks })
  } catch (error) {
    console.error('Failed to fetch decks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch decks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const deck = await flashcardService.createDeck(body)
    return NextResponse.json({ deck }, { status: 201 })
  } catch (error) {
    console.error('Failed to create deck:', error)
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 }
    )
  }
}
```

**File**: `app/api/flashcards/[id]/review/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { flashcardService } from '@/lib/flashcards/service'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { quality } = await request.json()

    if (typeof quality !== 'number' || quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: 'Quality must be between 0 and 5' },
        { status: 400 }
      )
    }

    const flashcard = await flashcardService.recordReview({
      flashcardId: params.id,
      quality
    })

    return NextResponse.json({ flashcard })
  } catch (error) {
    console.error('Failed to record review:', error)
    return NextResponse.json(
      { error: 'Failed to record review' },
      { status: 500 }
    )
  }
}
```

---

## Testing Checklist

### Integration Tests

```typescript
describe('Flashcard API', () => {
  describe('POST /api/flashcards/decks', () => {
    it('creates a deck', async () => {})
    it('validates name', async () => {})
  })

  describe('GET /api/flashcards/due', () => {
    it('returns due cards', async () => {})
    it('respects limit parameter', async () => {})
  })

  describe('POST /api/flashcards/[id]/review', () => {
    it('records review', async () => {})
    it('updates next review date', async () => {})
    it('validates quality range', async () => {})
  })
})
```

---

## Success Criteria

**Story Complete When**:
- ✅ All API routes implemented
- ✅ Input validation working
- ✅ Error handling consistent
- ✅ Integration tests passing
- ✅ Manual testing with Postman/curl
- ✅ Code reviewed and merged

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
