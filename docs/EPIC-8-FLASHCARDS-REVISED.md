# Epic 8: Flashcard System with Multiple Card Types

**Date**: 2025-10-31 (Revised)
**Status**: Ready to Implement
**Total Estimated Time**: 14 hours (updated from 12 hours)

---

## 📋 Overview

Implement Anki-style flashcard system with multiple card types and mock SRS scheduler.

### Supported Card Types

1. **Basic** - Simple front/back (e.g., "Hola" → "Hello")
2. **Basic (Reversed)** - Generates TWO cards automatically (Front→Back AND Back→Front)
3. **Basic (with Text)** - Front/Back with additional context/example text
4. **Cloze Deletion** ⭐ **MOST IMPORTANT** - Fill-in-the-blank style with multiple deletions

---

## 🎴 Card Type Specifications

### 1. Basic Card
```typescript
{
  type: 'basic',
  front: 'perro',
  back: 'dog',
  notes: 'Common noun, masculine'
}
```
**Generates**: 1 card

---

### 2. Basic (Reversed) Card
```typescript
{
  type: 'basic_reversed',
  front: 'perro',
  back: 'dog',
  notes: 'Common noun, masculine'
}
```
**Generates**: 2 cards automatically
- Card 1: "perro" → "dog"
- Card 2: "dog" → "perro"

---

### 3. Basic (with Text) Card
```typescript
{
  type: 'basic_with_text',
  front: 'el perro',
  back: 'the dog',
  extra: 'El perro corre en el parque. / The dog runs in the park.',
  notes: 'Article + noun example'
}
```
**Generates**: 1 card with context shown below answer

---

### 4. Cloze Deletion Card ⭐ **MOST IMPORTANT**
```typescript
{
  type: 'cloze',
  text: 'El {{c1::perro}} corre en el {{c2::parque}}.',
  extra: 'The dog runs in the park.',
  notes: 'Basic sentence structure'
}
```

**Cloze Syntax**:
- `{{c1::word}}` - Basic cloze deletion (word hidden, show as `[...]`)
- `{{c1::word::hint}}` - Cloze with hint (show as `[hint]`)
- Multiple deletions in same card: `{{c1::first}} {{c2::second}}`

**Generates**: 2 cards automatically
- Card 1: "El `[...]` corre en el parque." → "perro"
- Card 2: "El perro corre en el `[...]`." → "parque"

**Practice Flow**:
1. Show: "El `[...]` corre en el parque."
2. User thinks/types answer
3. Reveal: "El **perro** corre en el parque."
4. Show extra text: "The dog runs in the park."

---

## 🗄️ Database Schema (Updated)

### Story 8.1: Database Schema & Migrations (1.5 hours)

```sql
-- flashcard_decks (unchanged)
CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- flashcards (UPDATED)
CREATE TABLE flashcards (
  id UUID PRIMARY KEY,
  deck_id UUID REFERENCES flashcard_decks(id),

  -- Card type
  card_type TEXT NOT NULL CHECK (card_type IN ('basic', 'basic_reversed', 'basic_with_text', 'cloze')),

  -- Basic fields (used by basic, basic_reversed, basic_with_text)
  front TEXT,
  back TEXT,

  -- Cloze fields (used by cloze type)
  cloze_text TEXT, -- "El {{c1::perro}} corre en el {{c2::parque}}."

  -- Shared fields
  extra TEXT, -- Additional context/example text
  notes TEXT, -- User notes

  -- Source tracking
  source TEXT,
  source_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_basic_card CHECK (
    card_type IN ('basic', 'basic_reversed', 'basic_with_text')
    AND front IS NOT NULL
    AND back IS NOT NULL
    OR card_type = 'cloze'
  ),
  CONSTRAINT valid_cloze_card CHECK (
    card_type = 'cloze'
    AND cloze_text IS NOT NULL
    OR card_type != 'cloze'
  )
);

-- card_reviews (UPDATED)
CREATE TABLE card_reviews (
  id UUID PRIMARY KEY,
  card_id UUID REFERENCES flashcards(id),
  user_id UUID REFERENCES auth.users(id),

  -- For reversed/cloze cards, track which variation was shown
  card_index INTEGER DEFAULT 0, -- 0 for basic, 0/1 for reversed, 0-n for cloze

  quality INTEGER NOT NULL CHECK (quality >= 0 AND quality <= 3),
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review_date TIMESTAMPTZ NOT NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_flashcards_card_type ON flashcards(card_type);
CREATE INDEX idx_card_reviews_card_index ON card_reviews(card_id, card_index);
```

---

## 🔧 Story 8.2: Flashcard Service Layer (2.5 hours)

**File**: `lib/services/flashcards.ts`

### TypeScript Types

```typescript
// Card types
export type CardType = 'basic' | 'basic_reversed' | 'basic_with_text' | 'cloze'

export interface BaseFlashcard {
  id: string
  deck_id: string
  card_type: CardType
  extra?: string
  notes?: string
  source?: string
  source_id?: string
  created_at: string
  updated_at: string
}

export interface BasicFlashcard extends BaseFlashcard {
  card_type: 'basic' | 'basic_reversed' | 'basic_with_text'
  front: string
  back: string
}

export interface ClozeFlashcard extends BaseFlashcard {
  card_type: 'cloze'
  cloze_text: string
}

export type Flashcard = BasicFlashcard | ClozeFlashcard

// Practice card (what user actually sees during review)
export interface PracticeCard {
  card_id: string
  card_index: number // Which variation (for reversed/cloze)
  prompt: string // What to show user
  answer: string // Correct answer
  full_content: string // Full content after reveal
  extra?: string
  notes?: string
}
```

### Key Functions

```typescript
class FlashcardService {
  // Parse cloze text into practice cards
  static parseClozeCard(cloze_text: string): PracticeCard[] {
    // "El {{c1::perro}} corre en el {{c2::parque}}."
    // → [
    //     { prompt: "El [...] corre en el parque.", answer: "perro", ... },
    //     { prompt: "El perro corre en el [...].", answer: "parque", ... }
    //   ]
  }

  // Render cloze text with deletions
  static renderCloze(text: string, hideIndices: number[]): string {
    // renderCloze("El {{c1::perro}} corre", [1])
    // → "El [...] corre"
  }

  // Get due cards (handles reversed/cloze variations)
  static async getDueCards(userId: string, deckId?: string): Promise<PracticeCard[]>

  // Record review (tracks card_index for variations)
  static async recordReview(cardId: string, cardIndex: number, quality: number)
}
```

---

## 🌐 Story 8.3: Flashcard API Routes (2 hours)

### New Endpoints

```typescript
// POST /api/flashcards - Create card (any type)
{
  deck_id: string,
  card_type: 'basic' | 'basic_reversed' | 'basic_with_text' | 'cloze',
  // Type-specific fields...
}

// GET /api/flashcards/practice/[deckId] - Get due cards for practice
// Returns PracticeCard[] with proper variations

// POST /api/flashcards/review - Record review
{
  card_id: string,
  card_index: number, // Which variation was reviewed
  quality: 0 | 1 | 2 | 3
}
```

---

## 🎨 Story 8.4: Deck Management UI (3.5 hours)

**Page**: `app/flashcards/page.tsx`

### Card Creation Forms

**Card Type Selector** (tabs):
- Basic
- Basic (Reversed)
- Basic (with Text)
- Cloze ⭐

**Basic Card Form**:
```
Front: [input]
Back: [input]
Notes: [textarea]
```

**Basic (Reversed) Card Form**:
```
Front: [input]
Back: [input]
Notes: [textarea]
[Info] This will create 2 cards (front→back and back→front)
```

**Basic (with Text) Form**:
```
Front: [input]
Back: [input]
Context: [textarea]
Notes: [textarea]
```

**Cloze Card Form** ⭐:
```
Text: [textarea with helper]
  El {{c1::perro}} corre en el {{c2::parque}}.

[Helper buttons]:
- Wrap selection as {{c1::}}
- Add hint: {{c1::word::hint}}
- Preview card

Context (optional): [textarea]
Notes: [textarea]

[Preview]:
Card 1: El [...] corre en el parque. → perro
Card 2: El perro corre en el [...]. → parque
```

---

## 🎯 Story 8.5: Practice Interface (3.5 hours)

**Page**: `app/flashcards/practice/[deckId]/page.tsx`

### Practice Flow

**Question State**:
```
┌────────────────────────────────┐
│ Card 5/20                      │
│                                │
│ El [...] corre en el parque.   │
│                                │
│ [Show Answer]                  │
└────────────────────────────────┘
```

**Answer Revealed State**:
```
┌────────────────────────────────┐
│ Card 5/20                      │
│                                │
│ El perro corre en el parque.   │
│     ^^^^^ (highlighted)        │
│                                │
│ Context: The dog runs...       │
│                                │
│ How well did you know this?    │
│ [Again] [Hard] [Good] [Easy]   │
└────────────────────────────────┘
```

### Rendering Logic

```typescript
// Cloze rendering
function renderClozeCard(card: PracticeCard, revealed: boolean) {
  if (!revealed) {
    return card.prompt // "El [...] corre"
  } else {
    return card.full_content // "El perro corre" with highlighting
  }
}

// Highlight answer in full content
function highlightAnswer(fullContent: string, answer: string) {
  // "El perro corre" + "perro"
  // → "El <mark>perro</mark> corre"
}
```

---

## 🔗 Story 8.6: Tutor Integration (1 hour)

**Goal**: Create flashcards from tutor errors

### Implementation

**Location**: `MessageCorrection` component dropdown

**Button**: "Save as Flashcard"

**Auto-detect card type**:
```typescript
function createFlashcardFromError(error: TutorError) {
  // Option 1: Basic card
  return {
    type: 'basic',
    front: error.errorText,
    back: error.correction,
    notes: error.explanation
  }

  // Option 2: Cloze card (BETTER for context)
  // "Yo como mucho" → error in "como"
  return {
    type: 'cloze',
    cloze_text: replaceWithCloze(userMessage, error.errorText, error.correction),
    // → "Yo {{c1::como::should be 'como'}} mucho"
    extra: error.explanation
  }
}
```

**Modal**:
```
Create Flashcard from Error

Type: [Basic ▼] [Cloze]

Preview:
Front: "como" (your error)
Back: "como" (correct)

or

Preview:
Yo [...] mucho → como

Deck: [Tutor Corrections ▼]

[Cancel] [Save]
```

---

## 🎯 Implementation Order

### Day 1 (4 hours)
1. ✅ Story 8.1: Database Schema (1.5 hrs)
   - Create migration
   - Test constraints
   - Verify RLS policies

2. ✅ Story 8.2: Flashcard Service (2.5 hrs)
   - Implement cloze parser
   - Test with real examples
   - Mock SRS scheduler

### Day 2 (5 hours)
3. ✅ Story 8.3: API Routes (2 hrs)
   - Test all card types
   - Verify practice card generation

4. ✅ Story 8.4: Deck Management UI - Start (3 hrs)
   - Basic UI
   - Cloze editor with preview

### Day 3 (5 hours)
5. ✅ Story 8.4: Deck Management UI - Finish (1 hr)
   - Polish & test all card types

6. ✅ Story 8.5: Practice Interface (3.5 hrs)
   - Card flip animation
   - Cloze rendering
   - Rating buttons

7. ✅ Story 8.6: Tutor Integration (1 hr)
   - Save from error corrections
   - Auto-select card type

---

## 🧪 Testing Checklist

### Cloze Cards (Priority)
- ✅ Parse: `{{c1::word}}` → single deletion
- ✅ Parse: `{{c1::word::hint}}` → with hint
- ✅ Parse: Multiple deletions in one card
- ✅ Render: Hide correct deletion
- ✅ Render: Highlight answer on reveal
- ✅ Practice: Separate reviews for each deletion

### Basic Cards
- ✅ Create basic card
- ✅ Create reversed card (generates 2 reviews)
- ✅ Create with text (shows context)
- ✅ Practice all types

### Integration
- ✅ Create card from tutor error
- ✅ Practice tutor-generated cards
- ✅ SRS intervals work correctly

---

## 💡 Why Cloze Cards Are Most Important

**Example: Learning from Tutor Error**

User says: "Yo **está** feliz"
Tutor corrects: "Yo **estoy** feliz"

**Option 1: Basic Card** (Less effective)
```
Front: está
Back: estoy
```
❌ No context, hard to remember

**Option 2: Cloze Card** (Much better)
```
Yo {{c1::estoy::está was wrong}} feliz
```
✅ Contextual learning
✅ Tests grammar in sentence
✅ Shows exact mistake

---

## 📊 Success Criteria

**Epic 8 Complete When**:
- ✅ All 4 card types work
- ✅ Cloze parser handles multiple deletions
- ✅ Practice interface shows correct variations
- ✅ SRS tracks each variation separately (reversed/cloze)
- ✅ Tutor errors → cloze cards
- ✅ Database migrations applied
- ✅ All API routes tested

---

**Ready to implement with proper card type support!** 🚀

The key insight: **Cloze cards are the most powerful tool for language learning** because they maintain context while testing specific knowledge.
