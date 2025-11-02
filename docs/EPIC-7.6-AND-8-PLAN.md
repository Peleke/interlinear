# Epic 7.6 & 8 Implementation Plan

**Date**: 2025-10-31
**Status**: Ready to Implement
**Total Estimated Time**: 16 hours (4 hrs Epic 7.6 + 12 hrs Epic 8)

---

## 📋 Overview

Complete the tutor experience with post-conversation review and audio, then implement the flashcard system with SRS scheduling.

---

## 🎯 Epic 7.6: Tutor Polish & Audio (4 hours)

### Story 7.6.1: Professor Review Panel (2 hours)
**Goal**: Comprehensive, encouraging post-conversation review

**Features**:
- Overall performance rating (Excelente/Muy Bien/Bien/Necesita Práctica)
- Encouraging summary paragraph (POSITIVE TONE)
- 2-3 specific strengths
- 1-2 areas for improvement (constructive)
- Scrollable error list with corrections
- Error breakdown by category (Grammar/Vocabulary/Syntax)
- Displays BEFORE ErrorPlayback transcript

**Files to Create**:
- `components/tutor/ProfessorReview.tsx`
- Add `generateProfessorReviewTool` to `lib/tutor-tools.ts`

**Note**: Fix ProfessorOverview Spanish headings while implementing:
- "Summary" → "Resumen"
- "Grammar Concepts" → "Conceptos Gramaticales"
- etc.

---

### Story 7.6.2: ElevenLabs Audio for AI Messages (2 hours)
**Goal**: Hear AI tutor messages with proper Spanish pronunciation

**Features**:
- Speaker icon button on each AI message
- Click to generate and play audio
- Loading state during generation
- Play/pause controls
- Audio caching (no regeneration on replay)
- Spanish voice with natural accent
- Visual feedback (pulsing icon) while playing

**Files to Create**:
- `app/api/tutor/audio/route.ts`
- `components/tutor/AudioButton.tsx`

**Setup Required**:
- ElevenLabs account + API key
- Add to `.env.local`:
  ```
  ELEVENLABS_API_KEY=your_key_here
  ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
  ```

**Cost**: ~$5/month per active user (or free tier for light usage)

---

## 🎴 Epic 8: Flashcard System (12 hours)

### Overview
Implement flashcard system with mock SRS scheduler (easy to upgrade to SM-2 later).

### Story 8.1: Database Schema & Migrations (1 hour)
**Tables**:
- `flashcard_decks` (user_id, name, description)
- `flashcards` (deck_id, front, back, notes, source, source_id)
- `card_reviews` (card_id, quality, interval, next_review_date)

**RLS Policies**: User can only access their own decks/cards

---

### Story 8.2: Flashcard Service Layer (2 hours)
**File**: `lib/services/flashcards.ts`

**Features**:
- Create/read/update/delete decks
- Create/read/update/delete cards
- Get due cards for review
- Record review (update intervals)
- Mock SRS scheduler:
  ```typescript
  // Simple fixed intervals
  Again: 1 day
  Hard: 3 days
  Good: 7 days
  Easy: 30 days
  ```

**Easy Swap Later**:
```typescript
// lib/flashcards/srs/index.ts
export const scheduler: SRSScheduler = new MockScheduler()

// To upgrade:
export const scheduler: SRSScheduler = new SM2Scheduler()
```

---

### Story 8.3: Flashcard API Routes (2 hours)
**Routes**:
- `POST /api/flashcards/decks` - Create deck
- `GET /api/flashcards/decks` - List user's decks
- `POST /api/flashcards` - Create card
- `GET /api/flashcards/deck/[id]` - Get cards in deck
- `GET /api/flashcards/due` - Get due cards
- `POST /api/flashcards/review` - Record review

**Rate Limiting**: 100 requests/min per user

---

### Story 8.4: Deck Management UI (3 hours)
**Page**: `app/flashcards/page.tsx`

**Features**:
- List all decks with card counts
- Create new deck (modal)
- Edit/delete deck
- View deck details
- Add cards manually
- Due card count badges

---

### Story 8.5: Practice Interface (3 hours)
**Page**: `app/flashcards/practice/[deckId]/page.tsx`

**Features**:
- Card flip animation (front → back)
- Quality rating buttons (Again/Hard/Good/Easy)
- Progress indicator (5/20 cards)
- Next review date shown
- Session complete message
- "Continue" or "Review Another Deck"

---

### Story 8.6: Tutor Integration (1 hour)
**Goal**: Create flashcards from tutor errors

**Features**:
- "Save as Flashcard" button in MessageCorrection dropdown
- Select target deck
- Auto-populate:
  - Front: Error text
  - Back: Correction
  - Notes: Explanation + category
- Toast confirmation

---

## 📝 Future Enhancements (ENHANCEMENTS.md)

### Word Definition Flashcards (Part of Epic 8)
**Location**: Reader mode word definition popup

**Features**:
1. "Generate Example" button
   - LLM generates contextual example sentence
   - Shows Spanish + English translation

2. Audio button for example
   - ElevenLabs Spanish voice
   - Proper pronunciation

3. "Send to Deck" button
   - Opens modal to select deck
   - Creates flashcard:
     - Front: Spanish word
     - Back: Definition + example + audio
     - Tags: Source text, deck name

**API Endpoints Needed**:
- `POST /api/vocabulary/generate-example`
- `POST /api/vocabulary/audio`
- `POST /api/flashcards/create-from-word`

---

### Conversation Persistence
**Priority**: High (after Epic 8)

**Goal**: Store full conversation transcripts for later review

**Implementation**:
```sql
-- Option 1: Add to tutor_sessions
ALTER TABLE tutor_sessions ADD COLUMN transcript JSONB;

-- Option 2: Separate table (better)
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES tutor_sessions(id),
  turn_number INT,
  role TEXT CHECK (role IN ('ai', 'user')),
  content TEXT,
  correction JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features**:
- Save messages as they're sent (not just at end)
- "Conversation History" page
- Filter by date, text, level, error count
- Replay with corrections visible
- Export as PDF/text

---

### Tutor Correction → Flashcard
**Priority**: High (after Epic 8)

**Goal**: Add "Save to Flashcard" button in MessageCorrection component

**Location**: Real-time correction dropdown during conversation

**Implementation**:
- Button in expanded correction view
- Select deck from modal
- Create flashcard with correction data
- Show toast: "Flashcard saved!"
- Consider bulk save: "Save all from this session"

---

## 🚀 Implementation Flow

### Today (Epic 7.6 - 4 hours):
1. ✅ Story 7.6.1: Professor Review (2 hrs)
2. ✅ Story 7.6.2: ElevenLabs Audio (2 hrs)
3. 🎉 Take a break!

### Tomorrow (Epic 8 - 12 hours):
1. ✅ Story 8.1: Database Schema (1 hr)
2. ✅ Story 8.2: Flashcard Service (2 hrs)
3. ✅ Story 8.3: API Routes (2 hrs)
4. ✅ Story 8.4: Deck Management UI (3 hrs)
5. ✅ Story 8.5: Practice Interface (3 hrs)
6. ✅ Story 8.6: Tutor Integration (1 hr)
7. 🎉 Epic 8 Complete!

---

## 📊 Progress Tracking

### Completed Epics:
- ✅ Epic 5: Library System
- ✅ Epic 6: Tutor Mode AI
- ✅ Epic 7: Tutor UI
- ✅ Epic 7.5: Real-Time Tutor Feedback

### In Progress:
- 🚧 Epic 7.6: Tutor Polish & Audio (Ready to start)

### Upcoming:
- ⏳ Epic 8: Flashcard System (Tomorrow)
- ⏳ Epic 9: Games (Deferred)

---

## 🎯 Success Criteria

**Epic 7.6 Complete When**:
- ✅ Professor Review shows after conversations
- ✅ Review tone is positive and encouraging
- ✅ All errors listed with corrections
- ✅ Audio buttons on all AI messages
- ✅ Audio plays smoothly with Spanish voice
- ✅ Spanish headings in ProfessorOverview fixed

**Epic 8 Complete When**:
- ✅ Users can create decks
- ✅ Users can add cards manually
- ✅ Users can practice with flip cards
- ✅ Mock SRS scheduling works
- ✅ Tutor errors can be saved as flashcards
- ✅ Database migrations applied
- ✅ All API routes tested

---

## 💡 Key Design Decisions

### Mock SRS Scheduler
**Why**: Simplicity first, easy to upgrade
**Upgrade Path**: One-line change to swap schedulers

### Positive Professor Review
**Why**: Encourage learners, reduce anxiety
**Tone**: Always constructive, focus on growth

### Audio Caching
**Why**: Reduce API costs, improve UX
**Implementation**: In-memory caching per session

### Word Definition Enhancements
**Why**: Integrate vocabulary and flashcards
**Priority**: Part of Epic 8 implementation

---

**Ready to implement!** 🚀

Let's crank out Epic 7.6 today, take a break, then blitz through Epic 8 tomorrow.
