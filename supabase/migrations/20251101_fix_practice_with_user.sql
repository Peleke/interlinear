-- Fix practice query to properly filter by user_id
-- This version includes user_id filtering to work with RLS policies

-- Drop the existing view
DROP VIEW IF EXISTS practice_queue;

-- Create a function-based view that filters by current user
CREATE OR REPLACE FUNCTION get_practice_queue()
RETURNS TABLE (
    id UUID,
    deck_id UUID,
    front_text TEXT,
    back_text TEXT,
    audio_url TEXT,
    image_url TEXT,
    ease_factor DECIMAL,
    interval_days INTEGER,
    repetitions INTEGER,
    next_review_date DATE,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    review_priority INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fc.id,
        fc.deck_id,
        fc.front_text,
        fc.back_text,
        fc.audio_url,
        fc.image_url,
        COALESCE(ps.ease_factor, 2.5) as ease_factor,
        COALESCE(ps.interval_days, 0) as interval_days,
        COALESCE(ps.repetitions, 0) as repetitions,
        ps.next_review_date,
        ps.last_reviewed_at,
        CASE
            WHEN ps.next_review_date IS NULL THEN 0
            WHEN ps.next_review_date <= CURRENT_DATE THEN 1
            ELSE 2
        END as review_priority
    FROM flashcards fc
    LEFT JOIN practice_state ps
        ON fc.id = ps.flashcard_id
        AND ps.user_id = auth.uid()
    WHERE fc.deck_id IS NOT NULL
    ORDER BY review_priority ASC, ps.next_review_date ASC NULLS FIRST;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_practice_queue() TO authenticated;
