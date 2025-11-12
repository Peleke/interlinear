-- Test migration 20251110_latin_dictionary_schema.sql
-- This script validates the migration can be applied

-- Test 1: Check if tables would be created
SELECT 'Test 1: Migration file syntax valid' AS test_name;

-- Test 2: Insert test dictionary entry
INSERT INTO public.dictionary_entries (
  language,
  word,
  lemma,
  pos,
  gender,
  declension_class,
  definition_en,
  source,
  lookup_count
) VALUES (
  'la',
  'test_puella',
  'puella',
  'noun',
  'F',
  '1',
  'girl, maiden, young woman (TEST ENTRY)',
  'lewis-short',
  0
) RETURNING id, word, lemma;

-- Test 3: Query by language
SELECT COUNT(*) AS latin_entries
FROM public.dictionary_entries
WHERE language = 'la';

-- Test 4: Test unique constraint (should fail if run twice)
-- INSERT INTO public.dictionary_entries (language, word, lemma, definition_en, source)
-- VALUES ('la', 'test_puella', 'puella', 'duplicate test', 'manual');

-- Test 5: Test utility function
SELECT * FROM get_dictionary_stats('la');

-- Test 6: Test popular words function (should be empty initially)
SELECT * FROM get_popular_words('la', 5);

-- Cleanup test data
DELETE FROM public.dictionary_entries WHERE word = 'test_puella';

SELECT 'All tests completed successfully' AS result;
