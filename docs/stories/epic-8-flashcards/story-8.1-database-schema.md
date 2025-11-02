# Story 8.1: Database Schema & Migrations

**Epic**: 8 - Flashcard System
**Status**: 🚧 Not Started
**Priority**: P0
**Estimated Effort**: 1 hour
**Dependencies**: None

---

## User Story

**As a** developer
**I want** database tables for flashcards, decks, and review history
**So that** we can store and track user flashcard practice data

---

## Acceptance Criteria

- [ ] `flashcard_decks` table created
- [ ] `flashcards` table created with SRS fields
- [ ] `review_history` table created
- [ ] Indexes for performance created
- [ ] RLS policies configured
- [ ] Migration tested locally
- [ ] Migration applied to Supabase

---

## Implementation

### Migration File

**Path**: `supabase/migrations/20251031_flashcard_system.sql`

```sql
-- =============================================
-- Flashcard System Tables
-- Created: 2025-10-31
-- Epic 8: Flashcard System
-- =============================================

-- Create flashcard_decks table
CREATE TABLE public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT deck_name_length CHECK (char_length(name) BETWEEN 1 AND 100)
);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Card content
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  notes TEXT,

  -- Source tracking
  source TEXT, -- 'tutor_session', 'vocabulary', 'manual'
  source_id UUID,

  -- SRS fields (minimal for mock scheduler)
  next_review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,

  -- Optional: For future SM-2 upgrade
  ease_factor DECIMAL DEFAULT 2.5,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT card_front_length CHECK (char_length(front) BETWEEN 1 AND 500),
  CONSTRAINT card_back_length CHECK (char_length(back) BETWEEN 1 AND 1000),
  CONSTRAINT interval_positive CHECK (interval_days >= 0),
  CONSTRAINT repetitions_positive CHECK (repetitions >= 0)
);

-- Create review_history table
CREATE TABLE public.review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quality INTEGER NOT NULL, -- 0-5 rating
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT quality_range CHECK (quality BETWEEN 0 AND 5)
);

-- Create indexes for performance
CREATE INDEX idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX idx_flashcards_next_review ON public.flashcards(next_review_date);
CREATE INDEX idx_flashcards_source ON public.flashcards(source, source_id);
CREATE INDEX idx_flashcard_decks_user_id ON public.flashcard_decks(user_id);
CREATE INDEX idx_review_history_flashcard_id ON public.review_history(flashcard_id);
CREATE INDEX idx_review_history_user_id ON public.review_history(user_id);

-- Enable Row Level Security
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for flashcard_decks
-- =============================================

CREATE POLICY "Users can view own decks"
  ON public.flashcard_decks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decks"
  ON public.flashcard_decks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decks"
  ON public.flashcard_decks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decks"
  ON public.flashcard_decks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- RLS Policies for flashcards
-- =============================================

CREATE POLICY "Users can view own flashcards"
  ON public.flashcards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards"
  ON public.flashcards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
  ON public.flashcards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards"
  ON public.flashcards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- RLS Policies for review_history
-- =============================================

CREATE POLICY "Users can view own review history"
  ON public.review_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews"
  ON public.review_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Note: No UPDATE or DELETE for review history (immutable log)

-- =============================================
-- Helpful Comments
-- =============================================

COMMENT ON TABLE public.flashcard_decks IS 'User-created flashcard decks for organizing cards';
COMMENT ON TABLE public.flashcards IS 'Individual flashcards with SRS scheduling data';
COMMENT ON TABLE public.review_history IS 'Immutable log of flashcard review sessions';

COMMENT ON COLUMN public.flashcards.source IS 'Origin of card: tutor_session, vocabulary, manual';
COMMENT ON COLUMN public.flashcards.source_id IS 'ID of source entity (session_id, text_id, etc)';
COMMENT ON COLUMN public.flashcards.next_review_date IS 'When card should appear in practice';
COMMENT ON COLUMN public.flashcards.interval_days IS 'Days until next review';
COMMENT ON COLUMN public.flashcards.ease_factor IS 'SM-2 ease factor (unused in mock scheduler)';
COMMENT ON COLUMN public.review_history.quality IS 'Review quality: 0=Again, 5=Easy';

-- =============================================
-- Helper Functions (Optional)
-- =============================================

-- Function to get due cards for a user
CREATE OR REPLACE FUNCTION get_due_flashcards(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  deck_id UUID,
  front TEXT,
  back TEXT,
  notes TEXT,
  next_review_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.deck_id,
    f.front,
    f.back,
    f.notes,
    f.next_review_date
  FROM public.flashcards f
  WHERE f.user_id = user_uuid
    AND f.next_review_date <= NOW()
  ORDER BY f.next_review_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_due_flashcards TO authenticated;
```

---

## Testing Checklist

### Local Testing

```bash
# 1. Create migration file
# supabase/migrations/20251031_flashcard_system.sql

# 2. Apply migration
supabase db reset  # or supabase migration up

# 3. Verify tables exist
supabase db diff

# 4. Test inserts
```

### SQL Tests

```sql
-- Test deck creation
INSERT INTO flashcard_decks (user_id, name, description)
VALUES (auth.uid(), 'Spanish Verbs', 'Common verb conjugations');

-- Test flashcard creation
INSERT INTO flashcards (user_id, deck_id, front, back, source)
VALUES (
  auth.uid(),
  (SELECT id FROM flashcard_decks LIMIT 1),
  'hablar (yo)',
  'hablo',
  'manual'
);

-- Test review history
INSERT INTO review_history (flashcard_id, user_id, quality)
VALUES (
  (SELECT id FROM flashcards LIMIT 1),
  auth.uid(),
  4
);

-- Test due cards query
SELECT * FROM get_due_flashcards(auth.uid());

-- Test RLS (should fail)
-- SELECT * FROM flashcards WHERE user_id != auth.uid();

-- Test cascade delete
DELETE FROM flashcard_decks WHERE id = (SELECT id FROM flashcard_decks LIMIT 1);
-- Verify flashcards in that deck are also deleted
```

### Validation

- [ ] All tables created successfully
- [ ] Columns have correct types and constraints
- [ ] Indexes exist (`\d flashcards` in psql)
- [ ] RLS blocks cross-user access
- [ ] CASCADE DELETE works (deck → cards → reviews)
- [ ] Constraints enforced (quality 0-5, positive intervals)
- [ ] Helper function returns due cards correctly

---

## Technical Notes

### Design Decisions

**Deck-Card Relationship**: Optional (NULL deck_id)
- Allows orphaned cards (created from tutor, not yet organized)
- Can add to deck later via UI

**Review History**: Immutable
- No UPDATE or DELETE policies
- Preserves learning history for analytics
- Can derive statistics from this log

**SRS Fields**: Minimal for mock
- `next_review_date` - When to show card
- `interval_days` - Current interval
- `repetitions` - Times reviewed
- `ease_factor` - Stored but unused (for SM-2 upgrade)

**Source Tracking**: Flexible
- `source` = 'tutor_session' | 'vocabulary' | 'manual'
- `source_id` = Foreign key to source entity
- Not enforced by FK (allows flexibility)

---

## Rollback Plan

```sql
-- If migration fails, rollback:
DROP FUNCTION IF EXISTS get_due_flashcards;
DROP TABLE IF EXISTS public.review_history CASCADE;
DROP TABLE IF EXISTS public.flashcards CASCADE;
DROP TABLE IF EXISTS public.flashcard_decks CASCADE;
```

---

## Success Criteria

**Story Complete When**:
- ✅ Migration file created
- ✅ All tables created with correct schema
- ✅ RLS policies configured and tested
- ✅ Indexes created for performance
- ✅ Migration applied to Supabase dashboard
- ✅ Manual SQL tests passing
- ✅ No errors in migration logs

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
