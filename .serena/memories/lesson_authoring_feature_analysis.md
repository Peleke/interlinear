# Lesson Authoring Feature: Analysis & Specification

## Current Lesson Data Model

### Core Tables
```sql
lessons (
  id TEXT PRIMARY KEY,              -- Custom ID from YAML
  course_id UUID,                   -- FK to courses
  title TEXT NOT NULL,              -- ✅ Required
  overview TEXT NOT NULL,           -- ❌ Should be nullable
  xp_value INTEGER DEFAULT 100,
  sequence_order INTEGER,
  grammar_content JSONB,            -- Legacy, superseded by grammar_concepts
  vocabulary JSONB,                 -- Legacy, superseded by normalized tables
  created_at, updated_at
)
```

### Content Components (Normalized)

**1. Dialogs**
```sql
lesson_dialogs (
  id UUID,
  lesson_id TEXT,
  context TEXT NOT NULL,
  setting TEXT
)
dialog_exchanges (
  id UUID,
  dialog_id UUID,
  sequence_order INTEGER,
  speaker TEXT,
  spanish TEXT,
  english TEXT
)
```

**2. Vocabulary**
```sql
lesson_vocabulary_items (
  id UUID,
  spanish TEXT,
  english TEXT,
  part_of_speech TEXT,
  difficulty_level TEXT
)
lesson_vocabulary (junction) (
  lesson_id TEXT,
  vocabulary_id UUID,
  is_new BOOLEAN
)
```

**3. Grammar**
```sql
grammar_concepts (
  id UUID,
  name TEXT UNIQUE,
  display_name TEXT,
  description TEXT,
  content TEXT,                     -- Markdown
  associated_vocab_ids UUID[],
  related_grammar_ids UUID[]
)
lesson_grammar_concepts (junction) (
  lesson_id TEXT,
  grammar_concept_id UUID
)
```

**4. Exercises**
```sql
exercises (
  id UUID,
  lesson_id UUID,
  type TEXT,                        -- fill_blank | multiple_choice | translation
  prompt TEXT,
  answer TEXT,
  options JSONB,
  spanish_text TEXT,                -- For translation exercises
  english_text TEXT,
  xp_value INTEGER
)
```

**5. Readings**
```sql
library_readings (
  id UUID,
  title TEXT UNIQUE,
  author TEXT,
  source TEXT,
  content TEXT,
  language TEXT,
  difficulty_level TEXT
)
lesson_readings (junction) (
  lesson_id TEXT,
  reading_id UUID,
  display_order INTEGER,
  is_required BOOLEAN
)
```

## Gap Analysis for Authoring Feature

### 🔴 Critical Changes Needed

1. **Make fields nullable** (draft-first approach)
   - `lessons.overview` → nullable
   - Allow lessons with minimal initial data
   
2. **Add draft/publish status**
   - Need `status` enum: draft | published | archived
   - Control visibility to learners
   
3. **Track authorship**
   - Add `author_id UUID` to track who created lesson
   - Essential for multi-author scenarios

4. **Support multiple dialogs**
   - ✅ Already supported via `lesson_dialogs` table
   - Can have 0+ dialogs per lesson

5. **Flexible content structure**
   - ✅ Already normalized (vocabulary, grammar, exercises separate)
   - ✅ Can incrementally add components

### 🟡 Nice-to-Have Enhancements

1. **Version history**
   - Track edits over time
   - Enable rollback

2. **Collaborative authoring**
   - Multiple authors per lesson
   - Role-based permissions (creator, editor, reviewer)

3. **Preview mode**
   - See lesson as learner would before publishing

4. **Content templates**
   - Quick-start templates for common lesson types

## Proposed Schema Changes

### 1. Add Lesson Status & Authorship
```sql
ALTER TABLE lessons
  ADD COLUMN status TEXT DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN author_id UUID REFERENCES auth.users(id),
  ALTER COLUMN overview DROP NOT NULL;

CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_lessons_author ON lessons(author_id);
```

### 2. Update RLS Policies
```sql
-- Authors can view their own drafts
CREATE POLICY "Authors can view own draft lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (author_id = auth.uid() OR status = 'published');

-- Authors can create lessons
CREATE POLICY "Authenticated users can create lessons"
  ON lessons FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Authors can update own lessons
CREATE POLICY "Authors can update own lessons"
  ON lessons FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- Authors can delete own draft lessons
CREATE POLICY "Authors can delete own draft lessons"
  ON lessons FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() AND status = 'draft');
```

### 3. Extend Component Tables with Draft Support

All component tables (dialogs, vocabulary, exercises, readings) need to respect lesson status:
- Only show in learner views if lesson.status = 'published'
- Always show to author regardless of status

## Authoring Workflow UX

### Phase 1: Create Lesson Shell
```
POST /api/lessons
{
  title: "Introduction to Ser",
  course_id: "uuid",
  author_id: "uuid",
  status: "draft"
}
→ Returns lesson ID
→ All other fields null/empty
```

### Phase 2: Incremental Content Addition

**Add Overview**
```
PATCH /api/lessons/:id
{ overview: "Learn to use SER in present tense..." }
```

**Add Dialog**
```
POST /api/lessons/:id/dialogs
{
  context: "Meeting someone new",
  setting: "Coffee shop",
  exchanges: [
    { speaker: "Ana", spanish: "Hola, soy Ana", english: "Hi, I'm Ana", sequence_order: 0 },
    { speaker: "Carlos", spanish: "Mucho gusto", english: "Nice to meet you", sequence_order: 1 }
  ]
}
```

**Add Vocabulary**
```
POST /api/lessons/:id/vocabulary
{
  items: [
    { spanish: "ser", english: "to be", part_of_speech: "verb", is_new: true },
    { spanish: "hola", english: "hello", is_new: false }
  ]
}
```

**Add Grammar Concept**
```
POST /api/lessons/:id/grammar
{
  concept_id: "uuid",  // Reference existing
  OR
  new_concept: {       // Create new inline
    name: "verb_ser_present_intro",
    display_name: "SER - Present Tense Introduction",
    content: "# SER in Present\n\n- yo soy\n- tú eres\n..."
  }
}
```

**Add Exercise**
```
POST /api/lessons/:id/exercises
{
  type: "fill_blank",
  prompt: "Yo ___ estudiante",
  answer: "soy",
  xp_value: 10
}
```

**Add Reading**
```
POST /api/lessons/:id/readings
{
  reading_id: "uuid",    // Link existing
  is_required: true,
  display_order: 0
  OR
  new_reading: {         // Create new inline
    title: "Ana's Day",
    content: "Ana es estudiante...",
    difficulty_level: "A1"
  }
}
```

### Phase 3: Publish
```
PATCH /api/lessons/:id
{ status: "published" }
→ Validates minimum requirements (title + at least 1 component?)
→ Makes visible to learners
```

## API Endpoints Needed

```
POST   /api/lessons                         # Create lesson shell
GET    /api/lessons/:id                     # Get lesson + all components
PATCH  /api/lessons/:id                     # Update lesson metadata
DELETE /api/lessons/:id                     # Delete draft lesson

POST   /api/lessons/:id/dialogs             # Add dialog
PATCH  /api/lessons/:id/dialogs/:dialogId   # Update dialog
DELETE /api/lessons/:id/dialogs/:dialogId   # Remove dialog

POST   /api/lessons/:id/vocabulary          # Add vocab items
DELETE /api/lessons/:id/vocabulary/:itemId  # Remove vocab item

POST   /api/lessons/:id/grammar             # Link grammar concept
DELETE /api/lessons/:id/grammar/:conceptId  # Unlink grammar concept

POST   /api/lessons/:id/exercises           # Add exercise
PATCH  /api/lessons/:id/exercises/:exId     # Update exercise
DELETE /api/lessons/:id/exercises/:exId     # Remove exercise

POST   /api/lessons/:id/readings            # Link reading
DELETE /api/lessons/:id/readings/:readingId # Unlink reading

GET    /api/lessons?status=draft&author_id=me  # List my drafts
```

## Frontend Components Needed

1. **LessonEditor** - Main authoring interface
2. **DialogBuilder** - Multi-exchange dialog creator
3. **VocabularyManager** - Add/remove vocab items
4. **GrammarSelector** - Search/select/create grammar concepts
5. **ExerciseBuilder** - Type-specific exercise creation
6. **ReadingLinker** - Search/link/create readings
7. **PublishValidation** - Pre-publish checklist

## Implementation Priority

### P0 - MVP (Knock This Out)
1. Schema changes (status, author_id, nullable fields)
2. RLS policies for draft/published
3. API endpoints for lesson CRUD
4. Basic LessonEditor UI
5. Dialog, Vocabulary, Exercise builders
6. Publish workflow

### P1 - Polish
1. Grammar concept management
2. Reading linking
3. Preview mode
4. Content templates

### P2 - Advanced
1. Version history
2. Collaborative authoring
3. Bulk import from YAML
4. Analytics on draft content

## Integration Points

### With Existing Seeding System
- Current: YAML → parse-lessons.ts → seed-lessons-v2.ts → DB
- Future: Authoring UI → API → DB (same tables)
- Can coexist: YAML for bulk, UI for individual

### With Learner Experience
- Published lessons show in course view
- Draft lessons invisible to learners
- Author can preview as learner would see it
