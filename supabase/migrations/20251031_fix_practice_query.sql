-- ============================================================================
-- FIX: get_due_flashcards - Remove generate_series WHERE clause bug
-- ============================================================================

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

    -- For cloze cards: generate variations for each cloze deletion
    -- Check for c1 through c10 (supports up to 10 deletions per card)
    SELECT f.id, 0 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'cloze'
      AND f.cloze_text ~ '{{c1::'
    UNION ALL
    SELECT f.id, 1 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'cloze'
      AND f.cloze_text ~ '{{c2::'
    UNION ALL
    SELECT f.id, 2 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'cloze'
      AND f.cloze_text ~ '{{c3::'
    UNION ALL
    SELECT f.id, 3 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'cloze'
      AND f.cloze_text ~ '{{c4::'
    UNION ALL
    SELECT f.id, 4 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'cloze'
      AND f.cloze_text ~ '{{c5::'
    UNION ALL
    SELECT f.id, 5 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'cloze'
      AND f.cloze_text ~ '{{c6::'
    UNION ALL
    SELECT f.id, 6 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'cloze'
      AND f.cloze_text ~ '{{c7::'
    UNION ALL
    SELECT f.id, 7 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'cloze'
      AND f.cloze_text ~ '{{c8::'
    UNION ALL
    SELECT f.id, 8 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'cloze'
      AND f.cloze_text ~ '{{c9::'
    UNION ALL
    SELECT f.id, 9 FROM public.flashcards f
    INNER JOIN public.flashcard_decks d ON d.id = f.deck_id
    WHERE d.user_id = p_user_id
      AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
      AND f.card_type = 'cloze'
      AND f.cloze_text ~ '{{c10::'
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
