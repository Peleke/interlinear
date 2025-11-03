-- ============================================================================
-- USER RESET SCRIPT FOR DEMO
-- ============================================================================
-- Resets onboarding status, course enrollments, XP, and progress for demo
-- Replace 'YOUR_USER_EMAIL' with your actual user email
-- ============================================================================

-- Get user ID (replace email)
DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  -- Find user by email (CHANGE THIS!)
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'kwayet.f@gmail.com';

  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'User not found! Update the email in this script.';
    RETURN;
  END IF;

  RAISE NOTICE 'Resetting user: %', demo_user_id;

  -- ============================================================================
  -- RESET ONBOARDING
  -- ============================================================================
  UPDATE public.users
  SET onboarding_completed = FALSE
  WHERE id = demo_user_id;
  RAISE NOTICE '✓ Onboarding reset';

  -- ============================================================================
  -- RESET XP & LEVEL
  -- ============================================================================
  UPDATE public.users
  SET
    xp = 0,
    level = 1,
    updated_at = NOW()
  WHERE id = demo_user_id;
  RAISE NOTICE '✓ XP and level reset to 0/1';

  -- ============================================================================
  -- RESET COURSE ENROLLMENTS
  -- ============================================================================
  DELETE FROM public.user_courses WHERE user_id = demo_user_id;
  RAISE NOTICE '✓ Course enrollments cleared';

  -- ============================================================================
  -- RESET LESSON COMPLETIONS
  -- ============================================================================
  DELETE FROM public.lesson_completions WHERE user_id = demo_user_id;
  RAISE NOTICE '✓ Lesson completions cleared';

  -- ============================================================================
  -- RESET FLASHCARD DECKS & CARDS
  -- ============================================================================
  DELETE FROM public.flashcard_decks WHERE user_id = demo_user_id;
  -- Cards will cascade delete automatically
  RAISE NOTICE '✓ Flashcard decks and cards cleared';

  -- ============================================================================
  -- RESET TUTOR SESSIONS
  -- ============================================================================
  DELETE FROM public.tutor_sessions WHERE user_id = demo_user_id;
  RAISE NOTICE '✓ Tutor sessions cleared';

  -- ============================================================================
  -- RESET READER PROGRESS
  -- ============================================================================
  DELETE FROM public.reader_sessions WHERE user_id = demo_user_id;
  RAISE NOTICE '✓ Reader sessions cleared';

  -- ============================================================================
  -- RESET VOCABULARY
  -- ============================================================================
  DELETE FROM public.vocabulary WHERE user_id = demo_user_id;
  RAISE NOTICE '✓ Vocabulary cleared';

  -- ============================================================================
  -- RESET LIBRARY (texts and readings)
  -- ============================================================================
  DELETE FROM public.library_texts WHERE user_id = demo_user_id;
  DELETE FROM public.library_readings WHERE user_id = demo_user_id;
  RAISE NOTICE '✓ Library texts and readings cleared';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Demo reset complete for user: %', demo_user_id;
  RAISE NOTICE 'You can now demo the full onboarding flow!';
  RAISE NOTICE '========================================';
END $$;
