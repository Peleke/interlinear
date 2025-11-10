-- ============================================================================
-- EPIC 8: Latin Dictionary Schema
-- Created: 2025-11-10
-- Description: Hybrid self-improving dictionary with CLTK enhancement
-- ============================================================================

-- ============================================================================
-- MAIN DICTIONARY TABLE (language-agnostic design)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dictionary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identification
  language TEXT NOT NULL CHECK (language IN ('la', 'on', 'grc', 'es', 'en')),
  word TEXT NOT NULL, -- Inflected form as seen in text
  lemma TEXT NOT NULL, -- Base dictionary form (headword)

  -- Linguistic metadata
  pos TEXT, -- Part of speech: noun, verb, adj, prep, etc.
  gender TEXT CHECK (gender IN ('M', 'F', 'N', 'C')), -- M/F/N/Common
  declension_class TEXT, -- For nouns: 1st, 2nd, 3rd, 4th, 5th
  conjugation_class TEXT, -- For verbs: 1st, 2nd, 3rd, 4th, irregular

  -- Definitions (multi-language support)
  definition_en TEXT NOT NULL, -- English definition (primary)
  definition_native TEXT, -- Original source language (e.g., Norwegian for Fritzner)

  -- Morphological data (CLTK-enhanced)
  inflections JSONB, -- All inflected forms: {nom_sg: "puella", gen_sg: "puellae", ...}
  phonetic_transcription TEXT, -- IPA or similar

  -- Usage examples
  examples JSONB, -- [{text: "puella in horto", translation: "girl in garden", source: "..."}]

  -- Metadata
  source TEXT NOT NULL, -- 'lewis-short', 'ordbok', 'fritzner', 'cltk', 'manual'
  source_data JSONB, -- Original entry from source dictionary
  enriched_at TIMESTAMPTZ, -- When CLTK analysis was added
  lookup_count INTEGER DEFAULT 0, -- Popularity tracking

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Uniqueness: one entry per word per language
  UNIQUE(language, word)
);

-- Performance indexes
CREATE INDEX idx_dictionary_language_word ON public.dictionary_entries(language, word);
CREATE INDEX idx_dictionary_lemma ON public.dictionary_entries(language, lemma);
CREATE INDEX idx_dictionary_pos ON public.dictionary_entries(language, pos);
CREATE INDEX idx_dictionary_lookup_count ON public.dictionary_entries(lookup_count DESC);
CREATE INDEX idx_dictionary_source ON public.dictionary_entries(source);

-- Full-text search index (for fuzzy matching)
CREATE INDEX idx_dictionary_search ON public.dictionary_entries
  USING gin(to_tsvector('simple', word || ' ' || lemma || ' ' || COALESCE(definition_en, '')));

-- ============================================================================
-- TRANSLATION CACHE (for non-English source dictionaries)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.translation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  source_lang TEXT NOT NULL, -- 'no' (Norwegian), 'de' (German), etc.
  target_lang TEXT NOT NULL DEFAULT 'en', -- Usually English
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,

  -- Translation metadata
  service TEXT, -- 'openai', 'google', 'deepl', 'manual'
  confidence FLOAT, -- 0.0-1.0 if provided by service

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(source_lang, target_lang, source_text)
);

CREATE INDEX idx_translation_lookup ON public.translation_cache(source_lang, target_lang, source_text);

-- ============================================================================
-- CLTK ANALYSIS CACHE (expensive computations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cltk_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  language TEXT NOT NULL,
  word TEXT NOT NULL,

  -- Full CLTK output (JSON)
  analysis JSONB NOT NULL,

  -- Quick access fields (denormalized from analysis)
  lemma TEXT,
  pos TEXT,
  morphology JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(language, word)
);

CREATE INDEX idx_cltk_cache_lookup ON public.cltk_analysis_cache(language, word);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_dictionary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dictionary_entries_updated_at ON public.dictionary_entries;
CREATE TRIGGER update_dictionary_entries_updated_at
  BEFORE UPDATE ON public.dictionary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_dictionary_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (PUBLIC READ)
-- ============================================================================
-- Dictionary is public read-only for all users
ALTER TABLE public.dictionary_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dictionary entries are publicly readable" ON public.dictionary_entries;
CREATE POLICY "Dictionary entries are publicly readable"
  ON public.dictionary_entries FOR SELECT
  USING (true);

-- Only service role can write (via API)
DROP POLICY IF EXISTS "Service role can manage dictionary" ON public.dictionary_entries;
CREATE POLICY "Service role can manage dictionary"
  ON public.dictionary_entries FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Translation cache: public read, service write
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Translation cache publicly readable" ON public.translation_cache;
CREATE POLICY "Translation cache publicly readable"
  ON public.translation_cache FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage translations" ON public.translation_cache;
CREATE POLICY "Service role can manage translations"
  ON public.translation_cache FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- CLTK cache: public read, service write
ALTER TABLE public.cltk_analysis_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CLTK cache publicly readable" ON public.cltk_analysis_cache;
CREATE POLICY "CLTK cache publicly readable"
  ON public.cltk_analysis_cache FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage CLTK cache" ON public.cltk_analysis_cache;
CREATE POLICY "Service role can manage CLTK cache"
  ON public.cltk_analysis_cache FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Get dictionary statistics
CREATE OR REPLACE FUNCTION get_dictionary_stats(p_language TEXT DEFAULT NULL)
RETURNS TABLE (
  language TEXT,
  total_entries BIGINT,
  enriched_entries BIGINT,
  top_sources JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.language,
    COUNT(*)::BIGINT as total_entries,
    COUNT(de.enriched_at)::BIGINT as enriched_entries,
    jsonb_object_agg(de.source, source_count) as top_sources
  FROM dictionary_entries de
  CROSS JOIN LATERAL (
    SELECT COUNT(*)::INTEGER as source_count
    FROM dictionary_entries
    WHERE source = de.source AND language = de.language
  ) subquery
  WHERE p_language IS NULL OR de.language = p_language
  GROUP BY de.language;
END;
$$ LANGUAGE plpgsql;

-- Get most looked up words
CREATE OR REPLACE FUNCTION get_popular_words(
  p_language TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  word TEXT,
  lemma TEXT,
  lookup_count INTEGER,
  definition_en TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.word,
    de.lemma,
    de.lookup_count,
    de.definition_en
  FROM dictionary_entries de
  WHERE de.language = p_language
  ORDER BY de.lookup_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.dictionary_entries IS 'Self-improving dictionary with incremental CLTK enhancement';
COMMENT ON COLUMN public.dictionary_entries.language IS 'ISO 639-1 code: la=Latin, on=Old Norse, grc=Greek, etc.';
COMMENT ON COLUMN public.dictionary_entries.word IS 'Inflected form as it appears in texts';
COMMENT ON COLUMN public.dictionary_entries.lemma IS 'Base dictionary form (headword for lookup)';
COMMENT ON COLUMN public.dictionary_entries.enriched_at IS 'When morphological analysis was added via CLTK';
COMMENT ON COLUMN public.dictionary_entries.lookup_count IS 'Popularity tracking for cache optimization';
