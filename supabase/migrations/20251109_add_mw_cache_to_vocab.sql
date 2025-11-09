-- Migration: Add Merriam-Webster caching columns to vocabulary
-- Created: 2025-11-09
-- Description: Add columns for caching MW dictionary data on first lookup

-- =============================================================================
-- ADD MW CACHE COLUMNS
-- =============================================================================

ALTER TABLE public.lesson_vocabulary_items
ADD COLUMN IF NOT EXISTS mw_id TEXT,
ADD COLUMN IF NOT EXISTS mw_data JSONB,
ADD COLUMN IF NOT EXISTS mw_fetched_at TIMESTAMPTZ;

-- =============================================================================
-- ADD INDEX FOR MW LOOKUPS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_vocab_items_mw_id
ON public.lesson_vocabulary_items(mw_id)
WHERE mw_id IS NOT NULL;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN public.lesson_vocabulary_items.mw_id IS
  'Merriam-Webster meta.id for this vocabulary item (cached on first lookup)';

COMMENT ON COLUMN public.lesson_vocabulary_items.mw_data IS
  'Full Merriam-Webster JSON response (cached on first lookup for offline access)';

COMMENT ON COLUMN public.lesson_vocabulary_items.mw_fetched_at IS
  'Timestamp when MW data was last fetched (for cache invalidation)';
