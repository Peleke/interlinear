# Story 8.2: Flashcard Service Layer

**Epic**: 8 - Flashcard System
**Status**: 🚧 Not Started
**Priority**: P0
**Estimated Effort**: 2 hours
**Dependencies**: Story 8.1 (Database Schema)

---

## User Story

**As a** developer
**I want** a service layer for flashcard operations with modular SRS
**So that** I can easily swap schedulers and maintain clean architecture

---

## Acceptance Criteria

- [ ] FlashcardService with CRUD operations
- [ ] SRS scheduler interface defined
- [ ] Mock scheduler implemented
- [ ] Review recording updates next review date
- [ ] Due cards query optimized
- [ ] Statistics calculations
- [ ] All methods typed with TypeScript
- [ ] Unit tests passing

---

## Technical Specification

### File Structure

```
lib/
├── flashcards/
│   ├── service.ts              # FlashcardService class
│   ├── types.ts                # TypeScript interfaces
│   └── srs/
│       ├── interface.ts        # SRSScheduler interface
│       ├── mock-scheduler.ts   # MockScheduler implementation
│       └── index.ts            # Export active scheduler
```

---

## Implementation

### 1. SRS Scheduler Interface

**File**: `lib/flashcards/srs/interface.ts`

```typescript
export interface SRSScheduler {
  /**
   * Calculate next review date based on user's rating
   * @param card - Current flashcard state
   * @param quality - Review quality (0-5)
   * @returns Updated scheduling data
   */
  calculateNextReview(
    card: FlashcardState,
    quality: ReviewQuality
  ): ScheduleResult
}

export interface FlashcardState {
  nextReviewDate: Date
  intervalDays: number
  repetitions: number
  easeFactor?: number
}

export interface ScheduleResult {
  nextReviewDate: Date
  intervalDays: number
  repetitions: number
  easeFactor?: number
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5

export const REVIEW_QUALITY = {
  AGAIN: 0,       // Complete blackout
  HARD: 1,        // Incorrect, but remembered after seeing answer
  HARD_OK: 2,     // Incorrect, but close
  GOOD: 3,        // Correct with effort
  GOOD_EASY: 4,   // Correct with hesitation
  EASY: 5         // Perfect recall
} as const
```

---

### 2. Mock Scheduler Implementation

**File**: `lib/flashcards/srs/mock-scheduler.ts`

```typescript
import type {
  SRSScheduler,
  FlashcardState,
  ScheduleResult,
  ReviewQuality
} from './interface'

/**
 * Simple mock scheduler for MVP
 * Uses fixed intervals: 1d, 3d, 7d, 14d, 30d
 * Easy to swap for SM-2 later
 */
export class MockScheduler implements SRSScheduler {
  private readonly intervals = {
    0: 1,    // Again -> review tomorrow
    1: 1,    // Hard -> review tomorrow
    2: 3,    // Hard OK -> review in 3 days
    3: 7,    // Good -> review in 7 days
    4: 14,   // Good Easy -> review in 14 days
    5: 30    // Easy -> review in 30 days
  } as const

  calculateNextReview(
    card: FlashcardState,
    quality: ReviewQuality
  ): ScheduleResult {
    const intervalDays = this.intervals[quality]
    const nextReviewDate = this.addDays(new Date(), intervalDays)

    return {
      nextReviewDate,
      intervalDays,
      repetitions: card.repetitions + 1,
      easeFactor: card.easeFactor // Unchanged in mock
    }
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }
}
```

---

### 3. Scheduler Export (Swap Point)

**File**: `lib/flashcards/srs/index.ts`

```typescript
import { MockScheduler } from './mock-scheduler'
import type { SRSScheduler } from './interface'

/**
 * Active SRS scheduler
 * To upgrade to SM-2: import and use SM2Scheduler instead
 */
export const scheduler: SRSScheduler = new MockScheduler()

// Re-export types for convenience
export type {
  SRSScheduler,
  FlashcardState,
  ScheduleResult,
  ReviewQuality
} from './interface'

export { REVIEW_QUALITY } from './interface'
```

---

### 4. Flashcard Service

**File**: `lib/flashcards/service.ts`

```typescript
import { createClient } from '@/lib/supabase/client'
import { scheduler } from './srs'
import type { ReviewQuality } from './srs'
import type {
  Flashcard,
  FlashcardDeck,
  CreateFlashcardInput,
  CreateDeckInput,
  ReviewInput
} from './types'

export class FlashcardService {
  private supabase = createClient()

  // =============================================
  // Deck Operations
  // =============================================

  async createDeck(input: CreateDeckInput): Promise<FlashcardDeck> {
    const { data, error } = await this.supabase
      .from('flashcard_decks')
      .insert({
        name: input.name,
        description: input.description
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getDecks(): Promise<FlashcardDeck[]> {
    const { data, error } = await this.supabase
      .from('flashcard_decks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getDeck(id: string): Promise<FlashcardDeck> {
    const { data, error } = await this.supabase
      .from('flashcard_decks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async updateDeck(
    id: string,
    updates: Partial<CreateDeckInput>
  ): Promise<FlashcardDeck> {
    const { data, error } = await this.supabase
      .from('flashcard_decks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteDeck(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('flashcard_decks')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // =============================================
  // Flashcard Operations
  // =============================================

  async createFlashcard(
    input: CreateFlashcardInput
  ): Promise<Flashcard> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .insert({
        deck_id: input.deckId,
        front: input.front,
        back: input.back,
        notes: input.notes,
        source: input.source,
        source_id: input.sourceId,
        next_review_date: new Date().toISOString() // Due immediately
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getFlashcards(deckId?: string): Promise<Flashcard[]> {
    let query = this.supabase
      .from('flashcards')
      .select('*')
      .order('created_at', { ascending: false })

    if (deckId) {
      query = query.eq('deck_id', deckId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async getFlashcard(id: string): Promise<Flashcard> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async updateFlashcard(
    id: string,
    updates: Partial<CreateFlashcardInput>
  ): Promise<Flashcard> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteFlashcard(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('flashcards')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // =============================================
  // Practice Operations
  // =============================================

  async getDueCards(limit?: number): Promise<Flashcard[]> {
    let query = this.supabase
      .from('flashcards')
      .select('*')
      .lte('next_review_date', new Date().toISOString())
      .order('next_review_date', { ascending: true })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async recordReview(input: ReviewInput): Promise<Flashcard> {
    // 1. Get current card state
    const card = await this.getFlashcard(input.flashcardId)

    // 2. Calculate next review using scheduler
    const schedule = scheduler.calculateNextReview(
      {
        nextReviewDate: new Date(card.next_review_date),
        intervalDays: card.interval_days,
        repetitions: card.repetitions,
        easeFactor: card.ease_factor
      },
      input.quality
    )

    // 3. Update flashcard with new schedule
    const { data: updatedCard, error: updateError } = await this.supabase
      .from('flashcards')
      .update({
        next_review_date: schedule.nextReviewDate.toISOString(),
        interval_days: schedule.intervalDays,
        repetitions: schedule.repetitions,
        ease_factor: schedule.easeFactor,
        updated_at: new Date().toISOString()
      })
      .eq('id', input.flashcardId)
      .select()
      .single()

    if (updateError) throw updateError

    // 4. Record in review history
    const { error: historyError } = await this.supabase
      .from('review_history')
      .insert({
        flashcard_id: input.flashcardId,
        quality: input.quality
      })

    if (historyError) throw historyError

    return updatedCard
  }

  // =============================================
  // Statistics
  // =============================================

  async getStatistics() {
    const { data, error } = await this.supabase.rpc('get_flashcard_stats')

    if (error) throw error

    return {
      totalCards: data?.total_cards || 0,
      dueToday: data?.due_today || 0,
      reviewedToday: data?.reviewed_today || 0,
      averageQuality: data?.avg_quality || 0
    }
  }
}

// Export singleton instance
export const flashcardService = new FlashcardService()
```

---

### 5. TypeScript Types

**File**: `lib/flashcards/types.ts`

```typescript
export interface FlashcardDeck {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Flashcard {
  id: string
  deck_id: string | null
  user_id: string
  front: string
  back: string
  notes: string | null
  source: string | null
  source_id: string | null
  next_review_date: string
  interval_days: number
  repetitions: number
  ease_factor: number | null
  created_at: string
  updated_at: string
}

export interface CreateDeckInput {
  name: string
  description?: string
}

export interface CreateFlashcardInput {
  deckId?: string
  front: string
  back: string
  notes?: string
  source?: 'tutor_session' | 'vocabulary' | 'manual'
  sourceId?: string
}

export interface ReviewInput {
  flashcardId: string
  quality: ReviewQuality
}

export type { ReviewQuality } from './srs'
```

---

## Testing Checklist

### Unit Tests

**File**: `lib/flashcards/__tests__/service.test.ts`

```typescript
describe('FlashcardService', () => {
  describe('Deck Operations', () => {
    it('creates a deck', async () => {})
    it('lists decks', async () => {})
    it('updates a deck', async () => {})
    it('deletes a deck', async () => {})
  })

  describe('Flashcard Operations', () => {
    it('creates a flashcard', async () => {})
    it('lists flashcards', async () => {})
    it('filters by deck', async () => {})
    it('updates a flashcard', async () => {})
    it('deletes a flashcard', async () => {})
  })

  describe('Practice Operations', () => {
    it('gets due cards', async () => {})
    it('records review and updates schedule', async () => {})
    it('stores review in history', async () => {})
  })
})

describe('MockScheduler', () => {
  it('schedules Again quality for 1 day', () => {})
  it('schedules Good quality for 7 days', () => {})
  it('schedules Easy quality for 30 days', () => {})
  it('increments repetitions', () => {})
})
```

---

## Success Criteria

**Story Complete When**:
- ✅ FlashcardService implemented with all CRUD methods
- ✅ SRS scheduler interface defined
- ✅ Mock scheduler working correctly
- ✅ Review recording updates next review date
- ✅ All TypeScript types defined
- ✅ Unit tests passing (>80% coverage)
- ✅ Code reviewed and merged

---

## Related Files

```
lib/flashcards/service.ts              # Main service
lib/flashcards/types.ts                # Type definitions
lib/flashcards/srs/interface.ts        # SRS interface
lib/flashcards/srs/mock-scheduler.ts   # Mock implementation
lib/flashcards/srs/index.ts            # Scheduler export
```

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
**Note**: Modular SRS design allows easy swap to SM-2 later
