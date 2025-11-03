# Reading Association System - How It Works

## 📚 Database Schema

### 1. `library_readings` Table
**Purpose**: Stores curated reading texts (NOT user-specific)

```sql
CREATE TABLE library_readings (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL,
  word_count INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Think of it as**: A **library of books** that any student can read.

### 2. `lesson_readings` Junction Table
**Purpose**: Associates lessons with readings (many-to-many)

```sql
CREATE TABLE lesson_readings (
  lesson_id UUID REFERENCES lessons(id),
  reading_id UUID REFERENCES library_readings(id),
  display_order INT,
  PRIMARY KEY (lesson_id, reading_id)
);
```

**Think of it as**: A **reading list assignment** for each lesson.

---

## 🔄 How Readings Are Associated

### Current Flow (Seed Script)
1. **Seed script** (`scripts/seed-lessons-v2.ts`) runs
2. For each lesson with dialogue content:
   - Creates a reading in `library_readings` table
   - Extracts title from lesson (e.g., "Saludos y Presentaciones - lectura")
   - Uses dialogue content as reading text
   - Calculates word count
3. Creates association in `lesson_readings` table:
   - `lesson_id` = the lesson ID
   - `reading_id` = the newly created reading ID
   - `display_order` = 0 (first reading)

### Example Data Flow
```
Lesson "Greetings" (ID: abc123)
  ↓ seed script extracts dialogue
Library Reading Created:
  - ID: xyz789
  - Title: "Saludos y Presentaciones - lectura"
  - Content: "**María:** ¡Hola! ¿Cómo te llamas?..."
  - Word Count: 42
  ↓ seed script creates association
lesson_readings entry:
  - lesson_id: abc123
  - reading_id: xyz789
  - display_order: 0
```

---

## 🎯 How Lesson Page Fetches Readings

### Code Flow (`app/courses/[courseId]/lessons/[lessonId]/page.tsx`)

```typescript
// Step 1: Query lesson_readings junction table
const { data: readings } = await supabase
  .from('lesson_readings')
  .select('reading_id, library_readings(id, title, content, word_count)')
  .eq('lesson_id', lessonId)
  .order('display_order', { ascending: true })

// Step 2: Flatten the nested array
const lessonReadings = readings
  ?.flatMap(r => Array.isArray(r.library_readings) ? r.library_readings : ...)

// Step 3: Pass to LessonViewer component
<LessonViewer readings={lessonReadings} />
```

### Why This Design?
- **Reusability**: Same reading can be used in multiple lessons
- **Flexibility**: Easy to add/remove readings from lessons
- **Order Control**: `display_order` allows specific ordering
- **Future-proof**: Can add multiple readings per lesson

---

## ➕ How to Add New Readings

### Option 1: Via Seed Script (Automatic)
**When**: Re-seeding all lessons

```bash
npm run seed:lessons:v2
```

**What happens**:
1. Script deletes existing readings/associations
2. Re-creates readings from lesson dialogue
3. Re-creates associations

**Use when**: Adding new lessons or changing dialogue content

### Option 2: Manual SQL (For Single Reading)
**When**: Adding one-off reading without re-seeding

```sql
-- Step 1: Create the reading
INSERT INTO library_readings (id, title, content, language, word_count)
VALUES (
  gen_random_uuid(),
  'Custom Reading Title',
  'Your Spanish text here...',
  'es',
  42  -- word count
)
RETURNING id;

-- Step 2: Associate with lesson (use returned ID from step 1)
INSERT INTO lesson_readings (lesson_id, reading_id, display_order)
VALUES (
  '<your-lesson-id>',
  '<reading-id-from-step-1>',
  0  -- display order (0 = first)
);
```

**Use when**: Quick fixes or custom readings for specific lessons

### Option 3: Admin UI (Future)
**Not implemented yet**, but would allow:
- Browse existing readings
- Create new readings
- Associate readings with lessons
- Reorder readings for a lesson

---

## 🐛 Troubleshooting Current Issue

### Problem
> "Saludos y Presentaciones - lectura" links to unrelated reading

### Likely Causes
1. **Seed script didn't run**: Readings not created yet
2. **Wrong association**: `lesson_readings` points to wrong reading
3. **Multiple readings**: Picking wrong one (should be ordered by `display_order`)

### Diagnosis Steps

```sql
-- Step 1: Check if lesson has readings
SELECT lr.lesson_id, lr.reading_id, lr.display_order, lib.title, lib.word_count
FROM lesson_readings lr
JOIN library_readings lib ON lib.id = lr.reading_id
WHERE lr.lesson_id = '1';  -- Replace with your lesson ID

-- Step 2: Check what readings exist
SELECT id, title, LEFT(content, 100) as preview, word_count
FROM library_readings
WHERE language = 'es';

-- Step 3: Check lessons table
SELECT id, title, description
FROM lessons
WHERE id = '1';
```

### Fix Options

**Option A: Re-seed everything** (clean slate)
```bash
npm run seed:lessons:v2
```

**Option B: Manual fix** (if you know the correct reading)
```sql
-- Delete wrong association
DELETE FROM lesson_readings WHERE lesson_id = '1';

-- Add correct association
INSERT INTO lesson_readings (lesson_id, reading_id, display_order)
VALUES ('1', '<correct-reading-id>', 0);
```

**Option C: Create new reading** (if dialogue not in library yet)
```sql
-- Create reading with lesson dialogue
INSERT INTO library_readings (id, title, content, language, word_count)
VALUES (
  gen_random_uuid(),
  'Saludos y Presentaciones - lectura',
  '**María:** ¡Hola! ¿Cómo te llamas?
**Juan:** Me llamo Juan. Mucho gusto.
... (full dialogue)',
  'es',
  42
)
RETURNING id;

-- Associate it
INSERT INTO lesson_readings (lesson_id, reading_id, display_order)
VALUES ('1', '<returned-id>', 0);
```

---

## 🚀 For Demo Purposes

### Quick Test
1. Go to lesson: http://localhost:3000/courses/{courseId}/lessons/1
2. Click the reading link under "Interactive Readings"
3. Should open `/reader?text=...&title=...&lessonId=1&courseId={courseId}`
4. Should see "Back to Lesson" button
5. Content should match lesson dialogue

### If It's Wrong
**Fastest fix for demo**:
```bash
# Re-seed to reset everything
npm run seed:lessons:v2
```

This will:
- Clear old readings
- Recreate readings from current lesson data
- Create correct associations

**Time**: ~10 seconds

---

## 📊 Summary

**Current State**:
- ✅ Database schema exists
- ✅ Junction table for associations
- ✅ Seed script creates readings
- ⚠️ Readings may not be properly seeded yet

**What You Asked**:
> "Can we create a new reading with the dialogue?"

**Answer**: YES! Three ways:
1. **Re-seed** (easiest for demo)
2. **Manual SQL** (precise control)
3. **Future admin UI** (user-friendly)

**Recommendation**: Run `npm run seed:lessons:v2` to ensure readings are properly created from lesson dialogues.
