-- ============================================================================
-- DIALOG ROLEPLAY TUTOR: Database Schema Extensions
-- ============================================================================
-- Epic 10: Dialog Roleplay Tutor
-- Story 10.7: Database Schema Extensions
--
-- Extends tutor_sessions table to support dialog roleplay functionality
-- where students practice lesson dialogs by roleplaying as one character
-- ============================================================================

-- Add dialog_id column (nullable for backward compatibility)
ALTER TABLE public.tutor_sessions
ADD COLUMN dialog_id UUID REFERENCES public.lesson_dialogs(id) ON DELETE CASCADE;

-- Add selected_role column (stores which character the user is playing)
ALTER TABLE public.tutor_sessions
ADD COLUMN selected_role TEXT;

-- Make text_id nullable (sessions can be for dialogs OR library texts, not both)
ALTER TABLE public.tutor_sessions
ALTER COLUMN text_id DROP NOT NULL;

-- Add constraint: must have either text_id OR dialog_id, not both
ALTER TABLE public.tutor_sessions
ADD CONSTRAINT session_type_check CHECK (
  (text_id IS NOT NULL AND dialog_id IS NULL) OR
  (text_id IS NULL AND dialog_id IS NOT NULL)
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.tutor_sessions.dialog_id IS 'References the lesson dialog being practiced (NULL for library text sessions)';
COMMENT ON COLUMN public.tutor_sessions.selected_role IS 'The character name the user chose to play (e.g., "María", "Carlos")';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for querying roleplay sessions by dialog
CREATE INDEX idx_tutor_sessions_dialog_id
ON public.tutor_sessions(dialog_id)
WHERE dialog_id IS NOT NULL;

-- Index for querying user's roleplay sessions
CREATE INDEX idx_tutor_sessions_user_dialog
ON public.tutor_sessions(user_id, dialog_id)
WHERE dialog_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Check if columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tutor_sessions'
      AND column_name = 'dialog_id'
  ) THEN
    RAISE EXCEPTION 'Migration failed: dialog_id column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tutor_sessions'
      AND column_name = 'selected_role'
  ) THEN
    RAISE EXCEPTION 'Migration failed: selected_role column not created';
  END IF;

  RAISE NOTICE 'Dialog roleplay schema migration completed successfully';
END $$;
