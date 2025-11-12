-- Add Latin language support to vocabulary table
-- This allows Latin vocabulary items to be saved alongside Spanish and Icelandic

ALTER TABLE vocabulary
DROP CONSTRAINT vocabulary_language_check;

ALTER TABLE vocabulary
ADD CONSTRAINT vocabulary_language_check
CHECK (language = ANY (ARRAY['es'::text, 'is'::text, 'la'::text]));