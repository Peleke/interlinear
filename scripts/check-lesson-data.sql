-- Check Lesson Data in Supabase
-- Run these queries in your Supabase SQL Editor

-- 1. Check if courses exist
SELECT id, title, level, description
FROM courses
ORDER BY level;

-- 2. Check if lessons exist
SELECT id, title, course_id, sequence_order, description
FROM lessons
ORDER BY course_id, sequence_order;

-- 3. Check if lesson_content exists (THIS IS WHAT'S MISSING!)
SELECT
  lc.id,
  lc.lesson_id,
  l.title as lesson_title,
  lc.content_type,
  lc.sequence_order,
  LEFT(lc.content, 100) as content_preview
FROM lesson_content lc
JOIN lessons l ON l.id = lc.lesson_id
ORDER BY lc.lesson_id, lc.sequence_order;

-- 4. Count content blocks per lesson
SELECT
  l.id as lesson_id,
  l.title,
  COUNT(lc.id) as content_blocks
FROM lessons l
LEFT JOIN lesson_content lc ON lc.lesson_id = l.id
GROUP BY l.id, l.title
ORDER BY l.sequence_order;

-- 5. Check if exercises exist
SELECT
  e.id,
  e.lesson_id,
  l.title as lesson_title,
  e.exercise_type,
  e.prompt
FROM exercises e
JOIN lessons l ON l.id = e.lesson_id
ORDER BY e.lesson_id, e.sequence_order;
