# Lesson Planner System

**Date**: 2025-10-31
**Status**: Planning Phase
**Priority**: Next Major Feature (Post-Epic 8)

---

## 🎯 Vision

Transform Interlinear from a **reading practice tool** into a **comprehensive lesson delivery platform** by adding AI-powered lesson generation from raw texts.

### Current State
```
User → Paste Text → Interactive Reading → Vocabulary Tracking
```

### Target State
```
User → Provide Text + Level + Objectives → AI-Generated Lesson → Structured Learning Experience
```

---

## 📐 Core Concepts

### **Two Separate Systems**

#### **1. Library (Existing)**
- **Purpose**: Free-form reading practice
- **Features**: Click-to-define, vocabulary tracking, text-to-speech
- **Use Case**: "I want to read this article for practice"

#### **2. Lessons (NEW)**
- **Purpose**: Structured learning with objectives
- **Features**: Reading + Exercises + Assessment + Flashcards + Tutor scenarios
- **Use Case**: "I want to learn specific grammar/vocabulary from this text"

**Relationship**: Lessons **derive from** Library texts but are separate entities with added structure.

---

## 🎨 UI Structure

### Navigation
```
┌─────────┬─────────┬────────────┬────────────┐
│ Library │ Lessons │ Vocabulary │ Flashcards │
└─────────┴─────────┴────────────┴────────────┘
```

### Lessons Tab Features
- Browse available lessons (own + published by others)
- Filter by level (A1-C2), language, topic
- View lesson details (objectives, time estimate, difficulty)
- Start lesson → Viewer interface
- Track progress (reading, exercises, assessment scores)
- "Create Lesson from Text" button → Text-to-Lesson interface

---

## 📝 Lesson Structure (Draft)

```typescript
interface Lesson {
  // Metadata
  id: UUID
  created_by: UUID
  title: string
  language: 'spanish' | 'old_norse' | ...
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  estimated_time_minutes: number
  difficulty_score: number  // 1-10

  // Learning design
  learning_objectives: string[]  // ["Learn past tense", "Expand food vocab"]

  // Core content
  source_text: string  // The reading material
  vocabulary_focus: VocabularyItem[]  // Key words to master

  // Generated components
  flashcard_deck_id: UUID  // Cloze deletions + vocab cards (Epic 8)
  exercises: Exercise[]  // Multiple types (see below)
  assessment: Assessment  // Final quiz to test mastery
  tutor_scenario: TutorScenario  // Conversation practice setup

  // Status
  is_published: boolean
  created_at: timestamp
  updated_at: timestamp
}

interface VocabularyItem {
  word: string
  definition: string
  part_of_speech: string
  example_sentence: string
  audio_url?: string
}

interface Exercise {
  id: UUID
  type: 'multiple_choice' | 'fill_blank' | 'translation' | 'grammar_identification'
  order_number: number
  question: any  // Flexible structure per type
  correct_answer: any
  explanation: string
  difficulty: 1 | 2 | 3 | 4 | 5
}

interface Assessment {
  questions: Exercise[]  // Subset of exercises or separate
  passing_score: number  // Percentage (e.g., 70)
  time_limit_minutes?: number
}

interface TutorScenario {
  topic: string  // "Describing your living situation"
  vocabulary_constraints: string[]  // Use lesson vocabulary
  grammar_focus: string[]  // Practice specific structures
  conversation_starters: string[]  // AI initial prompts
  level: string  // Match lesson level
}
```

---

## 🧪 Example Lesson (To Be Expanded)

### **Viking Language Chapter 1: The Farm**

**Level**: A2
**Estimated Time**: 45 minutes
**Difficulty**: 6/10

**Learning Objectives**:
- Recognize Old Norse noun cases (nominative, accusative, dative)
- Build vocabulary for farm/household items (10 words)
- Understand basic sentence structure (Subject-Verb-Object)

**Source Text**:
```
Bóndi bjó á bæ. Hann átti konu ok börn.
Konan het Þóra. Börn váru þrjú.
Bóndi átti hesta ok kýr.

(A farmer lived on a farm. He had a wife and children.
The wife was named Þóra. There were three children.
The farmer had horses and cows.)
```

**Vocabulary Focus** (10 words):
1. bóndi (farmer) - noun, masculine, nominative
2. bjó (lived) - verb, past tense of "búa"
3. bæ (farm) - noun, dative case
4. átti (had) - verb, past tense of "eiga"
5. kona (wife) - noun, feminine, accusative
6. börn (children) - noun, neuter, plural
7. hestr (horse) - noun, masculine
8. kýr (cow) - noun, feminine
9. het (was named) - verb, past tense
10. þrjú (three) - number

**Flashcard Deck** (15 cards):
- 8 cloze deletion cards from source text
- 5 vocabulary cards (word → definition + example)
- 2 grammar concept cards (noun cases)

**Exercises** (8 total):

*Reading Comprehension (3)*:
1. Who lived on the farm? (multiple choice: farmer/wife/children/all)
2. Fill in: "Bóndi ___ á bæ" (options: bjó/átti/het)
3. How many children did they have? (multiple choice: 1/2/3/4)

*Grammar Practice (3)*:
4. Identify the case of "bæ" in "bjó á bæ" (nominative/accusative/dative)
5. Which word is in accusative case? (multiple choice from sentence 1)
6. Conjugate "búa" in past tense: "Hann ___ á bæ" (fill blank: bjó)

*Translation (2)*:
7. Translate to English: "Konan het Þóra" (open-ended, LLM graded)
8. Translate to Old Norse: "The farmer had cows" (open-ended, LLM graded)

**Assessment** (5 questions):
- Mix of above types
- Passing score: 70%
- Unlocks next lesson on pass

**Tutor Scenario**:
- Topic: "Describe your household/family in Old Norse"
- Vocabulary: Use lesson words (bóndi, kona, börn, etc.)
- Grammar: Practice noun cases in sentences
- Conversation starters:
  - "Hvar býrðu?" (Where do you live?)
  - "Átt þú börn?" (Do you have children?)

---

## 🗄️ Database Schema

```sql
-- Lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id),

  -- Metadata
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'spanish',
  level TEXT CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  estimated_time_minutes INT,
  difficulty_score INT CHECK (difficulty_score BETWEEN 1 AND 10),

  -- Learning design
  learning_objectives JSONB NOT NULL,  -- ["objective 1", "objective 2"]

  -- Core content
  source_text TEXT NOT NULL,
  vocabulary_focus JSONB,  -- [{word, definition, part_of_speech, example}]

  -- Generated components
  flashcard_deck_id UUID REFERENCES flashcard_decks(id),
  tutor_scenario JSONB,  -- {topic, vocabulary_constraints, grammar_focus, ...}

  -- Status
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises table
CREATE TABLE lesson_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  order_number INT NOT NULL,

  -- Exercise definition
  type TEXT NOT NULL CHECK (type IN (
    'multiple_choice',
    'fill_blank',
    'translation',
    'grammar_identification'
  )),
  question JSONB NOT NULL,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  difficulty INT CHECK (difficulty BETWEEN 1 AND 5),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment configuration (per lesson)
CREATE TABLE lesson_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  passing_score INT CHECK (passing_score BETWEEN 0 AND 100),
  time_limit_minutes INT,
  exercise_ids UUID[],  -- References to lesson_exercises
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- Student progress tracking
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  lesson_id UUID REFERENCES lessons(id),

  -- Progress
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  reading_completed BOOLEAN DEFAULT false,
  exercises_completed JSONB,  -- {exercise_id: {completed, score, attempts}}
  assessment_score DECIMAL,
  assessment_passed BOOLEAN DEFAULT false,

  UNIQUE(user_id, lesson_id)
);

-- RLS Policies
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Users can view published lessons or their own
CREATE POLICY "View published or own lessons"
  ON lessons FOR SELECT
  USING (is_published = true OR created_by = auth.uid());

-- Users can create their own lessons
CREATE POLICY "Create own lessons"
  ON lessons FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can only view their own progress
CREATE POLICY "View own progress"
  ON lesson_progress FOR SELECT
  USING (user_id = auth.uid());
```

---

## 🚀 Implementation Roadmap

### **Phase 1: Define Perfect Lesson** (CURRENT - Planning)
- [ ] Create 2-3 complete example lessons manually
  - [ ] Viking Language Chapter 1 (above template)
  - [ ] Spanish A2 lesson (TBD)
  - [ ] One more for variety (TBD)
- [ ] Lock in final lesson structure/schema
- [ ] Document as target for AI generation

### **Phase 2: Build Lesson Viewer** (4-6 hours)
**Goal**: View a complete lesson with all components

**Files to Create**:
- `app/lessons/page.tsx` - Browse lessons
- `app/lessons/[id]/page.tsx` - Lesson viewer
- `components/lessons/LessonHeader.tsx` - Title, objectives, metadata
- `components/lessons/ReadingSection.tsx` - Source text (reuse reader components)
- `components/lessons/ExerciseList.tsx` - Render different exercise types
- `components/lessons/ExerciseCard.tsx` - Individual exercise UI
- `components/lessons/AssessmentSection.tsx` - Quiz interface
- `components/lessons/ProgressTracker.tsx` - Track completion

**Database**:
- Run migrations for lessons schema
- Insert example lessons manually
- Test viewer with real data

**Success Criteria**:
- ✅ Can view complete lesson with all sections
- ✅ Reading section uses existing reader components
- ✅ Exercises render correctly for all types
- ✅ Assessment shows pass/fail status
- ✅ Progress saves to database

---

### **Phase 3: Text-to-Lesson Interface** (6-8 hours)
**Goal**: Input text → AI generates complete lesson

**NOT a "creator UI"** - Just a transformation interface:

```
┌──────────────────────────────────────────┐
│  Text-to-Lesson Generator                │
├──────────────────────────────────────────┤
│                                          │
│  1. Input Text                           │
│     ┌────────────────────────────────┐   │
│     │ Paste or upload text...       │   │
│     │                               │   │
│     └────────────────────────────────┘   │
│                                          │
│  2. Learning Parameters                  │
│     Level: [A1] [A2] [B1] [B2] [C1] [C2]│
│     Language: [Spanish ▼]                │
│     Time estimate: [45 minutes]          │
│                                          │
│  3. Learning Objectives                  │
│     ┌────────────────────────────────┐   │
│     │ • Learn past tense             │   │
│     │ • Expand food vocabulary       │   │
│     │ + Add objective                │   │
│     └────────────────────────────────┘   │
│                                          │
│  [Generate Lesson] ← AI                  │
│                                          │
│  4. Preview & Edit Generated Lesson      │
│     (Shows complete lesson in viewer)    │
│                                          │
│     [Regenerate] [Save Draft] [Publish]  │
└──────────────────────────────────────────┘
```

**Files to Create**:
- `app/lessons/create/page.tsx` - Text-to-lesson interface
- `lib/services/lesson-generator.ts` - AI generation service
- `app/api/lessons/generate/route.ts` - Generation endpoint

**LangChain Integration**:
```typescript
// lib/services/lesson-generator.ts
export class LessonGenerator {
  async generateFromText(input: {
    text: string
    level: LanguageLevel
    language: string
    objectives: string[]
    estimatedTime: number
  }): Promise<Lesson> {

    // Parallel generation
    const [
      vocabularyFocus,
      exercises,
      flashcards,
      tutorScenario
    ] = await Promise.all([
      this.extractVocabulary(input),
      this.generateExercises(input),
      this.generateFlashcards(input),
      this.createTutorScenario(input)
    ])

    return {
      title: await this.generateTitle(input.text),
      source_text: input.text,
      level: input.level,
      language: input.language,
      learning_objectives: input.objectives,
      estimated_time_minutes: input.estimatedTime,
      vocabulary_focus: vocabularyFocus,
      exercises,
      flashcard_deck_id: await this.saveFlashcards(flashcards),
      tutor_scenario: tutorScenario,
      difficulty_score: await this.calculateDifficulty(input)
    }
  }

  private async generateExercises(input): Promise<Exercise[]> {
    // LangChain tool for exercise generation
    // Uses example lessons as few-shot examples
    // Returns mix of exercise types
  }
}
```

**Success Criteria**:
- ✅ Input text + parameters → Complete lesson generated
- ✅ Lesson matches structure of manual examples
- ✅ Preview shows in lesson viewer
- ✅ Can save and publish generated lesson
- ✅ Regenerate button works for tweaking

---

### **Phase 4: Course Composition** (Future)
**Defer until lesson system is solid**

- Group lessons into courses
- Add prerequisites and sequencing
- Student enrollment system
- Course-level progress tracking

---

## 💡 Key Design Decisions

### **1. Lessons Derive From Library**
- Lessons are separate entities, not just "enhanced library texts"
- Can import from library as convenience feature
- Lesson contains full text (no external reference)
- **Why**: Clean separation of concerns, lessons are portable

### **2. Viewer First, Then Generator**
- Build viewer to lock in final deliverable format
- Use viewer to validate example lessons
- Generator targets the proven viewer structure
- **Why**: Don't build generator without knowing target

### **3. Text-to-Lesson, Not Creator UI**
- One-shot transformation interface, not complex editor
- Focus on AI generation quality
- Edit/regenerate, don't manually compose
- **Why**: Leverage AI strength, minimize manual work

### **4. Exercise Types (MVP)**
Priority order for Phase 2:
1. ✅ **Multiple Choice** - Easy to generate and grade
2. ✅ **Fill-in-Blank** - Tests recall, auto-gradable
3. ✅ **Cloze Deletion Flashcards** - Already built (Epic 8)
4. ✅ **Tutor Conversation** - Already built (tutor mode)
5. ⏳ **Translation** - Requires LLM grading (Phase 3)
6. ⏳ **Grammar Identification** - Language-specific (Phase 3)

---

## 📊 Use Cases

### **Use Case 1: Textbook Accompaniment (Viking Language)**
**Scenario**: Create structured lessons for Jesse Byock's Viking Language textbook

**Workflow**:
1. Type/paste Chapter 1 text
2. Set level: A2, Language: Old Norse
3. Set objectives: "Learn noun cases, farm vocabulary"
4. Generate lesson
5. Review generated exercises (should match textbook pedagogy)
6. Publish lesson
7. Students work through lesson (reading + exercises + flashcards + tutor)

**Value**: Transform static textbook into interactive learning experience

---

### **Use Case 2: Custom Spanish Lessons**
**Scenario**: Create A2-level lessons from authentic Spanish articles

**Workflow**:
1. Find interesting article (e.g., recipe, news story)
2. Paste into lesson generator
3. Set level: A2, Language: Spanish
4. Set objectives: "Learn cooking vocabulary, practice imperative mood"
5. Generate lesson
6. Students get: article + definitions + exercises + conversation practice

**Value**: Learn from authentic materials with structured support

---

### **Use Case 3: Self-Study Course Creation**
**Scenario**: Language teacher creates complete course from readings

**Future workflow** (Phase 4):
1. Create 10 lessons using text-to-lesson generator
2. Group lessons into course
3. Set prerequisites (Lesson 2 requires Lesson 1 complete)
4. Publish course
5. Students enroll and progress through structured path

**Value**: Rapid course creation with AI assistance

---

## 🎯 Next Actions

### **Immediate (Tomorrow)**
- [ ] User provides complete example lesson structure
  - Viking Language Chapter 1 (full detail)
  - Exercise examples with exact formats
  - Assessment structure
- [ ] Finalize lesson schema based on examples
- [ ] Begin Phase 2 (Viewer implementation)

### **This Week**
- [ ] Build lesson viewer and test with example lessons
- [ ] Lock in UI/UX for lesson experience
- [ ] Validate lesson structure is complete

### **Next Week**
- [ ] Build text-to-lesson generator
- [ ] Test with multiple text types (Old Norse, Spanish, etc.)
- [ ] Iterate on generation quality

---

## 📝 Open Questions

1. **Exercise Difficulty Calibration**: How to ensure generated exercises match lesson level?
2. **LLM Grading**: For translation/open-ended exercises, what's the grading rubric?
3. **Lesson Length**: Should there be min/max constraints on text length?
4. **Multi-Text Lessons**: Should lessons support multiple reading passages?
5. **Adaptive Difficulty**: Should exercises get harder as student progresses?

---

## 🔗 Related Documentation

- [Epic 8: Flashcard System](./prd/epic-8-flashcards-srs.md) - Cloze deletion cards
- [Epic 7: Tutor Mode](./prd/epic-7-tutor-ui.md) - Conversation scenarios
- [Library System](./prd/epic-5-library-system.md) - Text storage and reading
- [Architecture Overview](./architecture/tech-stack.md) - System design

---

**Status**: Awaiting detailed lesson examples from user to finalize structure 🚀
