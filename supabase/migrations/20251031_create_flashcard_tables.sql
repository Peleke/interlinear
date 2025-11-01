-- ============================================================================
-- Epic 8: Flashcard System with Multiple Card Types
-- Story 8.1: Database Schema & Migrations
-- ============================================================================

-- ============================================================================
-- TABLE: flashcard_decks
-- ============================================================================
-- Stores flashcard decks owned by users

CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: flashcards
-- ============================================================================
-- Stores flashcards with support for multiple card types (Anki-style)

CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,

  -- Card type (Anki-style card types)
  card_type TEXT NOT NULL CHECK (card_type IN ('basic', 'basic_reversed', 'basic_with_text', 'cloze')),

  -- Basic card fields (used by basic, basic_reversed, basic_with_text)
  front TEXT,
  back TEXT,

  -- Cloze card field (used by cloze type)
  cloze_text TEXT, -- "El {{c1::perro}} corre en el {{c2::parque}}."

  -- Shared fields
  extra TEXT, -- Additional context/example text (shown after reveal)
  notes TEXT, -- User notes

  -- Source tracking (where this card came from)
  source TEXT, -- 'tutor_session', 'reader', 'manual', etc.
  source_id UUID, -- Reference to source (e.g., tutor_sessions.id)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validation constraints
  CONSTRAINT valid_basic_card CHECK (
    (card_type IN ('basic', 'basic_reversed', 'basic_with_text') AND front IS NOT NULL AND back IS NOT NULL)
    OR card_type = 'cloze'
  ),
  CONSTRAINT valid_cloze_card CHECK (
    (card_type = 'cloze' AND cloze_text IS NOT NULL)
    OR card_type != 'cloze'
  )
);

-- ============================================================================
-- TABLE: card_reviews
-- ============================================================================
-- Stores individual review sessions for cards (supports SRS scheduling)

CREATE TABLE IF NOT EXISTS public.card_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- For reversed/cloze cards, track which variation was shown
  -- 0 = basic/first side
  -- 1 = reversed second side (for basic_reversed)
  -- 0-n = cloze deletion index (for cloze cards with multiple deletions)
  card_index INTEGER DEFAULT 0,

  -- Quality rating (0=Again, 1=Hard, 2=Good, 3=Easy)
  quality INTEGER NOT NULL CHECK (quality >= 0 AND quality <= 3),

  -- SRS scheduling fields
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review_date TIMESTAMPTZ NOT NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Deck indexes
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON public.flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_updated ON public.flashcard_decks(updated_at);

-- Flashcard indexes
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_card_type ON public.flashcards(card_type);
CREATE INDEX IF NOT EXISTS idx_flashcards_source ON public.flashcards(source, source_id);

-- Review indexes
CREATE INDEX IF NOT EXISTS idx_card_reviews_card_id ON public.card_reviews(card_id);
CREATE INDEX IF NOT EXISTS idx_card_reviews_user_id ON public.card_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_card_reviews_next_review_date ON public.card_reviews(next_review_date);
CREATE INDEX IF NOT EXISTS idx_card_reviews_card_index ON public.card_reviews(card_id, card_index);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flashcard_decks
CREATE POLICY "Users can view their own decks"
  ON public.flashcard_decks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decks"
  ON public.flashcard_decks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON public.flashcard_decks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON public.flashcard_decks
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for flashcards
CREATE POLICY "Users can view flashcards in their decks"
  ON public.flashcards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks
      WHERE flashcard_decks.id = flashcards.deck_id
      AND flashcard_decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create flashcards in their decks"
  ON public.flashcards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks
      WHERE flashcard_decks.id = flashcards.deck_id
      AND flashcard_decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update flashcards in their decks"
  ON public.flashcards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks
      WHERE flashcard_decks.id = flashcards.deck_id
      AND flashcard_decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete flashcards in their decks"
  ON public.flashcards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks
      WHERE flashcard_decks.id = flashcards.deck_id
      AND flashcard_decks.user_id = auth.uid()
    )
  );

-- RLS Policies for card_reviews
CREATE POLICY "Users can view their own reviews"
  ON public.card_reviews
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews"
  ON public.card_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTION: Get Due Flashcards
-- ============================================================================
-- Returns flashcards that are due for review (handles card variations)

CREATE OR REPLACE FUNCTION public.get_due_flashcards(
  p_user_id UUID,
  p_deck_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  card_id UUID,
  deck_id UUID,
  deck_name TEXT,
  card_type TEXT,
  card_index INTEGER,
  front TEXT,
  back TEXT,
  cloze_text TEXT,
  extra TEXT,
  notes TEXT,
  last_review_quality INTEGER,
  last_review_date TIMESTAMPTZ,
  next_review_date TIMESTAMPTZ,
  interval_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH card_variations AS (
    -- For basic cards: 1 variation (index 0)
    SELECT
      f.id AS card_id,
      0 AS card_index
    FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'basic'

    UNION ALL

    -- For basic_reversed cards: 2 variations (index 0 and 1)
    SELECT f.id, 0 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'basic_reversed'
    UNION ALL
    SELECT f.id, 1 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'basic_reversed'

    UNION ALL

    -- For basic_with_text cards: 1 variation (index 0)
    SELECT f.id, 0 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'basic_with_text'

    UNION ALL

    -- For cloze cards: multiple variations based on {{cN::}} deletions
    -- For now, we'll generate up to 10 variations (can be adjusted)
    SELECT f.id, generate_series(0, 9) AS card_index
    FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'cloze'
      -- Only include valid cloze indices (check if {{cN::}} exists)
      AND f.cloze_text ~ ('{{c' || (generate_series + 1) || '::')
  )
  SELECT DISTINCT ON (cv.card_id, cv.card_index)
    f.id AS card_id,
    f.deck_id,
    d.name AS deck_name,
    f.card_type,
    cv.card_index,
    f.front,
    f.back,
    f.cloze_text,
    f.extra,
    f.notes,
    r.quality AS last_review_quality,
    r.reviewed_at AS last_review_date,
    r.next_review_date,
    r.interval_days
  FROM card_variations cv
  INNER JOIN public.flashcards f ON f.id = cv.card_id
  INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
  LEFT JOIN LATERAL (
    SELECT *
    FROM public.card_reviews
    WHERE card_id = cv.card_id
      AND card_index = cv.card_index
      AND user_id = p_user_id
    ORDER BY reviewed_at DESC
    LIMIT 1
  ) r ON TRUE
  WHERE r.next_review_date IS NULL OR r.next_review_date <= NOW()
  ORDER BY cv.card_id, cv.card_index, r.reviewed_at DESC NULLS FIRST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_due_flashcards(UUID, UUID, INTEGER) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.flashcard_decks IS 'User-owned flashcard decks';
COMMENT ON TABLE public.flashcards IS 'Flashcards supporting multiple Anki-style card types (basic, reversed, with_text, cloze)';
COMMENT ON TABLE public.card_reviews IS 'Review history for flashcard practice sessions with SRS scheduling';

COMMENT ON COLUMN public.flashcards.card_type IS 'Card type: basic, basic_reversed, basic_with_text, cloze';
COMMENT ON COLUMN public.flashcards.cloze_text IS 'Cloze deletion text with {{c1::word}} syntax for cloze cards';
COMMENT ON COLUMN public.flashcards.extra IS 'Additional context/example text shown after answer reveal';
COMMENT ON COLUMN public.card_reviews.card_index IS 'Variation index: 0 for basic, 0-1 for reversed, 0-n for cloze deletions';
COMMENT ON COLUMN public.card_reviews.quality IS 'Quality rating: 0=Again, 1=Hard, 2=Good, 3=Easy';
