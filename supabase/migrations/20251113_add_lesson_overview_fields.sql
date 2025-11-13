-- Add lesson overview fields for section descriptions
-- These fields allow authors to add custom markdown overviews for each lesson section

-- Add overview fields to lessons table
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS readings_overview TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS exercises_overview TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dialogs_overview TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grammar_overview TEXT DEFAULT NULL;

-- Add helpful comments
COMMENT ON COLUMN public.lessons.readings_overview IS 'Optional markdown overview/description for the readings section of this lesson.';
COMMENT ON COLUMN public.lessons.exercises_overview IS 'Optional markdown overview/description for the exercises section of this lesson.';
COMMENT ON COLUMN public.lessons.dialogs_overview IS 'Optional markdown overview/description for the dialogs section of this lesson.';
COMMENT ON COLUMN public.lessons.grammar_overview IS 'Optional markdown overview/description for the grammar concepts section of this lesson.';