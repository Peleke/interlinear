-- Add Latin language support to lesson_vocabulary_items table
-- This allows Latin vocabulary items to be linked to lessons

ALTER TABLE lesson_vocabulary_items
DROP CONSTRAINT lesson_vocabulary_items_language_check;

ALTER TABLE lesson_vocabulary_items
ADD CONSTRAINT lesson_vocabulary_items_language_check
CHECK (language = ANY (ARRAY['es'::text, 'is'::text, 'la'::text]));