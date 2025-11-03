# Migration Instructions

## 🆕 Markdown Rendering Fix (2025-11-03)

### Problem
Lesson content with `content_type = 'interlinear'` was showing raw markdown instead of rendered HTML.

### Solution
1. ✅ **Code updated**: Replaced `marked` with `react-markdown` (safer, no `dangerouslySetInnerHTML`)
2. ⚠️ **Database needs fixing**: Update content types from `'interlinear'` to `'markdown'`

### How to Fix Database

Run this SQL in Supabase SQL Editor:

```sql
-- Step 1: Check what content types exist
SELECT content_type, COUNT(*) as count
FROM lesson_content
GROUP BY content_type;

-- Step 2: Preview interlinear content before update
SELECT id, lesson_id, LEFT(content, 100) as preview
FROM lesson_content
WHERE content_type = 'interlinear'
LIMIT 5;

-- Step 3: Update interlinear to markdown
UPDATE lesson_content
SET content_type = 'markdown'
WHERE content_type = 'interlinear';

-- Step 4: Verify the update
SELECT content_type, COUNT(*) as count
FROM lesson_content
GROUP BY content_type;
```

### What Gets Fixed
- **Before**: Dialogue content shows as raw markdown (`**María:** ¡Hola!` literally)
- **After**: Properly formatted with bold names, italics, line breaks

### Rebuild Container (Optional)
If you want the updated code:
```bash
docker compose up -d --build
```

---

# Migration Instructions - Lesson Readings System

## Quick Start

Run this SQL in your Supabase SQL Editor (or via CLI):

```bash
cat supabase/migrations/20251102_lesson_readings.sql
```

Copy the entire SQL content and paste it into Supabase Dashboard → SQL Editor → Run.

## What This Does

1. **Adds exercise text fields**: `spanish_text`, `english_text` to `exercises` table
2. **Creates `library_readings` table**: Pre-loaded reading texts (NOT user-specific)
3. **Creates `lesson_readings` junction table**: Associates lessons with readings
4. **Sets up RLS policies**: Authenticated users can read, only service role can write
5. **Adds performance indexes**: For faster queries

## After Running Migration

Re-seed your lessons to populate readings:

```bash
npm run seed:lessons:v2 -- lessons
```

This will:
- Create exercises with proper spanish_text/english_text fields
- Generate ONE library reading per lesson (using dialog content)
- Associate each reading with its lesson
- Calculate word counts automatically

## Lesson Reading System Design

### Library Readings (NOT user-specific)
- Curated reading texts for lessons
- Like pre-loaded texts in `/reader` view
- Users can click words, listen, interact
- One reading per lesson (expandable to multiple later)

### User Flow
1. User views lesson
2. Sees "Practice Reading" link/button
3. Opens reading in `/reader` view with full interactivity
4. Reading content matches lesson level and vocab

### Future Enhancements
- Multiple readings per lesson
- User progress tracking on readings
- Reading completion as part of lesson progress
- Audio playback for readings
- Difficulty-based reading recommendations

## Verification

After migration, check:

```sql
-- Should show spanish_text, english_text columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'exercises';

-- Should show 3 readings (one per lesson)
SELECT COUNT(*) FROM library_readings;

-- Should show lesson-reading associations
SELECT l.title, lr.title as reading_title
FROM lessons l
JOIN lesson_readings jr ON jr.lesson_id = l.id
JOIN library_readings lr ON lr.id = jr.reading_id;
```

## Troubleshooting

**"Column already exists" error**: Safe to ignore, migration uses `ADD COLUMN IF NOT EXISTS`

**"Table already exists" error**: Safe to ignore, migration uses `CREATE TABLE IF NOT EXISTS`

**Seed script errors**: Make sure migration ran successfully first

**No readings showing**: Check RLS policies are enabled and you're authenticated
