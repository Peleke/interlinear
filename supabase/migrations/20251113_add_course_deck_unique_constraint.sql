-- Add partial unique index to prevent duplicate course decks per user
-- Fixes race condition causing multiple course decks for same user+course

-- First, clean up existing duplicates by keeping only the oldest deck per user+course
-- Delete duplicate course decks, keeping only the first one (by created_at)
DELETE FROM public.flashcard_decks
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY user_id, course_id
                   ORDER BY created_at ASC
               ) as rn
        FROM public.flashcard_decks
        WHERE course_id IS NOT NULL
    ) ranked
    WHERE rn > 1
);

-- Now create the unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_course_deck_idx
ON public.flashcard_decks (user_id, course_id)
WHERE course_id IS NOT NULL;