-- ============================================================================
-- Add course_id to flashcard_decks for course-specific deck association
-- ============================================================================

-- Add course_id column (nullable to support existing decks)
ALTER TABLE public.flashcard_decks
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;

-- Create index for course deck lookups
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_course_id ON public.flashcard_decks(course_id);

-- Comment
COMMENT ON COLUMN public.flashcard_decks.course_id IS 'Optional course association - auto-created course decks link here';
