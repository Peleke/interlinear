-- Add spanish_text and english_text columns to exercises table
-- These are used for translation exercises where the prompt asks to translate a specific text

ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS spanish_text TEXT,
ADD COLUMN IF NOT EXISTS english_text TEXT;

-- Add comment explaining the columns
COMMENT ON COLUMN exercises.spanish_text IS 'The Spanish text to translate (for ES→EN exercises)';
COMMENT ON COLUMN exercises.english_text IS 'The English text to translate (for EN→ES exercises)';
