-- Fix tutor_sessions to work with both library_texts AND library_readings
-- The issue: tutor_sessions.text_id references library_texts, but lesson readings use library_readings

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.tutor_sessions
  DROP CONSTRAINT IF EXISTS tutor_sessions_text_id_fkey;

-- Step 2: Make text_id nullable to support both library types
-- (We'll keep the NOT NULL constraint but handle it in application logic)
-- Actually, let's keep it NOT NULL and just remove the FK constraint
-- The application will validate the text exists in either table

COMMENT ON COLUMN public.tutor_sessions.text_id IS 'References either library_texts.id OR library_readings.id - validated in application layer';
