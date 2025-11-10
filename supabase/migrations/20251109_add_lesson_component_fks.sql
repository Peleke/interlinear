-- Migration: Add Foreign Key Constraints for Lesson Components
-- Created: 2025-11-09
-- Epic: EPIC-04
-- Description: Add explicit foreign key relationships for Postgres relationship detection
-- Dependencies: Run AFTER 20251109_lesson_exercises_and_readings.sql

-- Add foreign key to lesson_dialogs (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_dialogs') THEN
    ALTER TABLE public.lesson_dialogs
      DROP CONSTRAINT IF EXISTS lesson_dialogs_lesson_id_fkey,
      ADD CONSTRAINT lesson_dialogs_lesson_id_fkey
        FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
        ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key to lesson_vocabulary (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_vocabulary') THEN
    ALTER TABLE public.lesson_vocabulary
      DROP CONSTRAINT IF EXISTS lesson_vocabulary_lesson_id_fkey,
      ADD CONSTRAINT lesson_vocabulary_lesson_id_fkey
        FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
        ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key to lesson_grammar_concepts (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_grammar_concepts') THEN
    ALTER TABLE public.lesson_grammar_concepts
      DROP CONSTRAINT IF EXISTS lesson_grammar_concepts_lesson_id_fkey,
      ADD CONSTRAINT lesson_grammar_concepts_lesson_id_fkey
        FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
        ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key to lesson_exercises (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_exercises') THEN
    ALTER TABLE public.lesson_exercises
      DROP CONSTRAINT IF EXISTS lesson_exercises_lesson_id_fkey,
      ADD CONSTRAINT lesson_exercises_lesson_id_fkey
        FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
        ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key to lesson_readings (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_readings') THEN
    ALTER TABLE public.lesson_readings
      DROP CONSTRAINT IF EXISTS lesson_readings_lesson_id_fkey,
      ADD CONSTRAINT lesson_readings_lesson_id_fkey
        FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
        ON DELETE CASCADE;
  END IF;
END $$;

-- Refresh Postgres schema cache
NOTIFY pgrst, 'reload schema';
