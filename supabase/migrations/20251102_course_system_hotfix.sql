-- Hotfix: Add unique constraint to courses.level and change lessons.id to TEXT

-- Add unique constraint to courses.level if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'courses_level_key'
    ) THEN
        ALTER TABLE public.courses ADD CONSTRAINT courses_level_key UNIQUE (level);
    END IF;
END $$;

-- Change lessons.id from UUID to TEXT for custom IDs
-- This requires dropping dependent tables and recreating them

DO $$
BEGIN
    -- Only proceed if lessons table is empty
    IF (SELECT COUNT(*) FROM public.lessons) = 0 THEN
        -- Drop dependent foreign key constraints
        ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_lesson_id_fkey;
        ALTER TABLE public.lesson_completions DROP CONSTRAINT IF EXISTS lesson_completions_lesson_id_fkey;
        ALTER TABLE public.lesson_grammar_points DROP CONSTRAINT IF EXISTS lesson_grammar_points_lesson_id_fkey;

        -- Alter lessons.id column type
        ALTER TABLE public.lessons ALTER COLUMN id TYPE TEXT;

        -- Alter foreign key columns in dependent tables
        ALTER TABLE public.exercises ALTER COLUMN lesson_id TYPE TEXT;
        ALTER TABLE public.lesson_completions ALTER COLUMN lesson_id TYPE TEXT;
        ALTER TABLE public.lesson_grammar_points ALTER COLUMN lesson_id TYPE TEXT;

        -- Recreate foreign key constraints with TEXT type
        ALTER TABLE public.exercises
            ADD CONSTRAINT exercises_lesson_id_fkey
            FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

        ALTER TABLE public.lesson_completions
            ADD CONSTRAINT lesson_completions_lesson_id_fkey
            FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

        ALTER TABLE public.lesson_grammar_points
            ADD CONSTRAINT lesson_grammar_points_lesson_id_fkey
            FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

        RAISE NOTICE 'Successfully changed lessons.id to TEXT type';
    ELSE
        RAISE NOTICE 'Lessons table has data - manual migration required';
    END IF;
END $$;
