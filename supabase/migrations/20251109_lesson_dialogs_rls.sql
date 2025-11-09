-- Migration: Add RLS policies for lesson_dialogs and dialog_exchanges
-- Created: 2025-11-09
-- Epic: EPIC-05 (Content Builders)
-- Description: Enable RLS and add policies for dialog content authoring

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE public.lesson_dialogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialog_exchanges ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- LESSON_DIALOGS POLICIES
-- =============================================================================

-- Authors can view dialogs for their own lessons
CREATE POLICY "Authors can view their lesson dialogs"
  ON public.lesson_dialogs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_dialogs.lesson_id
      AND lessons.author_id = auth.uid()
    )
  );

-- Authors can insert dialogs for their own lessons
CREATE POLICY "Authors can insert dialogs for their lessons"
  ON public.lesson_dialogs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_dialogs.lesson_id
      AND lessons.author_id = auth.uid()
    )
  );

-- Authors can update dialogs for their own lessons
CREATE POLICY "Authors can update their lesson dialogs"
  ON public.lesson_dialogs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_dialogs.lesson_id
      AND lessons.author_id = auth.uid()
    )
  );

-- Authors can delete dialogs for their own lessons
CREATE POLICY "Authors can delete their lesson dialogs"
  ON public.lesson_dialogs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_dialogs.lesson_id
      AND lessons.author_id = auth.uid()
    )
  );

-- =============================================================================
-- DIALOG_EXCHANGES POLICIES
-- =============================================================================

-- Authors can view exchanges for their lesson dialogs
CREATE POLICY "Authors can view their dialog exchanges"
  ON public.dialog_exchanges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lesson_dialogs
      JOIN public.lessons ON lessons.id = lesson_dialogs.lesson_id
      WHERE lesson_dialogs.id = dialog_exchanges.dialog_id
      AND lessons.author_id = auth.uid()
    )
  );

-- Authors can insert exchanges for their lesson dialogs
CREATE POLICY "Authors can insert dialog exchanges"
  ON public.dialog_exchanges
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lesson_dialogs
      JOIN public.lessons ON lessons.id = lesson_dialogs.lesson_id
      WHERE lesson_dialogs.id = dialog_exchanges.dialog_id
      AND lessons.author_id = auth.uid()
    )
  );

-- Authors can update exchanges for their lesson dialogs
CREATE POLICY "Authors can update their dialog exchanges"
  ON public.dialog_exchanges
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lesson_dialogs
      JOIN public.lessons ON lessons.id = lesson_dialogs.lesson_id
      WHERE lesson_dialogs.id = dialog_exchanges.dialog_id
      AND lessons.author_id = auth.uid()
    )
  );

-- Authors can delete exchanges for their lesson dialogs
CREATE POLICY "Authors can delete their dialog exchanges"
  ON public.dialog_exchanges
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lesson_dialogs
      JOIN public.lessons ON lessons.id = lesson_dialogs.lesson_id
      WHERE lesson_dialogs.id = dialog_exchanges.dialog_id
      AND lessons.author_id = auth.uid()
    )
  );

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "Authors can view their lesson dialogs" ON public.lesson_dialogs IS
  'Authors can view dialogs for lessons they created';

COMMENT ON POLICY "Authors can view their dialog exchanges" ON public.dialog_exchanges IS
  'Authors can view exchanges for dialogs in lessons they created';
