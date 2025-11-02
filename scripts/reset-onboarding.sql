-- Reset Onboarding Status
-- Run this in your Supabase SQL Editor to test onboarding flow again

-- Replace 'YOUR_EMAIL_HERE' with your actual email address
-- OR comment out the WHERE clause to reset ALL users (careful!)

-- Step 1: Clear onboarding completion flag
UPDATE user_profiles
SET onboarding_completed = false
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email = 'YOUR_EMAIL_HERE'
);

-- Step 2: Clear course enrollments (optional - comment out if you want to keep enrollments)
DELETE FROM user_courses
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email = 'YOUR_EMAIL_HERE'
);

-- Step 3: Clear lesson completions (optional - comment out if you want to keep progress)
DELETE FROM lesson_completions
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email = 'YOUR_EMAIL_HERE'
);

-- Verify reset
SELECT
  u.email,
  up.onboarding_completed,
  up.assessed_level,
  (SELECT COUNT(*) FROM user_courses WHERE user_id = u.id) as enrolled_courses,
  (SELECT COUNT(*) FROM lesson_completions WHERE user_id = u.id) as completed_lessons
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE u.email = 'YOUR_EMAIL_HERE';
