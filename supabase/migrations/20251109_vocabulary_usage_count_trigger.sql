-- Migration: Vocabulary Usage Count Trigger (EPIC-02 Story 2.3)
-- Created: 2025-11-09
-- Description: Auto-increment/decrement usage_count when vocab linked to lessons
--
-- GitHub Issue: Story 2.3: Usage Count Trigger

-- =============================================================================
-- USAGE COUNT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_vocabulary_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: increment usage_count
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.lesson_vocabulary_items
    SET usage_count = usage_count + 1
    WHERE id = NEW.vocabulary_id;
    RETURN NEW;
  END IF;

  -- On DELETE: decrement usage_count (but don't go below 0)
  IF (TG_OP = 'DELETE') THEN
    UPDATE public.lesson_vocabulary_items
    SET usage_count = GREATEST(usage_count - 1, 0)
    WHERE id = OLD.vocabulary_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER ON LESSON_VOCABULARY JUNCTION TABLE
-- =============================================================================

-- Drop trigger if exists (for safe re-running)
DROP TRIGGER IF EXISTS trigger_update_vocabulary_usage_count
  ON public.lesson_vocabulary;

-- Create trigger for INSERT and DELETE operations
CREATE TRIGGER trigger_update_vocabulary_usage_count
  AFTER INSERT OR DELETE ON public.lesson_vocabulary
  FOR EACH ROW
  EXECUTE FUNCTION update_vocabulary_usage_count();

-- =============================================================================
-- BACKFILL USAGE COUNTS FROM EXISTING DATA
-- =============================================================================

-- Calculate and set usage_count for all existing vocabulary items
UPDATE public.lesson_vocabulary_items AS lvi
SET usage_count = (
  SELECT COUNT(*)
  FROM public.lesson_vocabulary AS lv
  WHERE lv.vocabulary_id = lvi.id
);

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Run this to verify usage counts are correct:
-- SELECT
--   lvi.id,
--   lvi.spanish,
--   lvi.english,
--   lvi.usage_count,
--   (SELECT COUNT(*) FROM lesson_vocabulary WHERE vocabulary_id = lvi.id) AS actual_count
-- FROM lesson_vocabulary_items lvi
-- WHERE lvi.usage_count > 0
-- ORDER BY lvi.usage_count DESC;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION update_vocabulary_usage_count() IS 'Auto-updates usage_count when vocabulary linked/unlinked from lessons';
COMMENT ON TRIGGER trigger_update_vocabulary_usage_count ON public.lesson_vocabulary IS 'Maintains accurate usage_count on lesson_vocabulary_items';
