# Epic 8: Flashcard System (Baseline)

**Status**: 🚧 Not Started
**Priority**: P0 (CRITICAL PATH)
**Estimated Effort**: 12 hours (reduced from 15 with mock SRS)
**Dependencies**: None (can start immediately)

---

## Vision

Build a minimal viable flashcard system with CRUD operations and modular SRS scheduling. Focus on core functionality with mock scheduler that can be easily swapped for full SM-2 implementation later.

---

## User Value

**As a** language learner
**I want to** save vocabulary and errors as flashcards and practice them regularly
**So that** I reinforce my learning through spaced repetition

---

## Success Metrics

- ✅ Can create, read, update, delete flashcards
- ✅ Can organize flashcards into decks
- ✅ Can practice flashcards with due dates
- ✅ Can save tutor corrections as flashcards
- ✅ Basic review algorithm (mock SRS initially)
- ✅ Statistics track progress

---

## Stories

### Story 8.1: Database Schema & Migrations
**Priority**: P0
**Effort**: 1 hour
**Status**: 🚧 Not Started

Create tables for flashcards, decks, and review history.

### Story 8.2: Flashcard Service Layer
**Priority**: P0
**Effort**: 2 hours
**Status**: 🚧 Not Started

Service layer with CRUD operations and modular SRS interface.

### Story 8.3: Flashcard API Routes
**Priority**: P0
**Effort**: 2 hours
**Status**: 🚧 Not Started

REST API endpoints for flashcard operations.

### Story 8.4: Deck Management UI
**Priority**: P0
**Effort**: 3 hours
**Status**: 🚧 Not Started

UI for creating/editing decks and viewing cards.

### Story 8.5: Practice Interface
**Priority**: P0
**Effort**: 3 hours
**Status**: 🚧 Not Started

Flashcard practice UI with flip animation and review recording.

### Story 8.6: Tutor Integration
**Priority**: P1
**Effort**: 1 hour
**Status**: 🚧 Not Started

"Save as Flashcard" button in tutor error corrections.

---

## Technical Architecture

### Modular SRS Design

**Key Decision**: Mock scheduler initially, easy swap later

```typescript
// lib/srs/interface.ts
export interface SRSScheduler {
  calculateNextReview(
    card: Flashcard,
    quality: ReviewQuality
  ): ScheduleResult
}

export interface ScheduleResult {
  nextReviewDate: Date
  interval: number
  easeFactor?: number
  repetitions?: number
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5

// lib/srs/mock-scheduler.ts
export class MockScheduler implements SRSScheduler {
  calculateNextReview(card, quality) {
    // Simple mock: 1 day, 3 days, 7 days, 14 days
    const intervals = [1, 1, 3, 7, 14, 30]
    const nextInterval = intervals[quality] || 1

    return {
      nextReviewDate: addDays(new Date(), nextInterval),
      interval: nextInterval
    }
  }
}

// lib/srs/sm2-scheduler.ts (future)
export class SM2Scheduler implements SRSScheduler {
  calculateNextReview(card, quality) {
    // Full SM-2 algorithm implementation
  }
}

// lib/srs/index.ts
import { MockScheduler } from './mock-scheduler'
export const scheduler: SRSScheduler = new MockScheduler()

// To swap: just change the import
// export const scheduler: SRSScheduler = new SM2Scheduler()
```

### Flow Diagram
```
User creates flashcard
    ↓
Stored in database with nextReviewDate = NOW
    ↓
User opens practice
    ↓
Query: WHERE nextReviewDate <= NOW
    ↓
Show card → User rates quality (0-5)
    ↓
scheduler.calculateNextReview(card, quality)
    ↓
Update card with new nextReviewDate
    ↓
Store review in history
```

---

## Database Schema

### Tables

```sql
-- Flashcard decks
CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES flashcard_decks ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,

  -- Card content
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  notes TEXT,

  -- Source tracking
  source TEXT, -- 'tutor_session', 'vocabulary', 'manual'
  source_id UUID,

  -- SRS fields (minimal for mock)
  next_review_date TIMESTAMPTZ DEFAULT NOW(),
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,

  -- Optional: For future SM-2
  ease_factor DECIMAL DEFAULT 2.5,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review history
CREATE TABLE review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id UUID REFERENCES flashcards ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  quality INTEGER NOT NULL, -- 0-5 rating
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX idx_flashcards_next_review ON flashcards(next_review_date);
CREATE INDEX idx_flashcard_decks_user_id ON flashcard_decks(user_id);
CREATE INDEX idx_review_history_flashcard_id ON review_history(flashcard_id);

-- RLS policies (standard user isolation)
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;
```

---

## Cost Impact

### Storage
- Average flashcard: ~200 bytes
- 1000 cards per user: 200KB
- 100 users: 20MB
- **Negligible**

### API Costs
- No LLM calls for flashcard CRUD
- **$0 additional**

### Performance
- Query for due cards: indexed, <10ms
- Practice session: local state, no API calls
- **No performance concerns**

---

## Dependencies

### Must Complete First
- None (self-contained)

### Nice to Have
- Epic 7.5 (Tutor corrections) for integration
- Can work in parallel

---

## Testing Strategy

### Unit Tests
- SRS scheduler interface
- Flashcard service CRUD operations
- Review quality calculations
- Due card queries

### Integration Tests
- API routes return correct data
- Database operations with RLS
- Flashcard creation from tutor errors
- Review recording updates next date

### E2E Tests
- Create deck → Add cards → Practice → Review
- Tutor error → Save flashcard → Find in deck
- Practice session with multiple cards
- Statistics update correctly

---

## Timeline

**Day 1**: Stories 8.1 + 8.2 (Database + Service Layer)
**Day 2**: Story 8.3 + 8.4 (API Routes + Deck UI)
**Day 3**: Story 8.5 + 8.6 (Practice + Tutor Integration)

**Total**: 3 days (12 hours with mock SRS)

---

## Future Enhancements (Not in MVP)

- Full SM-2 algorithm (swap scheduler)
- Image support on flashcards
- Audio pronunciation on flip
- Import/export decks (Anki format)
- Shared decks (community)
- Gamification (streaks, XP)
- Mobile app (React Native)

---

## Rollback Plan

If flashcards cause issues:
1. Feature flag to disable flashcard creation
2. Keep data in database (don't delete tables)
3. Investigate offline without blocking other features
4. Can roll back UI but preserve data

---

## Related Documents

- `docs/TUTOR-MODE-IMPROVEMENTS.md` - Integration context
- `docs/EPIC-PLANNING-NEXT.md` - Roadmap
- `docs/prd/epic-8-flashcards-srs.md` - Detailed PRD

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
**Note**: Mock SRS scheduler for MVP, modular design for easy upgrade
