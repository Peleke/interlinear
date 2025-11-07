# Lesson Authoring System: Implementation Specification

**Feature**: Incremental lesson creation and draft management
**Priority**: P0 (Knock this out)
**Target**: Enable content creation as you study, iterative refinement workflow

**Related Specs**:
- [Vocabulary Integration](./vocabulary_integration_spec.md) - Linked vocabulary system with language support
- [UX Design Documentation](./lesson_authoring_interaction_flows.md) - User journeys and interface flows

---

## Implementation Checklist

### Phase 1: Database & API (Backend)

- [ ] **Migration 1**: Lesson table modifications
  - [ ] Add `status` column (draft|published|archived)
  - [ ] Add `author_id` column
  - [ ] Add `language` column (es|is) for multi-language support
  - [ ] Make `overview` nullable
  - [ ] Add indexes for status, author_id, language
  - [ ] Add updated_at trigger

- [ ] **Migration 2**: RLS policy updates
  - [ ] Draft visibility (author only)
  - [ ] Published visibility (all authenticated)
  - [ ] Create permissions (authenticated users)
  - [ ] Update permissions (author only)
  - [ ] Delete permissions (author only, drafts only)

- [ ] **API Routes**: `/api/lessons/*`
  - [ ] `POST /api/lessons` - Create draft lesson
  - [ ] `GET /api/lessons/:id` - Get lesson with all components
  - [ ] `PATCH /api/lessons/:id` - Update lesson metadata
  - [ ] `DELETE /api/lessons/:id` - Delete draft lesson
  - [ ] `GET /api/lessons` - List lessons (filter by status, author)
  - [ ] `POST /api/lessons/:id/publish` - Publish draft

- [ ] **API Routes**: `/api/lessons/:id/dialogs/*`
  - [ ] `POST /api/lessons/:id/dialogs` - Create dialog with exchanges
  - [ ] `PATCH /api/lessons/:id/dialogs/:dialogId` - Update dialog
  - [ ] `DELETE /api/lessons/:id/dialogs/:dialogId` - Delete dialog

- [ ] **API Routes**: `/api/lessons/:id/vocabulary/*`
  - [ ] `POST /api/lessons/:id/vocabulary` - Add vocab items (reuse or create new)
  - [ ] `DELETE /api/lessons/:id/vocabulary/:itemId` - Remove vocab item
  - [ ] `GET /api/lessons/vocabulary/search` - Autocomplete search for vocab reuse

- [ ] **API Routes**: `/api/lessons/:id/complete` (Learner-facing)
  - [ ] `POST /api/lessons/:id/complete` - Mark complete + populate user vocabulary

- [ ] **API Routes**: `/api/lessons/:id/grammar/*`
  - [ ] `POST /api/lessons/:id/grammar` - Link grammar concept
  - [ ] `DELETE /api/lessons/:id/grammar/:conceptId` - Unlink concept

- [ ] **API Routes**: `/api/lessons/:id/exercises/*`
  - [ ] `POST /api/lessons/:id/exercises` - Create exercise
  - [ ] `PATCH /api/lessons/:id/exercises/:exerciseId` - Update exercise
  - [ ] `DELETE /api/lessons/:id/exercises/:exerciseId` - Delete exercise

- [ ] **API Routes**: `/api/lessons/:id/readings/*`
  - [ ] `POST /api/lessons/:id/readings` - Link reading
  - [ ] `DELETE /api/lessons/:id/readings/:readingId` - Unlink reading

- [ ] **Validation Logic**
  - [ ] Publish requirements check (minimum: title + 1 component)
  - [ ] Author ownership verification
  - [ ] Status transition rules (draft→published→archived)

### Phase 2: UI Components (Frontend)

- [ ] **LessonEditor** (Main container)
  - [ ] Route: `/author/lessons/:id/edit`
  - [ ] Layout: Sidebar navigation + main content area
  - [ ] Auto-save on changes (debounced)
  - [ ] Draft/published status indicator
  - [ ] Publish button with validation

- [ ] **MetadataPanel**
  - [ ] Title input (required)
  - [ ] **Language selector** (es|is) - NEW for multi-language
  - [ ] Overview textarea (markdown supported)
  - [ ] Course selector
  - [ ] XP value input
  - [ ] Sequence order input

- [ ] **DialogBuilder**
  - [ ] Add dialog button
  - [ ] Dialog list (with context preview)
  - [ ] Exchange editor
    - [ ] Add exchange
    - [ ] Reorder exchanges (drag & drop)
    - [ ] Speaker name input
    - [ ] Spanish/English text inputs
    - [ ] Delete exchange
  - [ ] Dialog context/setting inputs
  - [ ] Delete dialog confirmation

- [ ] **VocabularyManager**
  - [ ] **Autocomplete search** with reuse indicators
    - [ ] Show "Used in N lessons" badge
    - [ ] Rank by usage_count (most popular first)
    - [ ] Filter by language (es|is)
  - [ ] Add existing vocab (click suggestion)
  - [ ] Add new vocab item inline
  - [ ] Vocab item form:
    - [ ] Spanish/Source language input
    - [ ] English translation input
    - [ ] Part of speech selector
    - [ ] Difficulty level selector
    - [ ] Is new checkbox (auto-set if usage_count=0)
  - [ ] Vocab list with remove button
  - [ ] Show lesson reuse info ("Also in: Lesson 1.2, 1.5")
  - [ ] Bulk add (paste from spreadsheet?)

- [ ] **GrammarSelector**
  - [ ] Search existing grammar concepts
  - [ ] Link existing concept
  - [ ] Create new concept inline
  - [ ] Concept form:
    - [ ] Name (slug)
    - [ ] Display name
    - [ ] Description
    - [ ] Content (markdown editor)
  - [ ] Linked concepts list with unlink button

- [ ] **ExerciseBuilder**
  - [ ] Exercise type selector
  - [ ] Type-specific forms:
    - [ ] Fill blank: prompt, answer
    - [ ] Multiple choice: prompt, answer, options[]
    - [ ] Translation: spanish_text, english_text
  - [ ] XP value input
  - [ ] Exercise list with edit/delete
  - [ ] Preview exercise as learner would see

- [ ] **ReadingLinker**
  - [ ] Search library readings
  - [ ] Link existing reading
  - [ ] Create new reading inline
  - [ ] Reading form:
    - [ ] Title
    - [ ] Author
    - [ ] Source
    - [ ] Content (textarea)
    - [ ] Language
    - [ ] Difficulty level
  - [ ] Linked readings list with:
    - [ ] Display order
    - [ ] Required checkbox
    - [ ] Unlink button

- [ ] **PublishPanel**
  - [ ] Validation checklist:
    - [ ] Has title ✓
    - [ ] Has at least one component ✓
    - [ ] All exercises have answers ✓
  - [ ] Publish button (disabled if validation fails)
  - [ ] Confirmation dialog
  - [ ] Success message with link to published lesson

- [ ] **PreviewMode**
  - [ ] Toggle: "Preview as learner"
  - [ ] Render lesson components as learner would see
  - [ ] Hide authoring controls
  - [ ] Show "Exit preview" button

### Phase 3: Author Dashboard

- [ ] **MyLessons** page
  - [ ] Route: `/author/lessons`
  - [ ] List of user's lessons
  - [ ] Filter: All | Drafts | Published | Archived
  - [ ] Sort: Recent | Alphabetical | Course
  - [ ] Lesson cards showing:
    - [ ] Title
    - [ ] Status badge
    - [ ] Course name
    - [ ] Last updated
    - [ ] Component counts (dialogs, vocab, exercises, etc.)
    - [ ] Edit button
    - [ ] Delete button (drafts only)
  - [ ] "New Lesson" button

- [ ] **LessonTemplates**
  - [ ] Template library
  - [ ] Templates:
    - [ ] Blank lesson
    - [ ] Dialog-focused
    - [ ] Grammar-focused
    - [ ] Vocabulary-focused
    - [ ] Reading-focused
  - [ ] "Start from template" flow

### Phase 4: Polish & UX

- [ ] **Keyboard shortcuts**
  - [ ] Cmd+S / Ctrl+S: Save
  - [ ] Cmd+P / Ctrl+P: Publish
  - [ ] Cmd+Shift+P / Ctrl+Shift+P: Preview

- [ ] **Autosave**
  - [ ] Debounced save on input changes
  - [ ] Visual indicator: "Saving..." → "Saved"
  - [ ] Conflict resolution if multiple tabs open

- [ ] **Undo/Redo**
  - [ ] Maintain edit history
  - [ ] Cmd+Z / Ctrl+Z: Undo
  - [ ] Cmd+Shift+Z / Ctrl+Shift+Z: Redo

- [ ] **Markdown support**
  - [ ] Overview field
  - [ ] Grammar concept content
  - [ ] Reading content
  - [ ] Live preview or split view

- [ ] **Drag & drop**
  - [ ] Reorder dialog exchanges
  - [ ] Reorder exercises
  - [ ] Reorder readings

- [ ] **Bulk operations**
  - [ ] Duplicate lesson
  - [ ] Import from YAML
  - [ ] Export to YAML

---

## Database Schema Changes

### Migration: Add Lesson Authoring Fields

```sql
-- File: supabase/migrations/YYYYMMDD_lesson_authoring.sql

-- Add authoring fields to lessons table
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ALTER COLUMN overview DROP NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_status ON public.lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_author ON public.lessons(author_id);

-- Update RLS policies

-- Drop existing "Anyone can view lessons" policy
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;

-- Authors can view their own drafts, everyone can view published
CREATE POLICY "Users can view appropriate lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR author_id = auth.uid()
  );

-- Authenticated users can create lessons
CREATE POLICY "Authenticated users can create lessons"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Authors can update their own lessons
CREATE POLICY "Authors can update own lessons"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Authors can delete their own draft lessons
CREATE POLICY "Authors can delete own draft lessons"
  ON public.lessons FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() AND status = 'draft');

-- Add comment
COMMENT ON COLUMN public.lessons.status IS 'Lesson visibility: draft (author only), published (all users), archived (author only)';
COMMENT ON COLUMN public.lessons.author_id IS 'User who created this lesson';
```

### Migration: Component Table RLS Updates

```sql
-- File: supabase/migrations/YYYYMMDD_component_authoring_rls.sql

-- Update component table policies to respect lesson status and authorship

-- Dialogs: respect lesson status
DROP POLICY IF EXISTS "Anyone can view lesson dialogs" ON public.lesson_dialogs;
CREATE POLICY "Users can view appropriate lesson dialogs"
  ON public.lesson_dialogs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_dialogs.lesson_id
        AND (lessons.status = 'published' OR lessons.author_id = auth.uid())
    )
  );

-- Authors can create/update/delete dialogs for their lessons
CREATE POLICY "Authors can manage dialogs for own lessons"
  ON public.lesson_dialogs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_dialogs.lesson_id
        AND lessons.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_dialogs.lesson_id
        AND lessons.author_id = auth.uid()
    )
  );

-- Similar patterns for other component tables:
-- - dialog_exchanges
-- - lesson_vocabulary
-- - lesson_grammar_concepts
-- - exercises
-- - lesson_readings

-- (Repeat pattern for each table)
```

---

## API Endpoints Specification

### Base: `/api/lessons`

#### `POST /api/lessons`
Create new draft lesson.

**Request**:
```json
{
  "title": "Introduction to SER",
  "course_id": "uuid",
  "overview": "Learn to use SER verb...", // optional
  "xp_value": 100, // optional, default 100
  "sequence_order": 1 // optional, auto-increment within course
}
```

**Response**:
```json
{
  "id": "intro-ser",
  "title": "Introduction to SER",
  "course_id": "uuid",
  "author_id": "uuid",
  "status": "draft",
  "overview": null,
  "xp_value": 100,
  "sequence_order": 1,
  "created_at": "2025-11-06T...",
  "updated_at": "2025-11-06T..."
}
```

#### `GET /api/lessons/:id`
Get lesson with all components.

**Response**:
```json
{
  "lesson": {
    "id": "intro-ser",
    "title": "Introduction to SER",
    "status": "draft",
    "author_id": "uuid",
    ...
  },
  "dialogs": [
    {
      "id": "uuid",
      "context": "Meeting someone new",
      "exchanges": [
        { "speaker": "Ana", "spanish": "Hola", "english": "Hello", "sequence_order": 0 }
      ]
    }
  ],
  "vocabulary": [
    { "spanish": "ser", "english": "to be", "part_of_speech": "verb", "is_new": true }
  ],
  "grammar_concepts": [
    { "id": "uuid", "name": "verb_ser_present", "display_name": "SER - Present" }
  ],
  "exercises": [
    { "id": "uuid", "type": "fill_blank", "prompt": "Yo ___ estudiante", "answer": "soy" }
  ],
  "readings": [
    { "id": "uuid", "title": "Ana's Day", "is_required": true, "display_order": 0 }
  ]
}
```

#### `PATCH /api/lessons/:id`
Update lesson metadata.

**Request**:
```json
{
  "title": "Updated Title", // optional
  "overview": "Updated overview", // optional
  "xp_value": 150 // optional
}
```

#### `POST /api/lessons/:id/publish`
Publish draft lesson.

**Validation**:
- Must have title
- Must have at least 1 component (dialog, vocab, grammar, exercise, or reading)
- Author must own lesson
- Status must be 'draft'

**Response**:
```json
{
  "success": true,
  "lesson": { ...updated lesson with status: "published" }
}
```

**Error (validation failed)**:
```json
{
  "success": false,
  "errors": [
    "Lesson must have at least one component"
  ]
}
```

#### `DELETE /api/lessons/:id`
Delete draft lesson (and all components).

**Authorization**: Author only, draft status only

---

### Dialogs: `/api/lessons/:id/dialogs`

#### `POST /api/lessons/:id/dialogs`
Create dialog with exchanges.

**Request**:
```json
{
  "context": "Meeting someone new",
  "setting": "Coffee shop",
  "exchanges": [
    {
      "speaker": "Ana",
      "spanish": "Hola, soy Ana",
      "english": "Hi, I'm Ana",
      "sequence_order": 0
    },
    {
      "speaker": "Carlos",
      "spanish": "Mucho gusto",
      "english": "Nice to meet you",
      "sequence_order": 1
    }
  ]
}
```

**Response**:
```json
{
  "id": "uuid",
  "lesson_id": "intro-ser",
  "context": "Meeting someone new",
  "setting": "Coffee shop",
  "exchanges": [...]
}
```

#### `PATCH /api/lessons/:id/dialogs/:dialogId`
Update dialog and/or exchanges.

#### `DELETE /api/lessons/:id/dialogs/:dialogId`
Delete dialog and all exchanges.

---

### Vocabulary: `/api/lessons/:id/vocabulary`

#### `POST /api/lessons/:id/vocabulary`
Add vocabulary items to lesson.

**Request**:
```json
{
  "items": [
    {
      "spanish": "ser",
      "english": "to be",
      "part_of_speech": "verb",
      "difficulty_level": "A1",
      "is_new": true
    },
    {
      "spanish": "hola",
      "english": "hello",
      "part_of_speech": "interjection",
      "is_new": false
    }
  ]
}
```

**Logic**:
- Check if vocab item exists in `lesson_vocabulary_items` (by spanish + english)
- If exists, get ID; if not, create new item
- Link to lesson via `lesson_vocabulary` junction table

**Response**:
```json
{
  "added": 2,
  "items": [
    { "id": "uuid", "spanish": "ser", ... },
    { "id": "uuid", "spanish": "hola", ... }
  ]
}
```

#### `DELETE /api/lessons/:id/vocabulary/:itemId`
Remove vocabulary item from lesson (junction only, doesn't delete item itself).

---

### Grammar: `/api/lessons/:id/grammar`

#### `POST /api/lessons/:id/grammar`
Link or create grammar concept.

**Request (link existing)**:
```json
{
  "concept_id": "uuid"
}
```

**Request (create new)**:
```json
{
  "new_concept": {
    "name": "verb_ser_present_intro",
    "display_name": "SER - Present Tense",
    "description": "Introduction to SER conjugation",
    "content": "# SER in Present\n\n- yo soy\n- tú eres\n..."
  }
}
```

**Response**:
```json
{
  "concept": {
    "id": "uuid",
    "name": "verb_ser_present_intro",
    "display_name": "SER - Present Tense",
    ...
  }
}
```

#### `DELETE /api/lessons/:id/grammar/:conceptId`
Unlink grammar concept from lesson.

---

### Exercises: `/api/lessons/:id/exercises`

#### `POST /api/lessons/:id/exercises`
Create exercise.

**Request (fill_blank)**:
```json
{
  "type": "fill_blank",
  "prompt": "Yo ___ estudiante",
  "answer": "soy",
  "xp_value": 10
}
```

**Request (multiple_choice)**:
```json
{
  "type": "multiple_choice",
  "prompt": "How do you say 'I am'?",
  "answer": "soy",
  "options": ["soy", "eres", "es", "somos"],
  "xp_value": 10
}
```

**Request (translation)**:
```json
{
  "type": "translation",
  "spanish_text": "Yo soy estudiante",
  "english_text": "I am a student",
  "xp_value": 10
}
```

#### `PATCH /api/lessons/:id/exercises/:exerciseId`
Update exercise.

#### `DELETE /api/lessons/:id/exercises/:exerciseId`
Delete exercise.

---

### Readings: `/api/lessons/:id/readings`

#### `POST /api/lessons/:id/readings`
Link or create reading.

**Request (link existing)**:
```json
{
  "reading_id": "uuid",
  "is_required": true,
  "display_order": 0
}
```

**Request (create new)**:
```json
{
  "new_reading": {
    "title": "Ana's Day",
    "author": "Learning Team",
    "source": "Original",
    "content": "Ana es estudiante. Ella vive en Madrid...",
    "language": "es",
    "difficulty_level": "A1"
  },
  "is_required": true,
  "display_order": 0
}
```

#### `DELETE /api/lessons/:id/readings/:readingId`
Unlink reading from lesson.

---

## UI/UX Mockups & Design Specifications

### 1. MyLessons Dashboard (`/author/lessons`)

**Purpose**: Central hub for authors to view, filter, and manage their lessons

```
┌────────────────────────────────────────────────────────────────────────┐
│  Interlinear Author Studio                    [Profile ▼] [Help] [⚙]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  My Lessons                                                             │
│                                                                         │
│  ┌─────────────────────────────────────────┐  ┌──────────────────────┐│
│  │ 🔍 Search lessons...                   │  │ [+ New Lesson]      ││
│  └─────────────────────────────────────────┘  └──────────────────────┘│
│                                                                         │
│  Filters: [All (12)] [Drafts (8)] [Published (3)] [Archived (1)]      │
│  Sort by: [Recent ▼] [Alphabetical] [Course]                           │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 📝 Introduction to SER                            [DRAFT]        │ │
│  │ Course: Spanish A1 | Last edited: 2 hours ago                    │ │
│  │ ├─ 2 dialogs  ├─ 12 vocab  ├─ 1 grammar  ├─ 3 exercises          │ │
│  │ └─ 0 readings                                                     │ │
│  │                                         [Edit] [Delete]           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ ✅ Greetings & Introductions                   [PUBLISHED]       │ │
│  │ Course: Spanish A1 | Published: 3 days ago                       │ │
│  │ ├─ 3 dialogs  ├─ 18 vocab  ├─ 2 grammar  ├─ 5 exercises          │ │
│  │ └─ 1 reading                                                      │ │
│  │                                         [Edit] [View Live]        │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 📝 Possessive Adjectives                          [DRAFT]        │ │
│  │ Course: Spanish A2 | Last edited: 1 week ago                     │ │
│  │ ├─ 0 dialogs  ├─ 5 vocab  ├─ 0 grammar  ├─ 0 exercises           │ │
│  │ └─ 0 readings                                    ⚠️ Incomplete    │ │
│  │                                         [Edit] [Delete]           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  [Load More...]                                                         │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

**Design Notes**:
- Status badges: Green for published, Blue for draft, Gray for archived
- Component counts visible at-a-glance
- Warning indicator for lessons with missing components
- Delete only available for drafts
- "View Live" link for published lessons opens learner view

---

### 2. New Lesson Modal (Template Selector)

**Purpose**: Quick-start lesson creation with optional templates

```
┌─────────────────────────────────────────────────────────┐
│  Create New Lesson                              [✕]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Title *                                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Introduction to SER                                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Course *                                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Spanish A1                                      ▼  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Start from template (optional)                          │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ 📄 Blank     │ 💬 Dialog    │ 📚 Grammar   │        │
│  │              │   Focused    │   Focused    │        │
│  │ Start fresh  │ 3 dialogs    │ 1 grammar +  │        │
│  │              │ + exercises  │   exercises  │        │
│  │ [Select]     │ [Select]     │ [Select]     │        │
│  └──────────────┴──────────────┴──────────────┘        │
│  ┌──────────────┬──────────────┐                        │
│  │ 📖 Vocab     │ 📕 Reading   │                        │
│  │   Focused    │   Focused    │                        │
│  │ 20 vocab +   │ 1 reading +  │                        │
│  │   exercises  │   exercises  │                        │
│  │ [Select]     │ [Select]     │                        │
│  └──────────────┴──────────────┘                        │
│                                                          │
│                          [Cancel]  [Create Lesson]      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Interaction Flow**:
1. Click "New Lesson" → Modal opens
2. Enter title (required)
3. Select course (required)
4. Optionally select template (pre-populates components)
5. Click "Create Lesson" → Redirects to editor

**Template Behaviors**:
- **Blank**: Creates lesson with metadata only
- **Dialog Focused**: Pre-creates 3 empty dialog placeholders
- **Grammar Focused**: Pre-creates 1 grammar concept placeholder + 5 exercise placeholders
- **Vocab Focused**: Pre-creates 20 vocab item placeholders
- **Reading Focused**: Pre-creates 1 reading placeholder + reading comprehension exercises

---

### 3. Lesson Editor - Main Layout (`/author/lessons/:id/edit`)

**Purpose**: Primary authoring interface with tab-based navigation

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ← Back to My Lessons              Introduction to SER          [DRAFT]      │
│                                                          Saved 2 minutes ago  │
├─────────────────┬────────────────────────────────────────────────────────────┤
│                 │                                                             │
│  📋 Overview    │  Lesson Overview                                           │
│                 │  ┌──────────────────────────────────────────────────────┐  │
│  💬 Dialogs (2) │  │ Title *                                              │  │
│                 │  │ Introduction to SER                                  │  │
│  📖 Vocabulary  │  └──────────────────────────────────────────────────────┘  │
│      (12)       │                                                             │
│                 │  ┌──────────────────────────────────────────────────────┐  │
│  📚 Grammar (1) │  │ Overview (Markdown supported)                        │  │
│                 │  │                                                      │  │
│  ✏️ Exercises   │  │ Learn to use the verb SER (to be) in present tense. │  │
│      (3)        │  │ This lesson covers:                                 │  │
│                 │  │ - Basic SER conjugations                            │  │
│  📕 Readings    │  │ - Common usage patterns                             │  │
│      (0)        │  │ - Practice with real conversations                  │  │
│                 │  │                                              [B I ~] │  │
│──────────────── │  └──────────────────────────────────────────────────────┘  │
│                 │                                                             │
│  🔍 Preview     │  Course: Spanish A1                    XP Value: 100       │
│                 │  Sequence Order: 1                                          │
│  ✅ Publish     │                                                             │
│                 │                                                             │
└─────────────────┴────────────────────────────────────────────────────────────┘
```

**Design Notes**:
- Left sidebar: Fixed navigation with component counts
- Main area: Active tab content
- Top bar: Breadcrumb, lesson title, status badge, autosave indicator
- Tab badges show count of items in each section
- Red dot on tabs with validation errors

**Keyboard Shortcuts**:
- `Cmd/Ctrl + S`: Save (though autosave is active)
- `Cmd/Ctrl + P`: Jump to Publish tab
- `Cmd/Ctrl + Shift + P`: Preview mode
- `Cmd/Ctrl + 1-7`: Switch tabs

---

### 4. Dialog Builder Tab

**Purpose**: Create and manage multiple dialogs with exchanges

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  💬 Dialogs                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [+ Add Dialog]                                                               │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Dialog 1: Meeting Someone New                              [Edit] [🗑️]  │ │
│  │ Setting: Coffee shop                                                     │ │
│  │ ─────────────────────────────────────────────────────────────────────── │ │
│  │ 👤 Ana:    Hola, soy Ana. ¿Cómo te llamas?                              │ │
│  │           Hi, I'm Ana. What's your name?                                │ │
│  │                                                                          │ │
│  │ 👤 Carlos: Mucho gusto, Ana. Me llamo Carlos.                           │ │
│  │           Nice to meet you, Ana. My name is Carlos.                     │ │
│  │                                                                          │ │
│  │ 👤 Ana:    Encantada, Carlos.                                            │ │
│  │           Pleased to meet you, Carlos.                                  │ │
│  │                                                                          │ │
│  │ [Collapse] [3 exchanges]                                                │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Dialog 2: Asking About Origin                              [Edit] [🗑️]  │ │
│  │ Setting: Continuation of conversation                                    │ │
│  │ ─────────────────────────────────────────────────────────────────────── │ │
│  │ 👤 Carlos: ¿De dónde eres, Ana?                                         │ │
│  │           Where are you from, Ana?                                      │ │
│  │                                                                          │ │
│  │ [Expand to see 4 more exchanges]                                        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Dialog Edit Mode** (when clicking Edit):

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Edit Dialog: Meeting Someone New                          [Save] [Cancel]  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Context (what's happening?)                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Meeting someone new at a coffee shop                                   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  Setting (physical location)                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Coffee shop                                                            │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  Exchanges                                                    [+ Add Exchange]│
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ [☰] Exchange 1                                                   [🗑️] │  │
│  │ Speaker: [Ana          ▼]                                             │  │
│  │ Spanish: Hola, soy Ana. ¿Cómo te llamas?                              │  │
│  │ English: Hi, I'm Ana. What's your name?                               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ [☰] Exchange 2                                                   [🗑️] │  │
│  │ Speaker: [Carlos       ▼]                                             │  │
│  │ Spanish: Mucho gusto, Ana. Me llamo Carlos.                           │  │
│  │ English: Nice to meet you, Ana. My name is Carlos.                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ [☰] Exchange 3                                                   [🗑️] │  │
│  │ Speaker: [Ana          ▼]                                             │  │
│  │ Spanish: Encantada, Carlos.                                           │  │
│  │ English: Pleased to meet you, Carlos.                                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│                                                    [Cancel]  [Save Dialog]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Interaction Notes**:
- Drag [☰] handle to reorder exchanges
- Speaker dropdown: Auto-remembers speakers used in this dialog
- Auto-expands text areas as you type
- Delete confirmation: "Are you sure? This will delete the entire dialog."

---

### 5. Vocabulary Manager Tab

**Purpose**: Add and manage vocabulary items for the lesson

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📖 Vocabulary (12 items)                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Quick Add                                                                    │
│  ┌──────────────┬──────────────┬──────────┬──────────┬────────┬──────────┐  │
│  │ Spanish      │ English      │ Part of  │ Level    │ New?   │          │  │
│  │              │              │ Speech   │          │        │          │  │
│  │ [ser______]  │ [to be____]  │ [verb ▼] │ [A1  ▼]  │ [✓]    │ [+ Add]  │  │
│  └──────────────┴──────────────┴──────────┴──────────┴────────┴──────────┘  │
│                                                                               │
│  Or search existing: ┌────────────────────────┐ [🔍 Search Library]          │
│                      │ hola...                │                              │
│                      └────────────────────────┘                              │
│                                                                               │
│  Vocabulary List                                           [Bulk Import ⬇]  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ ser → to be                    [verb] [A1] [⭐ New]              [🗑️]   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ estar → to be                  [verb] [A1] [⭐ New]              [🗑️]   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ hola → hello                   [interjection] [A1] [Review]      [🗑️]   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ soy → I am                     [verb form] [A1] [⭐ New]         [🗑️]   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ eres → you are                 [verb form] [A1] [⭐ New]         [🗑️]   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ estudiante → student           [noun] [A1] [⭐ New]              [🗑️]   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ de → from, of                  [preposition] [A1] [Review]       [🗑️]   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Bulk Import Modal** (when clicking "Bulk Import"):

```
┌─────────────────────────────────────────────────────────┐
│  Bulk Import Vocabulary                         [✕]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Paste tab-separated or CSV data:                       │
│  Format: Spanish [tab] English [tab] Part of Speech     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ser      to be         verb                        │ │
│  │ estar    to be         verb                        │ │
│  │ hola     hello         interjection                │ │
│  │ soy      I am          verb form                   │ │
│  │                                                    │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Default settings for imported items:                    │
│  Level: [A1 ▼]   Mark as new: [✓]                       │
│                                                          │
│                            [Cancel]  [Import 4 Items]   │
└─────────────────────────────────────────────────────────┘
```

**Design Notes**:
- Quick add for single items (most common)
- Search library to avoid duplicates
- Bulk import for efficiency (paste from spreadsheet)
- Visual distinction between "New" (⭐) and "Review" vocabulary
- Inline editing not shown but available on double-click

---

### 6. Grammar Selector Tab

**Purpose**: Link or create grammar concepts for the lesson

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📚 Grammar Concepts (1)                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [+ Link Existing Concept]  [+ Create New Concept]                           │
│                                                                               │
│  Linked Concepts                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ SER - Present Tense                                         [Edit] [🗑️] │ │
│  │ ───────────────────────────────────────────────────────────────────────│ │
│  │ Introduction to SER conjugation in present tense.                      │ │
│  │                                                                         │ │
│  │ Conjugations:                                                           │ │
│  │ - yo soy (I am)                                                         │ │
│  │ - tú eres (you are, informal)                                           │ │
│  │ - él/ella/usted es (he/she is, you are formal)                          │ │
│  │ - nosotros somos (we are)                                               │ │
│  │ - vosotros sois (you all are, Spain)                                    │ │
│  │ - ellos/ellas/ustedes son (they/you all are)                            │ │
│  │                                                                         │ │
│  │ [Show Full Content]                                                     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Create New Concept Modal**:

```
┌───────────────────────────────────────────────────────────────────┐
│  Create Grammar Concept                                   [✕]     │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Name (slug for internal use) *                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ verb_ser_present                                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Display Name (shown to learners) *                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ SER - Present Tense                                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Short Description                                                 │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Introduction to SER conjugation in present tense             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Content (Markdown) *                                              │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ # SER - To Be (Present Tense)                       [B I ~]  │ │
│  │                                                              │ │
│  │ SER is one of two verbs meaning "to be" in Spanish.         │ │
│  │                                                              │ │
│  │ ## Conjugations                                             │ │
│  │ - yo **soy** (I am)                                         │ │
│  │ - tú **eres** (you are)                                     │ │
│  │ ...                                           [Preview Tab]  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│                                        [Cancel]  [Create & Link]  │
└───────────────────────────────────────────────────────────────────┘
```

**Link Existing Concept Modal**:

```
┌─────────────────────────────────────────────────────────┐
│  Link Grammar Concept                           [✕]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Search concepts:                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔍 ser                                             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Results (8):                                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ⚪ SER - Present Tense                             │ │
│  │    Introduction to SER conjugation...              │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ ⚪ SER vs ESTAR                                     │ │
│  │    Differences between the two "to be" verbs...    │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ ⚪ SER - Preterite Tense                           │ │
│  │    Past tense conjugation of SER...               │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ ⚪ SER with Professions                            │ │
│  │    Using SER to describe occupations...           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│                               [Cancel]  [Link Selected] │
└─────────────────────────────────────────────────────────┘
```

**Design Notes**:
- Markdown editor with live preview tab
- Concepts are reusable across lessons
- Search prevents duplicate concept creation
- Rich content support (tables, lists, code blocks)

---

### 7. Exercise Builder Tab

**Purpose**: Create exercises to test lesson concepts

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ✏️ Exercises (3)                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Exercise Type: [Fill in the Blank ▼] [Multiple Choice] [Translation]        │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ New Fill-in-the-Blank Exercise                                          │ │
│  │                                                                          │ │
│  │ Prompt (use ___ for blank):                                             │ │
│  │ ┌──────────────────────────────────────────────────────────────────────┐│ │
│  │ │ Yo ___ estudiante.                                                   ││ │
│  │ └──────────────────────────────────────────────────────────────────────┘│ │
│  │                                                                          │ │
│  │ Answer:                                                                  │ │
│  │ ┌──────────────────────────────────────────────────────────────────────┐│ │
│  │ │ soy                                                                  ││ │
│  │ └──────────────────────────────────────────────────────────────────────┘│ │
│  │                                                                          │ │
│  │ XP Value: [10] points                                                    │ │
│  │                                                                          │ │
│  │                                                         [Add Exercise]   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Existing Exercises                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. Fill Blank: "Yo ___ estudiante." → soy             [Edit] [Preview] │ │
│  │    XP: 10                                                         [🗑️]  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 2. Multiple Choice: "How do you say 'you are'?"        [Edit] [Preview] │ │
│  │    Answer: eres   Options: soy, eres, es, somos                   [🗑️]  │ │
│  │    XP: 10                                                                │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 3. Translation: "Ella es profesora" → "She is a teacher"               │ │
│  │    XP: 15                                             [Edit] [Preview]  │ │
│  │                                                                    [🗑️]  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Multiple Choice Exercise Form** (when type is selected):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ New Multiple Choice Exercise                                                │
│                                                                              │
│ Prompt/Question:                                                             │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ How do you say "you are" (informal)?                                     ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ Correct Answer:                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ eres                                                                     ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ Other Options (distractors):                                                 │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ 1. soy                                                              [🗑️] ││
│ │ 2. es                                                               [🗑️] ││
│ │ 3. somos                                                            [🗑️] ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│ [+ Add Another Option]                                                       │
│                                                                              │
│ XP Value: [10] points                                                        │
│                                                                              │
│                                                            [Add Exercise]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Translation Exercise Form**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ New Translation Exercise                                                     │
│                                                                              │
│ Translation Direction: [Spanish → English ▼] [English → Spanish]            │
│                                                                              │
│ Spanish Text:                                                                │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ Ella es profesora de matemáticas.                                        ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ English Text:                                                                │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ She is a math teacher.                                                   ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ XP Value: [15] points                                                        │
│                                                                              │
│                                                            [Add Exercise]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Exercise Preview Modal** (when clicking Preview):

```
┌─────────────────────────────────────────────────────────┐
│  Exercise Preview                               [✕]     │
│  (As learner would see it)                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Fill in the blank:                                      │
│                                                          │
│  Yo _____________ estudiante.                            │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [Your answer...]                                   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Check Answer]                                          │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│  Correct answer: soy                                     │
│  XP for this exercise: 10                                │
│                                                          │
│                                               [Close]    │
└─────────────────────────────────────────────────────────┘
```

**Design Notes**:
- Type selector at top switches form layouts
- Preview shows exercise exactly as learner sees it
- Drag to reorder exercises (not shown in mockup)
- XP values editable per exercise

---

### 8. Publish Panel Tab

**Purpose**: Validate lesson completeness and publish

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ✅ Publish Lesson                                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Pre-Publish Checklist                                                        │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ ✅ Has title: "Introduction to SER"                                     │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ✅ Has overview content                                                 │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ✅ Has at least one component:                                          │ │
│  │    ├─ 2 dialogs ✓                                                       │ │
│  │    ├─ 12 vocabulary items ✓                                             │ │
│  │    ├─ 1 grammar concept ✓                                               │ │
│  │    ├─ 3 exercises ✓                                                     │ │
│  │    └─ 0 readings (optional)                                             │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ✅ All exercises have correct answers                                   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ⚠️  Recommendation: Add at least one reading for a complete lesson      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Lesson Quality Score: ████████░░ 8/10                                        │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Publishing will:                                                         │ │
│  │ • Make this lesson visible to all learners                               │ │
│  │ • Add it to the "Spanish A1" course in sequence position 1               │ │
│  │ • Award 100 XP to learners who complete it                               │ │
│  │ • You can continue editing after publishing                              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│                                                                               │
│                                           [Preview First]  [Publish Lesson]  │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Publish Confirmation Dialog**:

```
┌─────────────────────────────────────────────────────────┐
│  Publish "Introduction to SER"?                 [✕]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  This lesson will become visible to all learners in     │
│  the Spanish A1 course.                                  │
│                                                          │
│  You can continue editing after publishing, but changes  │
│  will be immediately visible to learners.                │
│                                                          │
│  Are you sure you want to publish?                       │
│                                                          │
│                          [Cancel]  [Yes, Publish]       │
└─────────────────────────────────────────────────────────┘
```

**Success State**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ✅ Published!                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 🎉 Lesson "Introduction to SER" is now live!                            │ │
│  │                                                                          │ │
│  │ Learners in the Spanish A1 course can now access this lesson.           │ │
│  │                                                                          │ │
│  │ [View Live Lesson]  [Back to My Lessons]  [Create Another]              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Next Steps:                                                                  │
│  • Share this lesson with learners                                            │
│  • Monitor completion rates in analytics (coming soon)                        │
│  • Continue refining based on learner feedback                                │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Validation Failure State** (example):

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ✅ Publish Lesson                                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Pre-Publish Checklist                                                        │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ ✅ Has title: "Possessive Adjectives"                                   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ❌ Has overview content (REQUIRED)                                       │ │
│  │    → Add an overview in the Overview tab                                │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ❌ Has at least one component (REQUIRED)                                 │ │
│  │    → Add dialogs, vocabulary, grammar, exercises, or readings           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Cannot Publish Yet                                                           │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ This lesson needs a bit more work before it can be published.           │ │
│  │ Please address the errors above.                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│                                             [Publish Lesson] (disabled)      │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Design Notes**:
- Real-time validation checklist
- Quality score encourages completeness without blocking
- Warnings vs errors (can publish with warnings)
- Clear next steps after publishing
- Disabled publish button when validation fails with clear guidance

---

### 9. Preview Mode

**Purpose**: See lesson exactly as learners will experience it

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  PREVIEW MODE                                          [Exit Preview]        │
│  You're viewing this lesson as a learner would see it                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Introduction to SER                                          📚 Spanish A1  │
│  100 XP                                                                       │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 📋 Overview                                                              │ │
│  │                                                                          │ │
│  │ Learn to use the verb SER (to be) in present tense.                     │ │
│  │ This lesson covers:                                                      │ │
│  │ - Basic SER conjugations                                                │ │
│  │ - Common usage patterns                                                 │ │
│  │ - Practice with real conversations                                      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 💬 Conversation: Meeting Someone New                                    │ │
│  │                                                                          │ │
│  │ [🔊] Ana: Hola, soy Ana. ¿Cómo te llamas?                                │ │
│  │          Hi, I'm Ana. What's your name?                                 │ │
│  │                                                                          │ │
│  │ [🔊] Carlos: Mucho gusto, Ana. Me llamo Carlos.                          │ │
│  │             Nice to meet you, Ana. My name is Carlos.                   │ │
│  │                                                                          │ │
│  │ [Show Translation] [Repeat]                                             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 📖 Vocabulary (12 words)                                     [Study All] │ │
│  │                                                                          │ │
│  │ ser → to be                    [verb] ⭐ New                             │ │
│  │ soy → I am                     [verb form] ⭐ New                        │ │
│  │ hola → hello                   [interjection]                           │ │
│  │ ...and 9 more                                                           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  [Continue to Exercises →]                                                    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Design Notes**:
- Banner at top indicates preview mode
- No authoring controls visible
- Exactly matches learner experience
- Can interact with components (play audio, etc.)
- Exit preview returns to editor

---

## Frontend Component Structure

```
app/
├── author/
│   ├── lessons/
│   │   ├── page.tsx                    # MyLessons dashboard
│   │   ├── new/
│   │   │   └── page.tsx                # New lesson (template selector)
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx            # LessonEditor
│   └── layout.tsx                      # Author layout (auth required)

components/
├── lesson-editor/
│   ├── LessonEditor.tsx                # Main container
│   ├── MetadataPanel.tsx               # Title, overview, etc.
│   ├── DialogBuilder.tsx               # Dialog creation/editing
│   │   ├── DialogList.tsx
│   │   ├── DialogForm.tsx
│   │   └── ExchangeEditor.tsx
│   ├── VocabularyManager.tsx           # Vocab addition/removal
│   │   ├── VocabSearch.tsx
│   │   ├── VocabForm.tsx
│   │   └── VocabList.tsx
│   ├── GrammarSelector.tsx             # Grammar concept linking
│   │   ├── ConceptSearch.tsx
│   │   ├── ConceptForm.tsx
│   │   └── ConceptList.tsx
│   ├── ExerciseBuilder.tsx             # Exercise creation
│   │   ├── ExerciseTypeSelector.tsx
│   │   ├── FillBlankForm.tsx
│   │   ├── MultipleChoiceForm.tsx
│   │   ├── TranslationForm.tsx
│   │   └── ExerciseList.tsx
│   ├── ReadingLinker.tsx               # Reading association
│   │   ├── ReadingSearch.tsx
│   │   ├── ReadingForm.tsx
│   │   └── ReadingList.tsx
│   ├── PublishPanel.tsx                # Validation + publish
│   └── PreviewMode.tsx                 # Learner view preview
└── ui/
    ├── MarkdownEditor.tsx              # Reusable markdown input
    ├── DragDropList.tsx                # Reusable drag-drop list
    └── AutosaveIndicator.tsx           # "Saving..." / "Saved" indicator
```

---

## Testing Strategy

### Unit Tests
- [ ] API route handlers
- [ ] Validation logic (publish requirements)
- [ ] RLS policy verification
- [ ] Component rendering

### Integration Tests
- [ ] Full lesson creation flow
- [ ] Component addition/removal
- [ ] Draft → publish workflow
- [ ] Multi-user permissions

### E2E Tests
- [ ] Create lesson as author
- [ ] Add all component types
- [ ] Publish lesson
- [ ] Verify visibility (draft vs published)
- [ ] Delete draft lesson

---

## Performance Considerations

### Database
- Indexes on `status`, `author_id` for fast filtering
- Efficient joins for lesson + components query
- Consider caching for published lessons

### API
- Pagination for lesson lists
- Lazy loading of components (load on tab open?)
- Debounced autosave to reduce writes

### Frontend
- Code splitting (each builder component lazy loaded)
- Optimistic updates (UI updates before API confirm)
- Local storage for draft recovery (if session crashes)

---

## Success Criteria

**MVP Complete When**:
1. Author can create draft lesson with title only
2. Author can add dialog, vocab, exercise, grammar, reading
3. Author can publish lesson (makes visible to learners)
4. Published lessons appear in course view
5. Draft lessons only visible to author
6. Author can edit and re-publish lessons
7. Author can delete draft lessons

**Quality Gates**:
- All RLS policies tested and verified
- Autosave works reliably
- No data loss on navigation/refresh
- Publish validation prevents incomplete lessons
- UI is responsive and intuitive

---

## Next Steps After MVP

1. **Analytics**: Track authoring activity, identify pain points
2. **Templates**: Pre-built lesson structures for common patterns
3. **Collaboration**: Multi-author workflows, review/approval
4. **Bulk Import**: YAML → draft lessons for review
5. **AI Assistance**: Suggest vocab from dialog, auto-generate exercises
