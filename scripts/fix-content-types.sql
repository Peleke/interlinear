-- Check current content_type distribution
SELECT content_type, COUNT(*) as count
FROM lesson_content
GROUP BY content_type
ORDER BY count DESC;

-- Preview interlinear content before update
SELECT id, lesson_id, content_type, LEFT(content, 100) as content_preview
FROM lesson_content
WHERE content_type = 'interlinear'
LIMIT 3;

-- Update interlinear to markdown
-- UPDATE lesson_content
-- SET content_type = 'markdown'
-- WHERE content_type = 'interlinear';

-- Verify after update (uncomment after running UPDATE)
-- SELECT content_type, COUNT(*) as count
-- FROM lesson_content
-- GROUP BY content_type
-- ORDER BY count DESC;
