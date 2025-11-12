-- Run this in your database to check if Latin vocabulary was saved
SELECT 
  lvi.id,
  lvi.spanish,
  lvi.english,
  lvi.language,
  lvi.created_at,
  lv.lesson_id
FROM lesson_vocabulary_items lvi
LEFT JOIN lesson_vocabulary lv ON lvi.id = lv.vocabulary_id  
WHERE lvi.language = 'la'
ORDER BY lvi.created_at DESC
LIMIT 10;
